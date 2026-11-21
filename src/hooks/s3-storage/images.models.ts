import { Schema } from "mongoose";

export const imageSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  url: { type: String, required: true },
  width: { type: Number, optional: true },
  height: { type: Number, optional: true },
  fileType: { type: String, optional: true },
  folder: { type: String, optional: true },
});
