import { z } from "zod";
import { fileSchemaZod } from "../../hooks/s3-storage/s3-storage.schemas";
import { currenciesSchema } from "../../hooks/currencies/currencies.schemas";
import { coordinatesSchema } from "../places/places.schemas";

export const eventPlaceSchema = z.object({
  placeId: z.any(),
  title: z.string(),
  address: z.string().nullable().optional(),
  coordinates: coordinatesSchema.nullable().optional(),
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

export const commentEventSchema = z.object({
  _id: z.any(),
  userId: z.string(),
  userName: z.string(),
  description: z.string(),
  rating: z.number().min(1).max(5),
  status: z.enum(["pending", "verify"]).optional().default("verify"),
  dateCreate: z.number().optional(),
  dateUpdate: z.number().optional(),
});

export const timelineItemSchema = z.object({
  start: z.number(),
  finish: z.number().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
});

export const eventSchema = z.object({
  _id: z.any(),
  userId: z.any(),
  ownerUserId: z.any().nullable().optional(),
  title: z.string(),
  place_id: z.any().nullable(),
  region_place_id: z.any().nullable(),
  country_place_id: z.any().nullable(),
  place_address: z.string().nullable(),
  coordinates: coordinatesSchema.nullable(),
  date: z.object({
    start: z.number(),
    finish: z.number(),
  }),
  price: z.object({ start: z.number(), finish: z.number() }).nullable(),
  timeline: z.array(timelineItemSchema).default([]),
  currency: currenciesSchema,
  description: z.string(),
  imageFiles: z.array(fileSchemaZod).default([]),
  comments: z.array(commentEventSchema).default([]),
  rating: z.number().nullable(),
  likeUserIds: z.array(z.number()),
  goingUserIds: z.array(z.number()),
  contacts: z.array(contactSchema).default([]),
  verification: z
    .object({
      status: z.enum(["pending", "verified", "rejected"]),
      date: z.number(),
      reason: z.string().nullable().default(null),
    })
    .nullable()
    .optional()
    .default(null),
});

export const sortEventTypeSchema = z.enum(["distance", "date"]).nullable();

export const coordinatesTypeSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const filtersEventSchema = z.object({
  maxDistance: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  eventName: z.string().optional(),
  eventStatus: z.enum(["past", "upcoming"]).optional(),
  countryId: z.string().optional(),
  placeId: z.string().optional(),
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

export const getEventsParamsSchema = z.object({
  filters: filtersEventSchema.optional(),
  sort: sortEventTypeSchema.optional(),
  pagination: paginationParamsSchema.optional(),
  coordinates: coordinatesTypeSchema.optional(),
  userId: z.string().optional(),
});

export const getEventsResultSchema = z.object({
  events: z.array(eventSchema),
  pagination: paginationResultSchema,
  maxDistance: z.number(),
});

export const eventLocationSchema = z
  .object({
    _id: z.any(),
    place_id: z.string(),
    en: z.any(),
    uk: z.any(),
  })
  .catchall(z.any());

export const getEventLocationsResultSchema = z.object({
  result: z.boolean(),
  countries: z.array(eventLocationSchema),
  places: z.array(eventLocationSchema),
  code: z.number(),
});
