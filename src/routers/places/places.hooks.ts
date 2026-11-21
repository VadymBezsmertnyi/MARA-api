import qs from "qs";
import dotenv from "dotenv";
import axios from "axios";

// types
import {
  GoogleLocationDetailResult,
  GoogleLocationResult,
} from "react-native-google-autocomplete/dist/services/Google.service";
import {
  DBPlacesModel,
  DBCountriesModel,
  DBRegionsModel,
} from "./places.modal";
import { CountryDBType, PlaceDbType, RegionDbType } from "./places.types";
import { LANGUAGES_KEYS } from "../user/user.const";
import { LanguagesType } from "../user/user.types";
import mongoose from "mongoose";

dotenv.config();

const URL_GOOGLE_PLACE_API = "https://maps.googleapis.com/maps/api/place";
const API_KEY_GOOGLE_WEB_PLACES = process.env
  .API_KEY_GOOGLE_WEB_PLACES as string;

export const searchPlace = async (
  input: string,
  language: LanguagesType = "en",
  type?: "country" | "administrative_area_level_1" | "locality"
) => {
  try {
    const queryParams = qs.stringify({
      input,
      key: API_KEY_GOOGLE_WEB_PLACES,
      language,
      type,
    });
    const apiUrl = `${URL_GOOGLE_PLACE_API}/autocomplete/json?${queryParams}`;
    const result = await axios.get<{
      predictions: GoogleLocationResult[];
      status: string;
    }>(apiUrl);
    return result.data.predictions;
  } catch (error) {
    console.warn("searchPlace google places error:", error);
    return [];
  }
};

const findCountryDB = async (
  placeArray: {
    placeId: string;
    language: LanguagesType;
    translate: GoogleLocationDetailResult;
  }[]
) => {
  const nameCountry = placeArray[0].translate.address_components.find(
    (address) => address.types.includes("country")
  )?.long_name;
  if (!nameCountry) return null;

  const countryFind = await DBCountriesModel.findOne({
    $or: [
      ...LANGUAGES_KEYS.map((languageKey) => ({
        [`${languageKey}.long_name`]: {
          $regex: nameCountry.toLowerCase(),
          $options: "i",
        },
      })),
      ...LANGUAGES_KEYS.map((languageKey) => ({
        [`${languageKey}.long_name`]: {
          $regex: nameCountry.toLowerCase(),
          $options: "i",
        },
      })),
    ],
  }).lean();

  if (countryFind)
    return {
      countryFind,
      placeArray: placeArray.map((place) => ({
        ...place,
        country_place_id: countryFind.place_id,
      })),
    };

  return null;
};

const checkCountryDB = async (
  placeArray: {
    placeId: string;
    language: LanguagesType;
    translate: GoogleLocationDetailResult;
  }[]
) => {
  const nameCountry = placeArray[0].translate.address_components.find(
    (address) => address.types.includes("country")
  )?.long_name;
  if (!nameCountry) return null;

  const queryParamsCountries = qs.stringify({
    input: nameCountry,
    key: API_KEY_GOOGLE_WEB_PLACES,
  });
  const apiUrlCountries = `${URL_GOOGLE_PLACE_API}/autocomplete/json?${queryParamsCountries}&language=en`;
  const resultCountries = await axios.get<{
    predictions: GoogleLocationResult[];
    status: string;
  }>(apiUrlCountries);
  const country = resultCountries.data.predictions.find((country) =>
    country.types.includes("country")
  );
  if (!country) return null;

  const countryArray = placeArray.map((place) => {
    const { language } = place;
    const translate = place.translate.address_components.find((address) =>
      address.types.includes("country")
    );
    return { translate, language, country };
  });

  const countryDB = countryArray.reduce(
    (state, next) => ({
      ...state,
      _id: new mongoose.Types.ObjectId(),
      place_id: next.country.place_id,
      [next.language]: {
        language: next.language,
        description: next.country.description,
        long_name: next.translate?.long_name || "",
        short_name: next.translate?.short_name || "",
        types: next.translate?.types || next.country.types,
        main_text: next.country.structured_formatting.main_text,
      },
    }),
    {} as CountryDBType
  );

  const countryFind = await new DBCountriesModel(countryDB).save();

  return {
    countryFind,
    countryArray,
    placeArray: placeArray.map((place) => ({
      ...place,
      country_place_id: countryFind.place_id,
    })),
  };
};

const findRegionDB = async (
  placeArray: {
    placeId: string;
    country_place_id?: string;
    language: LanguagesType;
    translate: GoogleLocationDetailResult;
  }[],
  countryPlaceId: string
) => {
  if (!placeArray.length) return null;
  const nameRegion = placeArray[0].translate.address_components.find(
    (address) => address.types.includes("administrative_area_level_1")
  )?.long_name;
  if (!nameRegion) return null;

  const regionFind = await DBRegionsModel.findOne({
    $or: [
      ...LANGUAGES_KEYS.map((languageKey) => ({
        [`${languageKey}.long_name`]: {
          $regex: nameRegion.toLowerCase(),
          $options: "i",
        },
      })),
      ...LANGUAGES_KEYS.map((languageKey) => ({
        [`${languageKey}.long_name`]: {
          $regex: nameRegion.toLowerCase(),
          $options: "i",
        },
      })),
    ],
  }).lean();
  if (regionFind)
    return {
      regionFind,
      placeArray: placeArray.map((place) => ({
        ...place,
        region_place_id: regionFind.place_id,
        country_place_id: place.country_place_id || countryPlaceId,
      })),
    };
  return null;
};

