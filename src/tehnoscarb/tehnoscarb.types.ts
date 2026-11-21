import { z } from "zod";

// schemas
import {
  modelSchema,
  stateTehnoscarbSchema,
  tehnoscarbSchema,
} from "./tehnoscarb.schemas";

// constants
import { TEHNOSCARB_CONSTANTS } from "./tehnoscarb.constants";

export type EDeviceType =
  (typeof TEHNOSCARB_CONSTANTS.DeviceType)[keyof typeof TEHNOSCARB_CONSTANTS.DeviceType];

export type TehnoscarbType = z.infer<typeof tehnoscarbSchema>;
export type ModelType = z.infer<typeof modelSchema>;
export type StateTehnoscarbType = z.infer<typeof stateTehnoscarbSchema>;
