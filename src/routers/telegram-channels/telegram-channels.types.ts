import { z } from "zod";
import {
  telegramChannelSchema,
  telegramChannelCategorySchema,
  telegramChannelCategoryInfoSchema,
  telegramChannelsResponseSchema,
  telegramCategoriesResponseSchema,
  telegramCountriesResponseSchema,
  telegramCitiesResponseSchema,
  addTelegramChannelRequestSchema,
  addTelegramChannelResponseSchema,
  reportChannelRequestSchema,
  reportChannelResponseSchema,
} from "./telegram-channels.schemas";

export type TelegramChannel = z.infer<typeof telegramChannelSchema>;
export type TelegramChannelCategory = z.infer<
  typeof telegramChannelCategorySchema
>;
export type TelegramChannelCategoryInfo = z.infer<
  typeof telegramChannelCategoryInfoSchema
>;
export type TelegramChannelsResponse = z.infer<
  typeof telegramChannelsResponseSchema
>;
export type TelegramCategoriesResponse = z.infer<
  typeof telegramCategoriesResponseSchema
>;
export type TelegramCountriesResponse = z.infer<
  typeof telegramCountriesResponseSchema
>;
export type TelegramCitiesResponse = z.infer<
  typeof telegramCitiesResponseSchema
>;
export type AddTelegramChannelRequest = z.infer<
  typeof addTelegramChannelRequestSchema
>;
export type AddTelegramChannelResponse = z.infer<
  typeof addTelegramChannelResponseSchema
>;
export type ReportChannelRequest = z.infer<typeof reportChannelRequestSchema>;
export type ReportChannelResponse = z.infer<typeof reportChannelResponseSchema>;

export interface TelegramChannelsQueryParams {
  place_id?: string;
  country_place_id?: string;
  category?: TelegramChannelCategory;
  verified?: boolean;
  page?: number;
  limit?: number;
}
