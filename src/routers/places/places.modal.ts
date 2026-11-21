import { Schema, model } from "mongoose";

export const CoordinatesModel = new Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
});

export const GooglePlaceShortSchemaDB = new Schema({
  description: { type: String, required: true },
  matched_substrings: {
    type: [
      new Schema({
        length: { type: Number, required: true },
        offset: { type: Number, required: true },
      }),
    ],
  },
  place_id: { type: String, required: true },
  reference: { type: String, required: true },
  structured_formatting: {
    type: new Schema({
      main_text: { type: String, required: true },
      main_text_matched_substrings: {
        type: [
          new Schema({
            length: { type: Number, required: true },
            offset: { type: Number, required: true },
          }),
        ],
      },
      secondary_text: { type: String },
    }),
  },
  terms: {
    type: [
      new Schema({
        offset: { type: Number, required: true },
        value: { type: String, required: true },
      }),
    ],
  },
  types: {
    type: [String],
    required: true,
  },
});

const GooglePlaceFullSchemaDB = new Schema({
  address_components: [
    {
      long_name: String,
      short_name: String,
      types: [String],
    },
  ],
  adr_address: String,
  formatted_address: String,
  geometry: {
    location: {
      lat: Number,
      lng: Number,
    },
    viewport: {
      northeast: {
        lat: Number,
        lng: Number,
      },
      southwest: {
        lat: Number,
        lng: Number,
      },
    },
  },
  icon: String,
  icon_background_color: String,
  icon_mask_base_uri: String,
  name: String,
  place_id: String,
  reference: String,
  types: [String],
  url: String,
  utc_offset: Number,
  vicinity: String,
  language: String,
});

export const LanguageCountryDb = new Schema({
  description: { type: String, required: true },
  language: { type: String, required: true },
  long_name: { type: String, required: true },
  short_name: { type: String, required: true },
  types: { type: [String], required: true },
  main_text: { type: String, required: true },
});

const CountrySchemaDB = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  place_id: { type: String, required: true },
  en: { type: LanguageCountryDb, required: true },
  uk: { type: LanguageCountryDb, required: true },
  fr: { type: LanguageCountryDb, required: true },
  de: { type: LanguageCountryDb, required: true },
  es: { type: LanguageCountryDb, required: true },
  it: { type: LanguageCountryDb, required: true },
  sk: { type: LanguageCountryDb, required: true },
  sv: { type: LanguageCountryDb, required: true },
  da: { type: LanguageCountryDb, required: true },
  fi: { type: LanguageCountryDb, required: true },
  pl: { type: LanguageCountryDb, required: true },
  cs: { type: LanguageCountryDb, required: true },
  hu: { type: LanguageCountryDb, required: true },
  el: { type: LanguageCountryDb, required: true },
  ro: { type: LanguageCountryDb, required: true },
  lt: { type: LanguageCountryDb, required: true },
  lv: { type: LanguageCountryDb, required: true },
  be: { type: LanguageCountryDb, required: true },
});

const RegionSchemaDB = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  place_id: { type: String, required: true },
  country_place_id: { type: String, required: true },
  en: { type: LanguageCountryDb, required: true },
  uk: { type: LanguageCountryDb, required: true },
  fr: { type: LanguageCountryDb, required: true },
  de: { type: LanguageCountryDb, required: true },
  es: { type: LanguageCountryDb, required: true },
  it: { type: LanguageCountryDb, required: true },
  sk: { type: LanguageCountryDb, required: true },
  sv: { type: LanguageCountryDb, required: true },
  da: { type: LanguageCountryDb, required: true },
  fi: { type: LanguageCountryDb, required: true },
  pl: { type: LanguageCountryDb, required: true },
  cs: { type: LanguageCountryDb, required: true },
  hu: { type: LanguageCountryDb, required: true },
  el: { type: LanguageCountryDb, required: true },
  ro: { type: LanguageCountryDb, required: true },
  lt: { type: LanguageCountryDb, required: true },
  lv: { type: LanguageCountryDb, required: true },
  be: { type: LanguageCountryDb, required: true },
});

const PlaceSchemaDB = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  place_id: { type: String, required: true },
  country_place_id: { type: String, required: true },
  region_place_id: { type: String, required: true },
  en: { type: GooglePlaceFullSchemaDB, required: true },
  uk: { type: GooglePlaceFullSchemaDB, required: true },
  fr: { type: GooglePlaceFullSchemaDB, required: true },
  de: { type: GooglePlaceFullSchemaDB, required: true },
  es: { type: GooglePlaceFullSchemaDB, required: true },
  it: { type: GooglePlaceFullSchemaDB, required: true },
  sk: { type: GooglePlaceFullSchemaDB, required: true },
  sv: { type: GooglePlaceFullSchemaDB, required: true },
  da: { type: GooglePlaceFullSchemaDB, required: true },
  fi: { type: GooglePlaceFullSchemaDB, required: true },
  pl: { type: GooglePlaceFullSchemaDB, required: true },
  cs: { type: GooglePlaceFullSchemaDB, required: true },
  hu: { type: GooglePlaceFullSchemaDB, required: true },
  el: { type: GooglePlaceFullSchemaDB, required: true },
  ro: { type: GooglePlaceFullSchemaDB, required: true },
  lt: { type: GooglePlaceFullSchemaDB, required: true },
  lv: { type: GooglePlaceFullSchemaDB, required: true },
  be: { type: GooglePlaceFullSchemaDB, required: true },
});

export const DBCountriesModel = model("db-countries", CountrySchemaDB);
export const DBRegionsModel = model("db-regions", RegionSchemaDB);
export const DBPlacesModel = model("db-places", PlaceSchemaDB);
