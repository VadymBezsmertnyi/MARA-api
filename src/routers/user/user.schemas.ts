import { z } from "zod";
import { LANGUAGES_KEYS } from "./user.const";
import { fileSchemaZod } from "../../hooks/s3-storage/s3-storage.schemas";

export const languagesSchema = z.enum(LANGUAGES_KEYS);

export const locationSchema = z.object({
  address_components: z.array(
    z.object({
      long_name: z.string(),
      short_name: z.string(),
      types: z.array(z.string()),
    })
  ),
  adr_address: z.string().optional(),
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
});

export const imageBDSchema = z.object({
  _id: z.any(),
  name: z.string(),
  url: z.string(),
  VersionId: z.string(),
});

export const facebookBDSchema = z.object({
  _id: z.any(),
  first_name: z.string(),
  last_name: z.string(),
  name: z.string(),
  email: z.string(),
});

export const googleBDSchema = z.object({
  iss: z.string(),
  at_hash: z.string().optional(),
  email_verified: z.string().optional(),
  sub: z.string(),
  azp: z.string().optional(),
  email: z.string().optional(),
  profile: z.string().optional(),
  picture: z.string().optional(),
  name: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number(),
  nonce: z.string().optional(),
  hd: z.string().optional(),
  locale: z.string().optional(),
});

export const userPostSZ = z.object({
  _id: z.any(),
  isGeoLocation: z.boolean(),
  avatarFile: fileSchemaZod.nullable(),
  eventsIds: z.array(z.any()),
  workshopsIds: z.array(z.any()),
  languageLocal: languagesSchema,
  isNewUser: z.boolean(),
  isDeleteUser: z.boolean(),
  email: z.string().nullable(),
  googleDate: googleBDSchema.nullable(),
  facebookDate: facebookBDSchema.nullable(),
  place_id: z.any().nullable(),
  region_place_id: z.any().nullable(),
  country_place_id: z.any().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  subscriptionAdvertIds: z.array(z.any()),
  subscriptionEventIds: z.array(z.any()),
  subscriptionWorkshopIds: z.array(z.any()),
  defaultAmount: z.object({
    advertAmount: z.number(),
    advertBusinessAmount: z.number(),
    eventSmallAmount: z.number(),
    eventBigAmount: z.number(),
    workshopAmount: z.number(),
  }),
});

export const TokenVerifySchema = z.object({
  userId: z.string(),
  password: z.string(),
  iat: z.number(),
});
