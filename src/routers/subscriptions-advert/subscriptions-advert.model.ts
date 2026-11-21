import { Schema, model } from "mongoose";
import { TYPES_SUBSCRIPTIONS_ADVERT } from "./subscriptions-advert.constants";

const subscriptionAdvertSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: `user`,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    enum: [TYPES_SUBSCRIPTIONS_ADVERT],
  },
  dateCreate: {
    type: Number,
    required: true,
  },
  dateEnd: {
    type: Number,
    required: true,
  },
});

export const SubscriptionAdvertModel = model(
  `subscriptions-advert`,
  subscriptionAdvertSchema
);
