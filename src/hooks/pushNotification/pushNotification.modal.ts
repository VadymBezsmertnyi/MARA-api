import { Schema, model } from "mongoose";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES_KEYS,
} from "../../routers/user/user.const";

const subscriptionDevice = new Schema({
  deviceId: {
    type: String,
    required: true,
  },
  subscriptionId: {
    type: String,
    required: true,
  },
  updateAT: {
    type: Number,
    required: true,
  },
  languageLocal: {
    type: String,
    enum: LANGUAGES_KEYS,
    default: DEFAULT_LANGUAGE,
  },
});

const userSubscriptionOnesignal = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: `user`,
    required: true,
  },
  ios: {
    type: [subscriptionDevice],
    required: true,
  },
  android: {
    type: [subscriptionDevice],
    required: true,
  },
  windows: {
    type: [subscriptionDevice],
    required: true,
  },
  macos: {
    type: [subscriptionDevice],
    required: true,
  },
  web: {
    type: [subscriptionDevice],
    required: true,
  },
});

export const UserSubscriptionOnesignalModel = model(
  "user-subscription-onesignal",
  userSubscriptionOnesignal
);
