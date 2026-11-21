import { z } from "zod";

export const fileTypeSchema = z
  .enum(["images", "documents", "videos", "audio"])
  .default("images");

export const folderSchema = z.enum([
  "avatars",
  "events",
  "workshops",
  "products",
  "documents",
  "other",
]);

export const fileSchemaZod = z.object({
  _id: z.any().optional(),
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  fileType: z.string().optional(),
  folder: z.string().optional(),
});
