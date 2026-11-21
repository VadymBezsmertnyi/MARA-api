import { Router, Request, Response } from "express";
import dotenv from "dotenv";

// types
import { LanguagesType } from "../user/user.types";

// models
import {
  DBPlacesModel,
  DBCountriesModel,
  DBRegionsModel,
} from "./places.modal";

// hooks
import { searchPlace } from "./places.hooks";

// constants
import { LANGUAGES_KEYS } from "../user/user.const";

// magic numbers
const ERROR_SERVER_FIVE_HUNDRED = 500;

dotenv.config();
const router = Router();

router.get("/countries/", async (req: Request, res: Response) => {
  try {
    const [count, countries] = await Promise.all([
      DBCountriesModel.countDocuments({}),
      DBCountriesModel.find().lean(),
    ]);
    return res.send({ result: true, count, countries, code: 1000 });
  } catch (error: unknown) {
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/regions/", async (req: Request, res: Response) => {
  try {
    const { countryPlaceIds } = req.query as { countryPlaceIds?: string[] };
    if (!countryPlaceIds) return res.send({ result: false, code: 2004 });

    const regions = await DBRegionsModel.find({
      country_place_id: { $in: countryPlaceIds },
    }).lean();

    return res.send({
      result: true,
      regions,
      count: regions.length,
      code: 1000,
    });
  } catch (error: unknown) {
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/cities/", async (req: Request, res: Response) => {
  try {
    const { countryPlaceIds, regionPlaceIds } = req.query as {
      countryPlaceIds?: string[];
      regionPlaceIds?: string[];
    };
    if (!countryPlaceIds || !regionPlaceIds)
      return res.send({ result: false, code: 2004 });

    const places = await DBPlacesModel.find({
      country_place_id: { $in: countryPlaceIds },
      region_place_id: { $in: regionPlaceIds },
    }).lean();

    return res.send({
      result: true,
      places,
      count: places.length,
      code: 1000,
    });
  } catch (error: unknown) {
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/countries/search/", async (req: Request, res: Response) => {
  try {
    const { searchText, language, isDeep } = req.query as {
      searchText: string;
      language?: LanguagesType;
      isDeep: string;
    };
    const resultDB = await DBCountriesModel.find({
      $or: [
        ...LANGUAGES_KEYS.map((languageKey) => ({
          [`${languageKey}.long_name`]: {
            $regex: searchText.toLowerCase(),
            $options: "i",
          },
        })),
        ...LANGUAGES_KEYS.map((languageKey) => ({
          [`${languageKey}.long_name`]: {
            $regex: searchText.toLowerCase(),
            $options: "i",
          },
        })),
      ],
    });
    const resultGoogle =
      !resultDB.length || isDeep === "true"
        ? await searchPlace(searchText, language, "country")
        : [];
    return res.send({
      result: true,
      resultDB,
      resultGoogle,
      code: 1000,
    });
  } catch (error: unknown) {
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/regions/search/", async (req: Request, res: Response) => {
  try {
    const { searchText, language, isDeep } = req.query as {
      searchText: string;
      language?: LanguagesType;
      isDeep: string;
    };
    const resultDB = await DBRegionsModel.find({
      $or: [
        ...LANGUAGES_KEYS.map((languageKey) => ({
          [`${languageKey}.long_name`]: {
            $regex: searchText.toLowerCase(),
            $options: "i",
          },
        })),
        ...LANGUAGES_KEYS.map((languageKey) => ({
          [`${languageKey}.long_name`]: {
            $regex: searchText.toLowerCase(),
            $options: "i",
          },
        })),
      ],
    });
    const resultGoogle =
      !resultDB.length || isDeep === "true"
        ? await searchPlace(searchText, language, "administrative_area_level_1")
        : [];
    return res.send({
      result: true,
      resultDB,
      resultGoogle,
      code: 1000,
    });
  } catch (error: unknown) {
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/cities/search/", async (req: Request, res: Response) => {
  try {
    const { searchText, language, isDeep } = req.query as {
      searchText: string;
      language?: LanguagesType;
      isDeep: string;
    };
    const resultDB = await DBPlacesModel.find({
      $or: [
        ...LANGUAGES_KEYS.map((languageKey) => ({
          [`${languageKey}.address_components`]: {
            $elemMatch: {
              long_name: { $regex: new RegExp(searchText.toLowerCase(), "i") },
            },
          },
        })),
        ...LANGUAGES_KEYS.map((languageKey) => ({
          [`${languageKey}.address_components`]: {
            $elemMatch: {
              long_name: { $regex: new RegExp(searchText.toLowerCase(), "i") },
            },
          },
        })),
      ],
    });
    const resultGoogle =
      !resultDB.length || isDeep === "true"
        ? await searchPlace(searchText, language, "locality")
        : [];
    return res.send({
      result: true,
      resultDB,
      resultGoogle,
      code: 1000,
    });
  } catch (error: unknown) {
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/cities/getPlaceId/", async (req: Request, res: Response) => {
  try {
    const { placeId } = req.query as {
      placeId: string;
    };
    const resultDB = await DBPlacesModel.findOne({
      place_id: placeId,
    });
    return res.send({
      result: true,
      resultDB,
      code: 1000,
    });
  } catch (error: unknown) {
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

export default router;
