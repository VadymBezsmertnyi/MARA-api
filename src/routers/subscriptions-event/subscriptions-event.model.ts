import { Schema, model } from "mongoose";
import { TYPES_SUBSCRIPTIONS_EVENT } from "./subscriptions-event.constants";

const subscriptionSchema = new Schema({
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
    enum: TYPES_SUBSCRIPTIONS_EVENT,
    type: String,
    required: true,
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

export const SubscriptionEventModel = model(
  `subscriptions-event`,
  subscriptionSchema
);
