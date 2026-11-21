import { z } from "zod";
import {
  subscriptionDeviceSchema,
  userSubscriptionOnesignalSchema,
} from "./pushNotification.schemas";

export type SubscriptionDeviceType = z.infer<typeof subscriptionDeviceSchema>;

export type UserSubscriptionOnesignalType = z.infer<
  typeof userSubscriptionOnesignalSchema
>;
