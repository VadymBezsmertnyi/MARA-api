import { z } from "zod";
import { userLocationMapSchema } from "./locationUsers.schemas";

export type UserLocationMapType = z.infer<typeof userLocationMapSchema>;
