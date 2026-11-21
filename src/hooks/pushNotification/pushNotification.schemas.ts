import { z } from "zod";
import { languagesSchema } from "../../routers/user/user.schemas";

export const subscriptionDeviceSchema = z.object({
  deviceId: z.string(),
  subscriptionId: z.string(),
  updateAT: z.number(),
  languageLocal: languagesSchema,
});

export const userSubscriptionOnesignalSchema = z.object({
  _id: z.any(),
  userId: z.number(),
  ios: z.array(subscriptionDeviceSchema),
  android: z.array(subscriptionDeviceSchema),
  windows: z.array(subscriptionDeviceSchema),
  macos: z.array(subscriptionDeviceSchema),
  web: z.array(subscriptionDeviceSchema),
});
