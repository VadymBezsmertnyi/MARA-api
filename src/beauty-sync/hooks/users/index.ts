import dotenv from "dotenv";

dotenv.config();

// types
import { ClientDBType, UserDBType } from "./users.types";
import { clientsSchema, usersDBSchema } from "./users.schemas";
import { SmsNotificationType } from "../../beauty-sync.types";
import { db } from "../..";
import { z } from "zod";

let users: Record<string, UserDBType> = {};
let clients: Record<string, Record<string, ClientDBType>> = {};

const getUsers = async () => {
  try {
    const snapshot = await db.ref("users").once("value");
    const data = snapshot.val();
    if (!data) return null;

    const checkZod = usersDBSchema.safeParse(data);
    if (!checkZod.success) {
      console.warn("Failed to parse users:", JSON.stringify(checkZod.error));
      return null;
    }

    users = checkZod.data;
    return checkZod.data;
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Error getting balance:", error.message);
    } else {
      console.warn("Error getting balance:", error);
    }

    return null;
  }
};

const getClients = async () => {
  try {
    const snapshot = await db.ref("clients").once("value");
    const data = snapshot.val();
    if (!data) return null;

    const checkZod = z.record(z.string(), clientsSchema).safeParse(data);
    if (!checkZod.success) {
      console.warn("Failed to parse clients:", JSON.stringify(checkZod.error));
      return null;
    }

    clients = checkZod.data;
    return checkZod.data;
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Error getting balance:", error.message);
    } else {
      console.warn("Error getting balance:", error);
    }

    return null;
  }
};

export const getInfoForNotification = async (
  smsNotification: SmsNotificationType & { userId: string }
) => {
  if (!smsNotification.clientId) return null;

  const oldClient = clients[smsNotification.userId]?.[smsNotification.clientId];
  const client = oldClient
    ? oldClient
    : (await getClients())?.[smsNotification.userId]?.[
        smsNotification.clientId
      ];
  if (!client) return null;

  return { client };
};

export const getAllInfo = async () => {
  getUsers().then((result) => {
    if (!result) console.warn("Users not loaded");
    else console.warn("Users loaded: ", Object.keys(result).length);
  });
  getClients().then((result) => {
    if (!result) console.warn("Clients not loaded");
    else
      console.warn(
        "Clients loaded: ",
        Object.keys(result).reduce<number>(
          (acc, userId) => acc + Object.keys(result[userId]).length,
          0
        ),
        " from ",
        Object.keys(result).length,
        " users"
      );
  });
};

export const getCachedUsers = () => users;
