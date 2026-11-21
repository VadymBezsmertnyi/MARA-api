import { z } from "zod";
import {
  fileSchemaZod,
  fileTypeSchema,
  folderSchema,
} from "./s3-storage.schemas";

export type FileType = z.infer<typeof fileTypeSchema>;
export type FolderType = z.infer<typeof folderSchema>;
export type FileDataType = z.infer<typeof fileSchemaZod>;

export interface UploadFileResult {
  url: string;
  path: string;
  name: string;
}

export interface DeleteFileResult {
  success: boolean;
  path: string;
}
