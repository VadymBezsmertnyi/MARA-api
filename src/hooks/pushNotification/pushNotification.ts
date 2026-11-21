import * as OneSignal from "@onesignal/node-onesignal";
import dotenv from "dotenv";
import qs from "qs";

// types
import { LanguagesType } from "../../routers/user/user.types";

// models
import PostUserSM from "../../routers/user/user.modal";
import { UserSubscriptionOnesignalModel } from "./pushNotification.modal";

// constants
import { LANGUAGES_KEYS } from "../../routers/user/user.const";
import { DEFAULT_SUBSCRIPTION_USER } from "./pushNotification.constants";
import { SubscriptionDeviceType } from "./pushNotification.types";
import mongoose from "mongoose";

dotenv.config();

const USER_KEY_ONESIGNAL = process.env.USER_KEY_ONESIGNAL || "";
const APP_KEY_ONESIGNAL = process.env.APP_KEY_ONESIGNAL || "";

const configuration = OneSignal.createConfiguration({
  organizationApiKey: USER_KEY_ONESIGNAL,
  restApiKey: APP_KEY_ONESIGNAL,
});

const client = new OneSignal.DefaultApi(configuration);

const getNotificationDate = (
  type: "comment" | "update",
  subscriptionIds: string[],
  queryParams: string,
  title: string,
  languageLocal?: LanguagesType,
  platform?: "ios" | "android"
) => {
  if (type === "comment") {
    const name =
      languageLocal === "en"
        ? `In the workshop ${title}, there is a new review`
        : `В майстерні ${title} новий відгук`;
    const subTitleEn = `Your workshop ${title} has received feedback and has been rated`;
    const subTitleUk = `Вашій майстерні ${title} залишили відгук і дали оцінку`;
    const url = `maraapp://workshops${queryParams}`;
    const notificationDate = {
      name,
      app_id: APP_KEY_ONESIGNAL,
      include_player_ids: subscriptionIds || [],
      contents: {
        en: subTitleEn,
        uk: subTitleUk,
      },
      headings: {
        en: name,
        uk: name,
      },
      url,
    };
    return notificationDate;
  }
  if (type === "update") {
    const name = "M.A.R.A.(Moto Auto Road Assistant) - UPDATE";
    const subTitleEn = `Hello there! A new version of the application is available for testing. Press to update.`;
    const subTitleUk = `Вітаю, Вас! Доступна нова версія додатку для тестування. Натисніть для того щоб оновити.`;
    const url =
      platform === "android"
        ? `https://play.google.com/apps/internaltest/4699872528481300225`
        : `https://testflight.apple.com/join/6502443474`;
    const notificationDate = {
      name,
      app_id: APP_KEY_ONESIGNAL,
      include_player_ids: subscriptionIds,
      contents: {
        en: subTitleEn,
        uk: subTitleUk,
      },
      headings: {
        en: name,
        uk: name,
      },
      url,
    };
    return notificationDate;
  }
  return null;
};

const getSubscriptionLanguageIds = async (currentUsersIds?: string[]) => {
  const subscriptionUsers = currentUsersIds
    ? await UserSubscriptionOnesignalModel.find({
        userId: currentUsersIds,
      }).lean()
    : await UserSubscriptionOnesignalModel.find().lean();
  const subscriptionUsersFullIds = subscriptionUsers
    .map((subscriptionUser) => [
      ...subscriptionUser.ios,
      ...subscriptionUser.android,
    ])
    .reduce((state, next) => [...state, ...next], []);

  const subscriptionsLanguagesIds = subscriptionUsersFullIds.reduce(
    (state, next) => {
      const stateLanguage = state[next.languageLocal];
      if (stateLanguage)
        return {
          ...state,
          [next.languageLocal]: [...stateLanguage, next.subscriptionId],
        };
      return { ...state, [next.languageLocal]: [next.subscriptionId] };
    },
    {} as Record<LanguagesType, string[]>
  );
  return subscriptionsLanguagesIds;
};

