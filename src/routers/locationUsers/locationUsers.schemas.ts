import { z } from "zod";

export const userLocationMapSchema = z.object({
  _id: z.any(),
  date: z.number(),
  userId: z.number(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  isUkraine: z.boolean(),
});
