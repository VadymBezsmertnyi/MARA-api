import { z } from "zod";
import { fileSchemaZod } from "../../hooks/s3-storage/s3-storage.schemas";
import { coordinatesSchema } from "../places/places.schemas";

export const commentWorkshopSchema = z.object({
  _id: z.any(),
  userId: z.string(),
  userName: z.string(),
  description: z.string(),
  rating: z.number().min(1).max(5),
  status: z.enum(["pending", "verify"]).optional().default("verify"),
  dateCreate: z.number().optional(),
  dateUpdate: z.number().optional(),
});

export const contactSchema = z.object({
  type: z.enum([
    "phone",
    "email",
    "viber",
    "telegram",
    "whatsapp",
    "instagram",
    "facebook",
  ]),
  value: z.string(),
});

export const dayWorkingHoursSchema = z
  .object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  })
  .nullable();

export const workingHoursSchema = z
  .object({
    monday: dayWorkingHoursSchema,
    tuesday: dayWorkingHoursSchema,
    wednesday: dayWorkingHoursSchema,
    thursday: dayWorkingHoursSchema,
    friday: dayWorkingHoursSchema,
    saturday: dayWorkingHoursSchema,
    sunday: dayWorkingHoursSchema,
  })
  .default({
    monday: { open: "08:00", close: "18:00" },
    tuesday: { open: "08:00", close: "18:00" },
    wednesday: { open: "08:00", close: "18:00" },
    thursday: { open: "08:00", close: "18:00" },
    friday: { open: "08:00", close: "18:00" },
    saturday: null,
    sunday: null,
  });

export const workshopSchema = z.object({
  _id: z.any(),
  userId: z.string(),
  ownerUserId: z.string().nullable().optional(),
  title: z.string(),
  description: z.string(),
  phoneNumber: z.string(),
  place_id: z.any().nullable(),
  region_place_id: z.any().nullable(),
  country_place_id: z.any().nullable(),
  place_address: z.string().nullable(),
  coordinates: coordinatesSchema.nullable(),
  motoTypesWorks: z.array(z.number()),
  autoTypesWorks: z.array(z.number()),
  imageFiles: z.array(fileSchemaZod).default([]),
  dataCreate: z.number(),
  comments: z.array(commentWorkshopSchema).default([]),
  rating: z.number().nullable(),
  likeUserIds: z.array(z.number()),
  verification: z
    .object({
      status: z.enum(["pending", "verified", "rejected"]),
      date: z.number(),
      reason: z.string().nullable().default(null),
    })
    .nullable()
    .optional()
    .default(null),
  workingHours: workingHoursSchema,
  contacts: z.array(contactSchema).default([]),
});

export const sortTypeSchema = z
  .enum(["comments", "distance", "rating"])
  .nullable();

export const coordinatesTypeSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const filtersSchema = z.object({
  moto: z.array(z.number()).nullable().optional(),
  auto: z.array(z.number()).nullable().optional(),
  maxDistance: z.number().optional(),
  minRating: z.number().nullable().optional(),
  workshopName: z.string().optional(),
});

export const paginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});

export const paginationResultSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const getWorkshopsParamsSchema = z.object({
  filters: filtersSchema.optional(),
  sort: sortTypeSchema.optional(),
  pagination: paginationParamsSchema.optional(),
  coordinates: coordinatesTypeSchema.optional(),
  userId: z.string().optional(),
});

export const getWorkshopsResultSchema = z.object({
  workshops: z.array(workshopSchema),
  pagination: paginationResultSchema,
  maxDistance: z.number(),
});
