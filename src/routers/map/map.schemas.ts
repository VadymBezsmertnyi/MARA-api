import { z } from "zod";

export const boundsSchema = z.object({
  minLat: z.number(),
  maxLat: z.number(),
  minLon: z.number(),
  maxLon: z.number(),
});

export const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const mapPointTypeSchema = z.enum(["events", "workshops"]);

export const nearestEventSchema = z.object({
  _id: z.string(),
  title: z.string(),
  coordinates: coordinatesSchema.nullable(),
  date: z
    .object({
      start: z.number().optional(),
      finish: z.number().optional(),
    })
    .optional(),
  imageFiles: z.array(z.any()).optional(),
});

export const nearestResponseSchema = z.object({
  nearestEvent: nearestEventSchema.nullable(),
  nearestEventDistance: z.number().nullable(),
});
