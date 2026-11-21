import { Schema, model } from "mongoose";

const smsVerificationSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  target: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: `user`,
      required: true,
    },
    workshops: {
      workshopId: {
        type: Schema.Types.ObjectId,
        ref: `workshops`,
        default: null,
      },
    },
    events: {
      eventId: {
        type: Schema.Types.ObjectId,
        ref: `events`,
        default: null,
      },
    },
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["workshop_owner", "event_owner"],
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Number,
    required: true,
  },
  expiresAt: {
    type: Number,
    required: true,
  },
});

export const SmsVerificationModel = model(
  `sms-verification`,
  smsVerificationSchema
);
