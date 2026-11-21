import { z } from "zod";
import {
  countryDbSchema,
  placeDbSchema,
  regionDbSchema,
} from "./places.schemas";

export type CountryDBType = z.infer<typeof countryDbSchema>;

export type RegionDbType = z.infer<typeof regionDbSchema>;

export type PlaceDbType = z.infer<typeof placeDbSchema>;
