import { Schema, model } from "mongoose";

const userLocationMapSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  date: {
    type: Number,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: `user`,
    required: true,
  },
  location: {
    type: new Schema({
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    }),
    required: true,
  },
  isUkraine: {
    type: Boolean,
    required: true,
  },
});

export const UserLocationMapModel = model(
  "users-location-map",
  userLocationMapSchema
);
