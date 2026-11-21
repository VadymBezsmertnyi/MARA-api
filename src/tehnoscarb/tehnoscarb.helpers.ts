import axios from "axios";

// types
import {
  EDeviceType,
  ModelType,
  StateTehnoscarbType,
} from "./tehnoscarb.types";

// constants
import { TEHNOSCARB_CONSTANTS } from "./tehnoscarb.constants";
import { tehnoscarbSchema } from "./tehnoscarb.schemas";

export const getTehnoscarbInitialState = (): StateTehnoscarbType => {
  const item = { foundIds: [] };

  return {
    [TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900Key]: { ...item },
    [TEHNOSCARB_CONSTANTS.keywords.motogarnturaKey]: { ...item },
  };
};

const getDataMetalDetectors = async () => {
  try {
    const result = await axios.get(TEHNOSCARB_CONSTANTS.metalDetectorsUrl, {
      headers: TEHNOSCARB_CONSTANTS.headers,
    });
    const check = tehnoscarbSchema.safeParse(result.data);
    if (!check.success) {
      console.error("Data validation failed:", check.error.message);
      return null;
    }
    return check.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

const getDataMotogarntura = async () => {
  try {
    const result = await axios.get(TEHNOSCARB_CONSTANTS.motogarnturaUrl, {
      headers: TEHNOSCARB_CONSTANTS.headers,
    });
    const check = tehnoscarbSchema.safeParse(result.data);
    if (!check.success) {
      console.error("Data validation failed:", check.error.message);
      return null;
    }
    return check.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

export const getTehnoscarbData = async (
  type: EDeviceType = TEHNOSCARB_CONSTANTS.DeviceType.metalDetectors
) => {
  if (type === TEHNOSCARB_CONSTANTS.DeviceType.metalDetectors)
    return await getDataMetalDetectors();
  else if (type === TEHNOSCARB_CONSTANTS.DeviceType.motogarntura)
    return await getDataMotogarntura();

  return null;
};

const getFindMetalDetectors = (
  models: ModelType[],
  found: StateTehnoscarbType[typeof TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900Key]
) =>
  models.filter((model) => {
    const { id, alias, name } = model;
    const count = TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900.filter(
      (item) => (alias || name).toLowerCase().includes(item.toLowerCase())
    ).length;
    const rightCount = Math.ceil(
      TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900.length / 2
    );

    return (
      count >= rightCount &&
      model.url &&
      found.foundIds.indexOf(id.toString()) === -1
    );
  });

const getFindMotogarntura = (
  models: ModelType[],
  found: StateTehnoscarbType[typeof TEHNOSCARB_CONSTANTS.keywords.motogarnturaKey]
) =>
  models.filter((model) => {
    const { id, alias, name } = model;
    const count = TEHNOSCARB_CONSTANTS.keywords.motogarntura.filter((item) =>
      (alias || name).toLowerCase().includes(item.toLowerCase())
    ).length;
    return (
      count >= 2 && model.url && found.foundIds.indexOf(id.toString()) === -1
    );
  });

export const getFind = (
  models: ModelType[],
  type: EDeviceType = TEHNOSCARB_CONSTANTS.DeviceType.metalDetectors,
  state: StateTehnoscarbType = getTehnoscarbInitialState()
) => {
  if (type === TEHNOSCARB_CONSTANTS.DeviceType.metalDetectors) {
    const result = getFindMetalDetectors(
      models,
      state[TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900Key]
    );

    return result;
  } else if (type === TEHNOSCARB_CONSTANTS.DeviceType.motogarntura) {
    const result = getFindMotogarntura(
      models,
      state[TEHNOSCARB_CONSTANTS.keywords.motogarnturaKey]
    );

    return result;
  }
  return [];
};
