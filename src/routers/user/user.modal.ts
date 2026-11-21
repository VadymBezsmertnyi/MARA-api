import { Schema, model } from "mongoose";

// constants
import { DEFAULT_LANGUAGE, LANGUAGES_KEYS } from "./user.const";
import { imageSchema } from "../../hooks/s3-storage/images.models";

const googleSchemaM = new Schema({
  iss: {
    type: String,
    required: true,
  },
  at_hash: String,
  email_verified: String,
  sub: {
    type: String,
    required: true,
  },
  azp: String,
  email: String,
  profile: String,
  picture: String,
  name: String,
  given_name: String,
  family_name: String,
  aud: {
    type: String,
    required: true,
  },
  iat: {
    type: Number,
    required: true,
  },
  exp: {
    type: Number,
    required: true,
  },
  nonce: String,
  hd: String,
  locale: String,
});

const facebookSchemaM = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  first_name: String,
  last_name: String,
  name: String,
  email: String,
});

const defaultAmountSchema = new Schema({
  advertAmount: {
    type: Number,
    required: true,
  },
  advertBusinessAmount: {
    type: Number,
    required: true,
  },
  eventSmallAmount: {
    type: Number,
    required: true,
  },
  eventBigAmount: {
    type: Number,
    required: true,
  },
  workshopAmount: {
    type: Number,
    required: true,
  },
});

const userSM = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  avatarFile: {
    type: imageSchema,
    default: null,
  },
  eventsIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: `events`,
      },
    ],
    default: [],
  },
  workshopsIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: `workshops`,
      },
    ],
    default: [],
  },
  email: { type: String, required: true },
  languageLocal: {
    type: String,
    enum: LANGUAGES_KEYS,
    default: DEFAULT_LANGUAGE,
  },
  isNewUser: Boolean,
  isDeleteUser: Boolean,
  googleDate: {
    type: googleSchemaM,
    default: null,
  },
  facebookDate: {
    type: facebookSchemaM,
    default: null,
  },
  place_id: {
    type: Schema.Types.ObjectId,
    ref: `db-places`,
    default: null,
  },
  region_place_id: {
    type: Schema.Types.ObjectId,
    ref: `db-regions`,
    default: null,
  },
  country_place_id: {
    type: Schema.Types.ObjectId,
    ref: `db-countries`,
    default: null,
  },
  firstName: {
    type: String,
    default: null,
  },
  lastName: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  isGeoLocation: {
    type: Boolean,
    required: true,
  },
  subscriptionAdvertIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: `subscriptions-advert`,
      },
    ],
    default: [],
  },
  subscriptionEventIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: `subscriptions-event`,
      },
    ],
    default: [],
  },
  subscriptionWorkshopIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: `subscriptions-workshop`,
      },
    ],
    default: [],
  },
  defaultAmount: {
    type: defaultAmountSchema,
    required: true,
  },
});

const PostUserSM = model("user", userSM);

export default PostUserSM;
