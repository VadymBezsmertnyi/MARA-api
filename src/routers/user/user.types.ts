import { z } from "zod";
import {
  userPostSZ,
  // new
  imageBDSchema,
  TokenVerifySchema,
  languagesSchema,
} from "./user.schemas";

export type UserPostT = z.infer<typeof userPostSZ>;

export type TokenVerifyType = z.infer<typeof TokenVerifySchema>;

// new
export type ImageDBType = z.infer<typeof imageBDSchema>;

export type RequestBodyType = Record<string, string> & {
  platform: "ios" | "android" | "windows" | "macos" | "web";
};

export type LanguagesType = z.infer<typeof languagesSchema>;
