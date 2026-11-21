import { z } from "zod";
import { smsNotificationSchema } from "./beauty-sync.schemas";

export type SmsNotificationType = z.infer<typeof smsNotificationSchema>;
