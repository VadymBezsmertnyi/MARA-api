import { z } from "zod";
import { languagesSchema } from "../user/user.schemas";

export const languageCountryDbSchema = z.object({
  description: z.string(),
  language: z.string(),
  long_name: z.string(),
  short_name: z.string(),
  types: z.array(z.string()),
  main_text: z.string(),
});

export const countryDbSchema = z.object({
  _id: z.any(),
  place_id: z.string(),
  en: languageCountryDbSchema,
  uk: languageCountryDbSchema,
  fr: languageCountryDbSchema,
  de: languageCountryDbSchema,
  es: languageCountryDbSchema,
  it: languageCountryDbSchema,
  sk: languageCountryDbSchema,
  sv: languageCountryDbSchema,
  da: languageCountryDbSchema,
  fi: languageCountryDbSchema,
  pl: languageCountryDbSchema,
  cs: languageCountryDbSchema,
  hu: languageCountryDbSchema,
  el: languageCountryDbSchema,
  ro: languageCountryDbSchema,
  lt: languageCountryDbSchema,
  lv: languageCountryDbSchema,
  be: languageCountryDbSchema,
});

export const regionDbSchema = z.object({
  _id: z.any(),
  place_id: z.string(),
  country_place_id: z.string(),
  en: languageCountryDbSchema,
  uk: languageCountryDbSchema,
  fr: languageCountryDbSchema,
  de: languageCountryDbSchema,
  es: languageCountryDbSchema,
  it: languageCountryDbSchema,
  sk: languageCountryDbSchema,
  sv: languageCountryDbSchema,
  da: languageCountryDbSchema,
  fi: languageCountryDbSchema,
  pl: languageCountryDbSchema,
  cs: languageCountryDbSchema,
  hu: languageCountryDbSchema,
  el: languageCountryDbSchema,
  ro: languageCountryDbSchema,
  lt: languageCountryDbSchema,
  lv: languageCountryDbSchema,
  be: languageCountryDbSchema,
});

export const placeGoogleFullSchema = z.object({
  address_components: z.array(
    z.object({
      long_name: z.string(),
      short_name: z.string(),
      types: z.array(z.string()),
    })
  ),
  adr_address: z.string(),
  formatted_address: z.string(),
  geometry: z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    viewport: z.object({
      northeast: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      southwest: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    }),
  }),
  icon: z.string(),
  icon_background_color: z.string(),
  icon_mask_base_uri: z.string(),
  name: z.string(),
  place_id: z.string(),
  reference: z.string(),
  types: z.array(z.string()),
  url: z.string(),
  utc_offset: z.number(),
  vicinity: z.string(),
  language: languagesSchema,
});

export const placeDbSchema = z.object({
  _id: z.any(),
  place_id: z.string(),
  country_place_id: z.string(),
  region_place_id: z.string(),
  en: placeGoogleFullSchema,
  uk: placeGoogleFullSchema,
  fr: placeGoogleFullSchema,
  de: placeGoogleFullSchema,
  es: placeGoogleFullSchema,
  it: placeGoogleFullSchema,
  sk: placeGoogleFullSchema,
  sv: placeGoogleFullSchema,
  da: placeGoogleFullSchema,
  fi: placeGoogleFullSchema,
  pl: placeGoogleFullSchema,
  cs: placeGoogleFullSchema,
  hu: placeGoogleFullSchema,
  el: placeGoogleFullSchema,
  ro: placeGoogleFullSchema,
  lt: placeGoogleFullSchema,
  lv: placeGoogleFullSchema,
  be: placeGoogleFullSchema,
});

export const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
