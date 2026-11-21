import * as adminBeautySync from "firebase-admin";
import { readSecretJson } from "../hooks/secretFile";
import dotenv from "dotenv";
import cron from "node-cron";

// schemas
import { dbSmsNotificationSchemaList } from "./beauty-sync.schemas";

// hooks
import { checkDBSmsNotification, sendSmsTurboSMS } from "./hooks/sms";
import { getAllInfo, getInfoForNotification } from "./hooks/users";

dotenv.config();
const serviceAccount = readSecretJson(
  "BEAUTY_SYNC_FIREBASE_SERVICE_ACCOUNT_PATH",
  "serviceAccounts/beauty-sync-firebase.json"
);
adminBeautySync.initializeApp({
  credential: adminBeautySync.credential.cert(
    serviceAccount as adminBeautySync.ServiceAccount
  ),
  databaseURL: process.env.BEAUTY_SYNC_FIREBASE_DATABASE_URL || "",
});

export const db = adminBeautySync.database();
const messaging = adminBeautySync.messaging();

console.warn(
  "Connected to Firebase Beauty Sync at:",
  adminBeautySync.database().app.options.databaseURL
);

const sendPushNotification = async (
  token: string,
  title: string,
  body: string
) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      token,
    };
    const response = await messaging.send(message);
    console.warn(
      "Successfully sent message through Firebase Beauty Sync:",
      response
    );
  } catch (error) {
    console.warn("Error sending message through Firebase Beauty Sync:", error);
  }
};

const checkSmsNotifications = async () => {
  try {
    const snapshot = await db.ref("smsNotifications").once("value");
    const data = snapshot.val();
    if (!data) return;

    const checkZod = dbSmsNotificationSchemaList.safeParse(data);
    if (!checkZod.success) {
      console.warn(
        "Failed to parse SMS notifications through Beauty Sync Zod schema:",
        JSON.stringify(checkZod.error)
      );
      return;
    }

    const userIds = Object.keys(checkZod.data);
    const smsNotifications = userIds
      .map((userId) => {
        return Object.keys(checkZod.data[userId]).map((smsNotificationId) => {
          return {
            userId,
            smsNotificationId,
            ...checkZod.data[userId][smsNotificationId],
          };
        });
      })
      .flat();
    await Promise.all(
      smsNotifications.map(async (smsNotification) => {
        const isCheck = await checkDBSmsNotification(smsNotification);
        if (smsNotification.isSended || !isCheck) return;

        const tokensPush =
          smsNotification.tokensPush?.android ||
          smsNotification.tokensPush?.ios ||
          null;
        const result = await sendSmsTurboSMS(
          smsNotification.content,
          smsNotification.phoneNumber
        );
        if (
          !result ||
          result.response_code < 800 ||
          result.response_code > 899 ||
          !result.response_result
        ) {
          if (tokensPush) {
            const resultGetInfo = await getInfoForNotification(smsNotification);
            const body = resultGetInfo
              ? `Failed to send SMS notification to ${
                  resultGetInfo.client.firstName +
                  " " +
                  resultGetInfo.client.lastName
                } ${smsNotification.phoneNumber}`
              : `Failed to send SMS notification to ${smsNotification.phoneNumber}`;

            await sendPushNotification(tokensPush, "Beauty Sync", body);
          }

          return;
        }

        const firstResult = result.response_result[0];
        if (!firstResult || firstResult.response_code !== 0) return;

        await db
          .ref(
            `smsNotifications/${smsNotification.userId}/${smsNotification.smsNotificationId}`
          )
          .update({ isSended: true, messageId: firstResult.message_id });
        if (tokensPush) {
          const resultGetInfo = await getInfoForNotification(smsNotification);
          const body = resultGetInfo
            ? `SMS notification sended to ${
                resultGetInfo.client.firstName +
                " " +
                resultGetInfo.client.lastName
              } ${smsNotification.phoneNumber}`
            : `SMS notification sended to ${smsNotification.phoneNumber}`;
          await sendPushNotification(tokensPush, "Beauty Sync", body);
        }
      })
    );
  } catch (error) {
    if (error instanceof Error)
      console.warn(
        "Error checking SMS notifications through Beauty Sync:",
        error.message
      );
    else
      console.warn(
        "Error checking SMS notifications through Beauty Sync:",
        error
      );
  }
};

if (process.env.ENABLE_JOBS === "true")
  cron.schedule("*/5 * * * *", checkSmsNotifications);

getAllInfo().then(() => {
  console.warn("All info loaded");
});
