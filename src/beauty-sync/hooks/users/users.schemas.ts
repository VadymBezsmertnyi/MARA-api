import { z } from "zod";
import { DEFAULT_BUSINESS_TYPES } from "./users.constants";

export const optionsUserDBSchema = z.object({
  isAlwaysSyncCalendar: z.boolean(),
  isAlwaysSyncEventCalendar: z.boolean(),
  isAlwaysSyncSMS: z.boolean(),
  isAlwaysShowOldEventsClient: z.boolean(),
  isHideBackgroundImage: z.boolean().default(false),
});

export const tokensUserDBSchema = z.object({
  android: z.string().nullable().default(null),
  ios: z.string().nullable().default(null),
});

export const businessTypesSchema = z.enum(DEFAULT_BUSINESS_TYPES);

export const userDBSchema = z.object({
  creationTime: z.number(),
  lastSignInTime: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  options: optionsUserDBSchema,
  phone: z.string(),
  tokens: tokensUserDBSchema.nullable().default(null),
  types: z.array(z.enum(["tester", "admin", "moderator"])).default([]),
  businessType: z
    .object({
      id: businessTypesSchema,
      title: z.string().nullable().default(null),
    })
    .nullable()
    .default(null),
});

export const usersDBSchema = z.record(z.string(), userDBSchema);

export const phoneSchema = z.object({
  number: z.string(),
  iso2: z.string().nullable().default(null),
});

export const clientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: phoneSchema.nullable().default(null),
  detail: z.string(),
});

export const clientsSchema = z.record(z.string(), clientSchema);
