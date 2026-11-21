import { z } from "zod";

export const sendSmsVerificationSchema = z.union([
  z.object({
    workshopId: z.string(),
    phoneNumber: z.string(),
  }),
  z.object({
    eventId: z.string(),
    phoneNumber: z.string(),
  }),
]);

export const verifySmsCodeSchema = z.union([
  z.object({
    workshopId: z.string(),
    code: z.string().length(6),
  }),
  z.object({
    eventId: z.string(),
    code: z.string().length(6),
  }),
]);

export type SendSmsVerificationBody = z.infer<typeof sendSmsVerificationSchema>;
export type VerifySmsCodeBody = z.infer<typeof verifySmsCodeSchema>;

export const isWorkshopSendBody = (
  data: SendSmsVerificationBody
): data is { workshopId: string; phoneNumber: string } =>
  "workshopId" in data;

export const isEventSendBody = (
  data: SendSmsVerificationBody
): data is { eventId: string; phoneNumber: string } => "eventId" in data;

export const isWorkshopVerifyBody = (
  data: VerifySmsCodeBody
): data is { workshopId: string; code: string } => "workshopId" in data;

export const isEventVerifyBody = (
  data: VerifySmsCodeBody
): data is { eventId: string; code: string } => "eventId" in data;
