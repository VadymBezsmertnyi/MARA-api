import { z } from "zod";
import { PopulateOptions } from "mongoose";
import {
  workshopSchema,
  filtersSchema,
  sortTypeSchema,
  coordinatesTypeSchema,
  paginationParamsSchema,
  paginationResultSchema,
  getWorkshopsParamsSchema,
  getWorkshopsResultSchema,
  commentWorkshopSchema,
} from "./workshops.schemas";

export type WorkshopType = z.infer<typeof workshopSchema>;
export type FiltersType = z.infer<typeof filtersSchema>;
export type SortType = z.infer<typeof sortTypeSchema>;
export type CoordinatesType = z.infer<typeof coordinatesTypeSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type PaginationResult = z.infer<typeof paginationResultSchema>;
export type GetWorkshopsResult = z.infer<typeof getWorkshopsResultSchema>;
export type GetWorkshopsParams = z.infer<typeof getWorkshopsParamsSchema> & {
  populate?: PopulateOptions[];
};
export type CommentWorkshopType = z.infer<typeof commentWorkshopSchema>;
