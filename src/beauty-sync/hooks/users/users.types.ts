import { z } from "zod";
import { clientSchema, userDBSchema } from "./users.schemas";

export type UserDBType = z.infer<typeof userDBSchema>;
export type ClientDBType = z.infer<typeof clientSchema>;