const checkRegionDB = async (
  placeArray: {
    placeId: string;
    country_place_id?: string;
    language: LanguagesType;
    translate: GoogleLocationDetailResult;
  }[],
  countryPlaceId: string
) => {
  if (!placeArray.length) return null;
  const nameRegion = placeArray[0].translate.address_components.find(
    (address) => address.types.includes("administrative_area_level_1")
  )?.long_name;
  if (!nameRegion) return null;

  const queryParamsRegions = qs.stringify({
    input: nameRegion,
    key: API_KEY_GOOGLE_WEB_PLACES,
  });
  const apiUrlRegions = `${URL_GOOGLE_PLACE_API}/autocomplete/json?${queryParamsRegions}&language=en`;
  const resultRegions = await axios.get<{
    predictions: GoogleLocationResult[];
    status: string;
  }>(apiUrlRegions);
  const region = resultRegions.data.predictions.find((country) =>
    country.types.includes("administrative_area_level_1")
  );
  if (!region) return null;

  const regionArray = placeArray.map((place) => {
    const { language } = place;
    const translate = place.translate.address_components.find((address) =>
      address.types.includes("administrative_area_level_1")
    );
    return { translate, language, region, country_place_id: countryPlaceId };
  });

  const regionDB = regionArray.reduce(
    (state, next) => ({
      ...state,
      _id: new mongoose.Types.ObjectId(),
      place_id: next.region.place_id,
      country_place_id: next.country_place_id || countryPlaceId,
      [next.language]: {
        language: next.language,
        description: next.region.description,
        long_name: next.translate?.long_name || "",
        short_name: next.translate?.short_name || "",
        types: next.translate?.types || next.region.types,
        main_text: next.region.structured_formatting.main_text,
      },
    }),
    {} as RegionDbType
  );

  const regionFind = await new DBRegionsModel(regionDB).save();

  return {
    regionFind,
    regionArray,
    placeArray: placeArray.map((place) => ({
      ...place,
      region_place_id: region.place_id,
    })),
  };
};

export const checkCityDB = async (placeId: string) => {
  const place = await DBPlacesModel.findOne({
    place_id: placeId,
  }).lean();

  if (place) {
    const country = await DBCountriesModel.findOne({
      place_id: place.country_place_id,
    }).lean();
    const region = await DBRegionsModel.findOne({
      place_id: place.region_place_id,
    }).lean();

    return {
      country,
      region,
      place,
      country_placeId_id: country?.place_id || place.country_place_id,
      region_place_id: region?.place_id || place.region_place_id,
      place_id: placeId,
    };
  }

  const placeArray = await Promise.all(
    LANGUAGES_KEYS.map(async (languageKey) => {
      const queryParamsPlace = qs.stringify({
        place_id: placeId,
        key: API_KEY_GOOGLE_WEB_PLACES,
        language: languageKey,
      });
      const apiUrlPlace = `${URL_GOOGLE_PLACE_API}/details/json?${queryParamsPlace}`;
      const resultPlace = await axios.get<{
        result: GoogleLocationDetailResult;
        status: string;
      }>(apiUrlPlace);

      return {
        placeId: placeId,
        language: languageKey,
        translate: resultPlace.data.result,
      };
    })
  );

  const findCountry = await findCountryDB(placeArray);
  const checkCountry = findCountry
    ? findCountry
    : await checkCountryDB(placeArray);
  const countryPlaceId = checkCountry?.countryFind
    ? checkCountry.countryFind.place_id
    : findCountry?.countryFind
      ? findCountry.countryFind.place_id
      : "";
  const findRegion = findCountry?.placeArray
    ? await findRegionDB(
        findCountry.placeArray,
        findCountry.countryFind.place_id
      )
    : await findRegionDB(placeArray, "");
  const checkRegion = findRegion
    ? findRegion
    : await checkRegionDB(
        findCountry?.placeArray || placeArray,
        countryPlaceId
      );
  const regionPlaceId = checkRegion?.regionFind
    ? checkRegion.regionFind.place_id
    : findRegion?.regionFind
      ? findRegion.regionFind.place_id
      : "";
  const currentPlaceArray = placeArray.map((item, index) => ({
    ...item,
    ...checkCountry?.placeArray[index],
    ...checkRegion?.placeArray[index],
    country_place_id: countryPlaceId,
    region_place_id: regionPlaceId,
  }));

  const currentPlaceDB = currentPlaceArray.reduce(
    (state, next) => ({
      ...state,
      _id: new mongoose.Types.ObjectId(),
      place_id: next.placeId,
      country_place_id: next.country_place_id,
      region_place_id: next.region_place_id,
      [next.language]: {
        ...next.translate,
        language: next.language,
      },
    }),
    {} as PlaceDbType
  );

  const placeFind = await new DBPlacesModel(currentPlaceDB).save();

  return {
    country: checkCountry?.countryFind,
    region: checkRegion?.regionFind,
    place: placeFind,
    country_placeId_id: countryPlaceId,
    region_place_id: regionPlaceId,
    place_id: placeId,
  };
};
