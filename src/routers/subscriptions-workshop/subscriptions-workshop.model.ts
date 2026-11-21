import { Schema, model } from "mongoose";

const subscriptionWorkshopSchema = new Schema({
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
  dateCreate: {
    type: Number,
    required: true,
  },
  dateEnd: {
    type: Number,
    required: true,
  },
});

export const SubscriptionWorkshopModel = model(
  `subscriptions-workshop`,
  subscriptionWorkshopSchema
);
