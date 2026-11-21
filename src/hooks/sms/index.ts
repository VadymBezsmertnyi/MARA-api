import axios from "axios";
import dotenv from "dotenv";
import { responseBalanceTurboSMS, responseSendTurboSMS } from "./sms.schemas";

dotenv.config();

export const sendSmsTurboSMS = async (message: string, recipient: string) => {
  const apiUrl = process.env.TURBO_SMS_API_URL_SEND || "";
  const apiToken = process.env.TURBO_SMS_API_TOKEN || "";
  const sender =
    process.env.MARA_TURBO_SMS_SENDER ||
    process.env.BEAUTY_SYNC_TURBO_SMS_SENDER ||
    "";

  try {
    const response = await axios.post(
      apiUrl,
      {
        recipients: [recipient],
        sms: {
          sender: sender,
          text: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      const checkZod = responseSendTurboSMS.safeParse(response.data);
      if (!checkZod.success) {
        console.warn("Failed to send SMS:", JSON.stringify(checkZod.error));

        return null;
      }

      return checkZod.data;
    } else {
      console.warn("Failed to send SMS:", response.status, response.data);

      return null;
    }
  } catch (error) {
    if (error instanceof Error)
      console.warn("Error sending SMS:", error.message);
    else console.warn("Error sending SMS:", error);
    return null;
  }
};

export const balanceTurboSMSUser = async () => {
  const apiUrl = process.env.TURBO_SMS_API_URL_BALANCE || "";
  const apiToken = process.env.TURBO_SMS_API_TOKEN || "";

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
    const checkZod = responseBalanceTurboSMS.safeParse(response.data);
    if (!checkZod.success) {
      console.warn("Failed to get balance:", JSON.stringify(checkZod.error));

      return {
        result: false,
        status: "ERROR" as const,
        error: {
          type: "zod",
          message: JSON.stringify(checkZod.error),
        },
      };
    }

    return {
      result: true,
      status: "OK" as const,
      data: checkZod.data,
    };
  } catch (error) {
    if (error instanceof Error)
      console.warn("Error getting balance:", error.message);
    else console.warn("Error getting balance:", error);
    return {
      result: false,
      status: "ERROR" as const,
      error: {
        type: "error",
        message: error,
      },
    };
  }
};
