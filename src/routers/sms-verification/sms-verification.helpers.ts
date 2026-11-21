import mongoose from "mongoose";

import { sendSmsTurboSMS } from "../../hooks/sms";
import { SmsVerificationModel } from "./sms-verification.model";
import WorkshopModel from "../workshops/workshops.model";
import EventModel from "../events/events.model";
import UserModel from "../user/user.modal";
import { SmsVerificationResponse } from "./sms-verification.types";

const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getUserLanguage = async (userId: string): Promise<string> => {
  const user = await UserModel.findById(userId).select("languageLocal").lean();
  return user?.languageLocal || "en";
};

const sendSmsCode = async (
  phoneNumber: string,
  message: string,
  verificationId: mongoose.Types.ObjectId
): Promise<SmsVerificationResponse> => {
  const smsResult = await sendSmsTurboSMS(message, phoneNumber);
  if (!smsResult) {
    await SmsVerificationModel.deleteOne({ _id: verificationId });
    return {
      status: "error",
      reason: "Failed to send SMS",
      type: "sms_error",
    };
  }

  return { status: "success" };
};

export const sendWorkshopVerificationSms = async ({
  userId,
  workshopId,
  phoneNumber,
  now,
  startOfDay,
  codeExpiryMinutes,
  maxCodesPerDay,
}: {
  userId: string;
  workshopId: string;
  phoneNumber: string;
  now: number;
  startOfDay: number;
  codeExpiryMinutes: number;
  maxCodesPerDay: number;
}): Promise<SmsVerificationResponse> => {
  const workshop = await WorkshopModel.findOne({ _id: workshopId });
  if (!workshop)
    return {
      status: "error",
      reason: "Workshop not found",
      type: "not_found",
    };

  const phoneMatches =
    workshop.phoneNumber === phoneNumber ||
    (workshop.contacts &&
      workshop.contacts.some(
        (contact) => contact.type === "phone" && contact.value === phoneNumber
      ));
  if (!phoneMatches)
    return {
      status: "error",
      reason: "Phone number does not match workshop",
      type: "validation",
    };

  const codesToday = await SmsVerificationModel.countDocuments({
    "target.userId": userId,
    "target.workshops.workshopId": workshopId,
    createdAt: { $gte: startOfDay },
  });
  if (codesToday >= maxCodesPerDay)
    return {
      status: "error",
      reason: "Maximum codes per day reached",
      type: "limit",
    };

  await SmsVerificationModel.deleteMany({
    "target.userId": userId,
    "target.workshops.workshopId": workshopId,
    expiresAt: { $lt: now },
  });

  const code = generateCode();
  const expiresAt = now + codeExpiryMinutes * 60 * 1000;
  const _id = new mongoose.Types.ObjectId();
  await new SmsVerificationModel({
    _id,
    target: {
      userId,
      workshops: { workshopId: workshopId },
    },
    code,
    type: "workshop_owner",
    phoneNumber,
    createdAt: now,
    expiresAt,
  }).save();

  const language = await getUserLanguage(userId);
  const title = workshop.title || "";
  const message =
    language === "uk"
      ? `Ваш код підтвердження власності майстерні ${title}: ${code}`
      : `Your workshop ownership verification code for ${title}: ${code}`;

  return sendSmsCode(phoneNumber, message, _id);
};

export const sendEventVerificationSms = async ({
  userId,
  eventId,
  phoneNumber,
  now,
  startOfDay,
  codeExpiryMinutes,
  maxCodesPerDay,
}: {
  userId: string;
  eventId: string;
  phoneNumber: string;
  now: number;
  startOfDay: number;
  codeExpiryMinutes: number;
  maxCodesPerDay: number;
}): Promise<SmsVerificationResponse> => {
  const event = await EventModel.findOne({ _id: eventId });
  if (!event)
    return {
      status: "error",
      reason: "Event not found",
      type: "not_found",
    };

  const eventUser = await UserModel.findOne({ _id: event.userId }).select(
    "phoneNumber"
  );
  if (!eventUser?.phoneNumber || eventUser.phoneNumber !== phoneNumber)
    return {
      status: "error",
      reason: "Phone number does not match event",
      type: "validation",
    };

  const codesToday = await SmsVerificationModel.countDocuments({
    "target.userId": userId,
    "target.events.eventId": eventId,
    createdAt: { $gte: startOfDay },
  });
  if (codesToday >= maxCodesPerDay)
    return {
      status: "error",
      reason: "Maximum codes per day reached",
      type: "limit",
    };

  await SmsVerificationModel.deleteMany({
    "target.userId": userId,
    "target.events.eventId": eventId,
    expiresAt: { $lt: now },
  });

  const code = generateCode();
  const expiresAt = now + codeExpiryMinutes * 60 * 1000;
  const _id = new mongoose.Types.ObjectId();
  await new SmsVerificationModel({
    _id,
    target: {
      userId,
      events: { eventId: eventId },
    },
    code,
    type: "event_owner",
    phoneNumber,
    createdAt: now,
    expiresAt,
  }).save();

  const language = await getUserLanguage(userId);
  const title = event.title || "";
  const message =
    language === "uk"
      ? `Ваш код підтвердження власності події ${title}: ${code}`
      : `Your event ownership verification code for ${title}: ${code}`;

  return sendSmsCode(phoneNumber, message, _id);
};

export const verifyWorkshopSmsCode = async ({
  userId,
  workshopId,
  code,
  now,
}: {
  userId: string;
  workshopId: string;
  code: string;
  now: number;
}): Promise<SmsVerificationResponse> => {
  const verification = await SmsVerificationModel.findOne({
    "target.userId": userId,
    "target.workshops.workshopId": workshopId,
    code: code,
    expiresAt: { $gte: now },
  });
  if (!verification)
    return {
      status: "error",
      reason: "Invalid or expired code",
      type: "invalid_code",
    };

  await WorkshopModel.findOneAndUpdate(
    { _id: workshopId },
    { $set: { ownerUserId: userId } }
  );

  await SmsVerificationModel.deleteOne({ _id: verification._id });

  return { status: "success" };
};

export const verifyEventSmsCode = async ({
  userId,
  eventId,
  code,
  now,
}: {
  userId: string;
  eventId: string;
  code: string;
  now: number;
}): Promise<SmsVerificationResponse> => {
  const verification = await SmsVerificationModel.findOne({
    "target.userId": userId,
    "target.events.eventId": eventId,
    code: code,
    expiresAt: { $gte: now },
  });
  if (!verification)
    return {
      status: "error",
      reason: "Invalid or expired code",
      type: "invalid_code",
    };

  await EventModel.findOneAndUpdate(
    { _id: eventId },
    { $set: { ownerUserId: userId } }
  );

  await SmsVerificationModel.deleteOne({ _id: verification._id });

  return { status: "success" };
};