export const newCommentWorkshop = async (
  ownerUserId: string,
  workshopId: string,
  titleWorkshop: string
) => {
  const dataUser = await PostUserSM.findOne({ _id: ownerUserId }).lean();
  const subscriptionUser = await UserSubscriptionOnesignalModel.findOne({
    userId: ownerUserId,
  }).lean();
  if (dataUser && subscriptionUser) {
    const { languageLocal } = dataUser;
    const { ios, android } = subscriptionUser;
    const subscriptionIds = [
      ...ios.map((iosSubscription) => iosSubscription.subscriptionId),
      ...android.map(
        (androidSubscription) => androidSubscription.subscriptionId
      ),
    ];
    const queryParams = qs.stringify(
      {
        workshopId,
      },
      { addQueryPrefix: true }
    );
    const notificationDate = subscriptionIds.length
      ? getNotificationDate(
          "comment",
          subscriptionIds,
          queryParams,
          titleWorkshop,
          languageLocal
        )
      : null;
    if (notificationDate && notificationDate.include_player_ids.length)
      await client
        .createNotification({
          ...notificationDate,
          include_subscription_ids: notificationDate.include_player_ids,
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development")
            console.warn("error", error);
        });
  }
};

export const newUpdateApp = async (platform?: "ios" | "android") => {
  const currentUsers = await UserSubscriptionOnesignalModel.find().lean();
  const subscriptionsLanguagesIds = await getSubscriptionLanguageIds(
    currentUsers.map((currentUser) => currentUser._id.toString())
  );
  await Promise.all(
    LANGUAGES_KEYS.map(async (languageKey) => {
      const subscriptionIds = subscriptionsLanguagesIds[languageKey] || [];

      const notificationDate = subscriptionIds.length
        ? getNotificationDate(
            "update",
            subscriptionIds,
            "",
            "",
            languageKey,
            platform
          )
        : null;
      if (notificationDate && notificationDate.include_player_ids.length)
        return await client.createNotification(notificationDate);

      return Promise.resolve(null);
    })
  );
};

export const addSubscriptionUser = async (
  userId: number,
  deviceId: string,
  subscriptionId: string,
  languageLocal: LanguagesType,
  deviceType: "ios" | "android" | "windows" | "macos" | "web"
) => {
  const subscriptionUser = await UserSubscriptionOnesignalModel.findOne({
    userId: userId.toString(),
  }).lean();
  const newDeviceSubscription = {
    deviceId,
    subscriptionId,
    updateAT: new Date().getTime(),
    languageLocal,
  };
  if (!subscriptionUser) {
    const _id = new mongoose.Types.ObjectId();
    const newSubscriptionUser = {
      ...DEFAULT_SUBSCRIPTION_USER,
      _id,
      userId,
      [deviceType]: [newDeviceSubscription],
    };
    const result = await new UserSubscriptionOnesignalModel(
      newSubscriptionUser
    ).save();
    return result;
  }

  const oldList = subscriptionUser[deviceType];
  const isDeviceId =
    oldList.findIndex((oldDevice) => oldDevice.deviceId === deviceId) > 0;
  const newList = isDeviceId
    ? oldList.map((oldDevice) =>
        oldDevice.deviceId === deviceId ? newDeviceSubscription : oldDevice
      )
    : [...oldList, newDeviceSubscription];
  const newListCurrent = newList.reduce<SubscriptionDeviceType[]>(
    (state, next) => {
      const is =
        state.filter((item) => item.deviceId === next.deviceId).length > 0;
      if (is) return state;
      return [...state, next];
    },
    []
  );

  const updatedUser = await UserSubscriptionOnesignalModel.findOneAndUpdate(
    { userId: userId.toString() },
    { $set: { [deviceType]: newListCurrent } },
    { new: true }
  );

  return updatedUser;
};
