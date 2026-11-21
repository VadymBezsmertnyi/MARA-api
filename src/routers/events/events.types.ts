import { z } from "zod";
import { PopulateOptions } from "mongoose";
import { fileSchemaZod } from "../../hooks/s3-storage/s3-storage.schemas";
import {
  eventPlaceSchema,
  eventSchema,
  filtersEventSchema,
  sortEventTypeSchema,
  coordinatesTypeSchema,
  paginationParamsSchema,
  paginationResultSchema,
  getEventsParamsSchema,
  getEventsResultSchema,
  getEventLocationsResultSchema,
  commentEventSchema,
  timelineItemSchema,
} from "./events.schemas";

export type EventType = z.infer<typeof eventSchema>;
export type ImageFilesType = z.infer<typeof fileSchemaZod>[];
export type PlaceType = z.infer<typeof eventPlaceSchema>;
export type FiltersEventType = z.infer<typeof filtersEventSchema>;
export type SortEventType = z.infer<typeof sortEventTypeSchema>;
export type CoordinatesType = z.infer<typeof coordinatesTypeSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type PaginationResult = z.infer<typeof paginationResultSchema>;
export type GetEventsResult = z.infer<typeof getEventsResultSchema>;
export type GetEventsParams = z.infer<typeof getEventsParamsSchema> & {
  populate?: PopulateOptions[];
};
export type TGetEventLocations = z.infer<typeof getEventLocationsResultSchema>;
export type CommentEventType = z.infer<typeof commentEventSchema>;
export type TimelineItemType = z.infer<typeof timelineItemSchema>;