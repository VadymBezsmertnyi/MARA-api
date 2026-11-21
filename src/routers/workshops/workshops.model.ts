import { HydratedDocument, Schema, model } from "mongoose";

// models
import { CoordinatesModel } from "../places/places.modal";
import { imageSchema } from "../../hooks/s3-storage/images.models";

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

const workshopSchema = new Schema({
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
  description: {
    type: String,
    required: true,
  },
  phoneNumber: {
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
  place_address: {
    type: String,
    default: null,
  },
  coordinates: {
    type: CoordinatesModel,
    default: null,
  },
  motoTypesWorks: {
    type: [Number],
    required: true,
  },
  autoTypesWorks: { type: [Number], required: true },
  imageFiles: { type: [imageSchema], default: [] },
  dataCreate: { type: Number, required: true },
  comments: { type: [commentSchemaM], required: true },
  rating: { type: Number, default: null },
  likeUserIds: {
    type: [{ type: Schema.Types.ObjectId, ref: `user` }],
    default: [],
  },
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
  workingHours: {
    type: {
      monday: {
        type: {
          open: { type: String },
          close: { type: String },
        },
        default: null,
      },
      tuesday: {
        type: {
          open: { type: String },
          close: { type: String },
        },
        default: null,
      },
      wednesday: {
        type: {
          open: { type: String },
          close: { type: String },
        },
        default: null,
      },
      thursday: {
        type: {
          open: { type: String },
          close: { type: String },
        },
        default: null,
      },
      friday: {
        type: {
          open: { type: String },
          close: { type: String },
        },
        default: null,
      },
      saturday: {
        type: {
          open: { type: String },
          close: { type: String },
        },
        default: null,
      },
      sunday: {
        type: {
          open: { type: String },
          close: { type: String },
        },
        default: null,
      },
    },
    default: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: null,
      sunday: null,
    },
  },
  contacts: { type: [contactSchemaM], default: [] },
});

const WorkshopModel = model("workshops", workshopSchema);

export type WorkshopDocType = HydratedDocument<typeof workshopSchema>;

export default WorkshopModel;
