import { UserPostT } from "./user.types";

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGES_KEYS = [
  "en",
  "uk",
  "fr",
  "de",
  "es",
  "it",
  "sk",
  "sv",
  "da",
  "fi",
  "pl",
  "cs",
  "hu",
  "el",
  "ro",
  "lt",
  "lv",
  "be",
] as const;

export const DEFAULT_USER_INFO: Omit<UserPostT, "_id"> = {
  avatarFile: null,
  eventsIds: [],
  workshopsIds: [],
  languageLocal: "en",
  isNewUser: false,
  isDeleteUser: false,
  email: null,
  googleDate: null,
  facebookDate: null,
  place_id: null,
  region_place_id: null,
  country_place_id: null,
  firstName: null,
  lastName: null,
  phoneNumber: null,
  isGeoLocation: false,
  subscriptionAdvertIds: [],
  subscriptionEventIds: [],
  subscriptionWorkshopIds: [],
  defaultAmount: {
    advertAmount: 3,
    advertBusinessAmount: 5,
    eventSmallAmount: 1,
    eventBigAmount: 0,
    workshopAmount: 1,
  },
};

export const FALSE_RESULT_USER = { result: false, userData: DEFAULT_USER_INFO };
