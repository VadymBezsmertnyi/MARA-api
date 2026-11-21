import { z } from "zod";
import {
  boundsSchema,
  coordinatesSchema,
  mapPointTypeSchema,
  nearestEventSchema,
  nearestResponseSchema,
} from "./map.schemas";

export type BoundsType = z.infer<typeof boundsSchema>;
export type CoordinatesType = z.infer<typeof coordinatesSchema>;
export type MapPointType = z.infer<typeof mapPointTypeSchema>;
export type NearestEventType = z.infer<typeof nearestEventSchema>;
export type NearestResponseType = z.infer<typeof nearestResponseSchema>;
