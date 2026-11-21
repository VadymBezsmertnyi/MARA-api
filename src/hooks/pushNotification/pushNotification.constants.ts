import { UserSubscriptionOnesignalType } from "./pushNotification.types";

export const DEFAULT_SUBSCRIPTION_USER: Omit<
  UserSubscriptionOnesignalType,
  "_id" | "userId"
> = {
  ios: [],
  android: [],
  windows: [],
  macos: [],
  web: [],
};
