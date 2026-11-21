import { z } from "zod";

export const telegramChannelCategorySchema = z.enum([
  "dispute",
  "community",
  "auto",
  "moto",
  "other",
]);

export const telegramChannelSchema = z.object({
  _id: z.any(),
  name: z.string(),
  description: z.string().optional(),
  channelUrl: z.string(),
  category: telegramChannelCategorySchema,
  place_id: z.any().optional(),
  country_place_id: z.any().optional(),
  verified: z.boolean(),
  aiVerified: z.boolean(),
  addedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reportCount: z.number(),
  isActive: z.boolean(),
  lastVerified: z.string().optional(),
  verificationNotes: z.string().optional(),
});

export const telegramChannelCategoryInfoSchema = z.object({
  value: telegramChannelCategorySchema,
  label: z.string(),
  description: z.string(),
});

export const telegramChannelsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    channels: z.array(telegramChannelSchema),
    pagination: z.object({
      currentPage: z.number(),
      totalPages: z.number(),
      totalItems: z.number(),
      itemsPerPage: z.number(),
    }),
    filters: z.object({
      place_id: z.string().optional(),
      country_place_id: z.string().optional(),
      category: telegramChannelCategorySchema.optional(),
      verified: z.string().optional(),
    }),
  }),
});

export const telegramCategoriesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(telegramChannelCategoryInfoSchema),
});

export const telegramCountriesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.string()),
});

export const telegramCitiesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.string()),
});

export const addTelegramChannelRequestSchema = z.object({
  name: z.string().min(1, "Channel name is required"),
  description: z.string().optional(),
  channelUrl: z.string(),
  category: telegramChannelCategorySchema,
  place_id: z.string().optional(),
  country_place_id: z.string().optional(),
  addedBy: z.string(),
});

export const addTelegramChannelResponseSchema = z.object({
  success: z.boolean(),
  data: telegramChannelSchema,
  message: z.string(),
});

export const reportChannelRequestSchema = z.object({
  reason: z.string(),
  reportedBy: z.string(),
});

export const reportChannelResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    reportCount: z.number(),
    isActive: z.boolean(),
  }),
});
