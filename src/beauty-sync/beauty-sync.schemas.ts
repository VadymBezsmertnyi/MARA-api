import { z } from "zod";

export const smsNotificationSchema = z.object({
  id: z.string(),
  content: z.string(),
  startTime: z.string(),
  beforeTimeMilliseconds: z.number(),
  typeTime: z.string(),
  isSended: z.boolean(),
  phoneNumber: z.string(),
  messageId: z.string().nullable().default(null),
  tokensPush: z
    .object({
      android: z.string().nullable().default(null),
      ios: z.string().nullable().default(null),
    })
    .nullable()
    .default(null),
  contentPush: z.string().nullable().default(null),
  clientId: z.string().nullable().default(null),
});

export const dbSmsNotificationSchema = z.record(
  z.string(),
  smsNotificationSchema
);
export const dbSmsNotificationSchemaList = z.record(
  z.string(),
  dbSmsNotificationSchema
);
