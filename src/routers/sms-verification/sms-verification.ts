import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { verifyToken } from "../../hooks/token";
import {
  isEventSendBody,
  isEventVerifyBody,
  isWorkshopSendBody,
  isWorkshopVerifyBody,
  sendSmsVerificationSchema,
  verifySmsCodeSchema,
} from "./sms-verification.schemas";
import {
  sendEventVerificationSms,
  sendWorkshopVerificationSms,
  verifyEventSmsCode,
  verifyWorkshopSmsCode,
} from "./sms-verification.helpers";

dotenv.config();
const router = Router();

const ERROR_SERVER_FIVE_HUNDRED = 500;
const CODE_EXPIRY_MINUTES = 5;
const MAX_CODES_PER_DAY = 3;

router.post("/send/", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token)
      return res.send({
        status: "error",
        reason: "Unauthorized",
        type: "auth",
      });

    const dataToken = verifyToken(token);
    if (!dataToken)
      return res.send({
        status: "error",
        reason: "Invalid token",
        type: "auth",
      });

    const bodyValidation = sendSmsVerificationSchema.safeParse(req.body);
    if (!bodyValidation.success)
      return res.send({
        status: "error",
        reason: "Invalid request data",
        type: "validation",
      });

    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const { phoneNumber } = bodyValidation.data;

    if (isWorkshopSendBody(bodyValidation.data))
      return res.send(
        await sendWorkshopVerificationSms({
          userId: dataToken.userId,
          workshopId: bodyValidation.data.workshopId,
          phoneNumber,
          now,
          startOfDay,
          codeExpiryMinutes: CODE_EXPIRY_MINUTES,
          maxCodesPerDay: MAX_CODES_PER_DAY,
        })
      );

    if (isEventSendBody(bodyValidation.data))
      return res.send(
        await sendEventVerificationSms({
          userId: dataToken.userId,
          eventId: bodyValidation.data.eventId,
          phoneNumber,
          now,
          startOfDay,
          codeExpiryMinutes: CODE_EXPIRY_MINUTES,
          maxCodesPerDay: MAX_CODES_PER_DAY,
        })
      );

    return res.send({
      status: "error",
      reason: "Invalid request data",
      type: "validation",
    });
  } catch (error: unknown) {
    console.warn("Error in /sms-verification/send/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.post("/verify/", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token)
      return res.send({
        status: "error",
        reason: "Unauthorized",
        type: "auth",
      });

    const dataToken = verifyToken(token);
    if (!dataToken)
      return res.send({
        status: "error",
        reason: "Invalid token",
        type: "auth",
      });

    const bodyValidation = verifySmsCodeSchema.safeParse(req.body);
    if (!bodyValidation.success)
      return res.send({
        status: "error",
        reason: "Invalid request data",
        type: "validation",
      });

    const now = Date.now();
    if (isWorkshopVerifyBody(bodyValidation.data))
      return res.send(
        await verifyWorkshopSmsCode({
          userId: dataToken.userId,
          workshopId: bodyValidation.data.workshopId,
          code: bodyValidation.data.code,
          now,
        })
      );

    if (isEventVerifyBody(bodyValidation.data))
      return res.send(
        await verifyEventSmsCode({
          userId: dataToken.userId,
          eventId: bodyValidation.data.eventId,
          code: bodyValidation.data.code,
          now,
        })
      );

    return res.send({
      status: "error",
      reason: "Invalid request data",
      type: "validation",
    });
  } catch (error: unknown) {
    console.warn("Error in /sms-verification/verify/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

export default router;
