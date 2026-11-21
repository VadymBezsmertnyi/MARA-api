import dotenv from "dotenv";
import { getHTMLToME } from "./pushEmail.constants";

dotenv.config();

const API_KEY_ONESIGNAL = process.env.API_KEY_ONESIGNAL || "";
const APP_KEY_ONESIGNAL = process.env.APP_KEY_ONESIGNAL || "";

const sendPushNotification = async (values: {
  email: string;
  name: string;
  phone: string;
  message: string;
}) => {
  const url = "https://api.onesignal.com/notifications?c=email";
  const options: RequestInit = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: `Bearer token=${API_KEY_ONESIGNAL}`,
      charset: "utf-8",
    },
    body: JSON.stringify({
      app_id: APP_KEY_ONESIGNAL,
      email_subject: "My site - Feedback",
      email_body: getHTMLToME(values),
      include_email_tokens: [process.env.FEEDBACK_EMAIL_TO || ""],
    }),
  };
  const result = await fetch(url, options);
  return result.json() as Promise<any>;
};

export const sendPushEmails = async (
  email: string,
  name: string,
  phone: string,
  message: string
) => {
  try {
    const result = await sendPushNotification({ email, name, phone, message });
    if (result?.errors) return false;
    return true;
  } catch (error) {
    console.warn("Error sending push emails", error);
    return false;
  }
};
