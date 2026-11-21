import { Schema, model, type HydratedDocument } from "mongoose";

// types
import { StateTehnoscarbType } from "./tehnoscarb.types";

// constants
import { TEHNOSCARB_CONSTANTS } from "./tehnoscarb.constants";

export interface StateTehnoscarbBDI extends StateTehnoscarbType {}

const StateTehnoscarbItemSchema = new Schema<StateTehnoscarbType[string]>({
  foundIds: { type: [String], required: true },
});

const StateTehnoscarbSchema = new Schema<StateTehnoscarbBDI>(
  {
    [TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900Key]:
      StateTehnoscarbItemSchema,
    [TEHNOSCARB_CONSTANTS.keywords.motogarnturaKey]: StateTehnoscarbItemSchema,
  },
  {
    strict: false,
  }
);

export const StateTehnoscarbModel = model<StateTehnoscarbBDI>(
  "StateTehnoscarb",
  StateTehnoscarbSchema
);

export type StateTehnoscarbDocument = HydratedDocument<StateTehnoscarbBDI>;
