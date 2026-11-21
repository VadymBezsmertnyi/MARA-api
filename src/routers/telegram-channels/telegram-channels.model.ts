import { Schema, model, Document, Types, HydratedDocument } from "mongoose";

export interface ITelegramChannelBase {
  name: string;
  description?: string;
  channelUrl: string;
  category: "dispute" | "community" | "auto" | "moto" | "other";
  place_id?: Types.ObjectId;
  country_place_id?: Types.ObjectId;
  verified: boolean;
  aiVerified: boolean;
  addedBy: string;
  reportCount: number;
  isActive: boolean;
  lastVerified?: Date;
  verificationNotes?: string;
}

export interface ITelegramChannel extends ITelegramChannelBase, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const telegramChannelSchema = new Schema<ITelegramChannel>(
  {
    name: {
      type: String,
      required: [true, "Channel name is required"],
      trim: true,
      maxlength: [100, "Channel name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    channelUrl: {
      type: String,
      required: [true, "Channel URL is required"],
      unique: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["dispute", "community", "auto", "moto", "other"],
        message:
          "Category must be one of: dispute, community, auto, moto, other",
      },
    },
    place_id: {
      type: Schema.Types.ObjectId,
      ref: `db-places`,
      default: null,
    },
    country_place_id: {
      type: Schema.Types.ObjectId,
      ref: `db-countries`,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    aiVerified: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: String,
      required: [true, "Added by user ID is required"],
      ref: "user",
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastVerified: {
      type: Date,
    },
    verificationNotes: {
      type: String,
      maxlength: [1000, "Verification notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

export const TelegramChannelModel = model<ITelegramChannel>(
  "TelegramChannel",
  telegramChannelSchema
);

export type TelegramChannelDocType = HydratedDocument<
  typeof telegramChannelSchema
>;
