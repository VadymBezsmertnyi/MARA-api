import { Schema, model, HydratedDocument } from "mongoose";

// models
import { imageSchema } from "../../hooks/s3-storage/images.models";
import { CoordinatesModel } from "../places/places.modal";

export const commentSchemaM = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: `user`,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "verify"],
    default: "verify",
  },
  dateCreate: {
    type: Number,
    required: true,
  },
  dateUpdate: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
});

export const contactSchemaM = new Schema({
  type: {
    type: String,
    enum: [
      "phone",
      "email",
      "viber",
      "telegram",
      "whatsapp",
      "instagram",
      "facebook",
    ],
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});

const PriceEventModel = new Schema({
  start: {
    type: Number,
    required: true,
  },
  finish: {
    type: Number,
    required: true,
  },
});

const TimelineItemModel = new Schema(
  {
    start: {
      type: Number,
      required: true,
    },
    finish: {
      type: Number,
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const eventSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: `user`,
    required: true,
  },
  ownerUserId: {
    type: Schema.Types.ObjectId,
    ref: `user`,
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  place_id: {
    type: Schema.Types.ObjectId,
    ref: `db-places`,
    default: null,
  },
  region_place_id: {
    type: Schema.Types.ObjectId,
    ref: `db-regions`,
    default: null,
  },
  country_place_id: {
    type: Schema.Types.ObjectId,
    ref: `db-countries`,
    default: null,
  },
  coordinates: {
    type: CoordinatesModel,
    default: null,
  },
  place_address: {
    type: String,
    default: null,
  },
  date: {
    type: new Schema({
      start: { type: Number, optional: true },
      finish: { type: Number, optional: true },
    }),
    required: true,
  },
  price: {
    type: PriceEventModel,
    default: null,
  },
  timeline: {
    type: [TimelineItemModel],
    default: [],
  },
  currency: {
    type: String,
    enum: ["UAH", "EUR", "USD"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageFiles: {
    type: [imageSchema],
    default: [],
  },
  comments: { type: [commentSchemaM], required: true, default: [] },
  rating: { type: Number, default: null },
  likeUserIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: `user`,
      },
    ],
    default: [],
  },
  goingUserIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: `user`,
      },
    ],
    default: [],
  },
  contacts: { type: [contactSchemaM], default: [] },
  verification: {
    type: {
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        required: true,
      },
      date: { type: Number, required: true },
      reason: { type: String, default: null },
    },
    default: null,
  },
});

const EventModel = model("events", eventSchema);

export type EventDocType = HydratedDocument<typeof eventSchema>;

export default EventModel;
