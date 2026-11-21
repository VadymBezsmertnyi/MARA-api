// models
import { StateTehnoscarbModel } from "./tehnoscarb.model";

// types
import { EDeviceType, StateTehnoscarbType } from "./tehnoscarb.types";

// helpers
import {
  getFind,
  getTehnoscarbData,
  getTehnoscarbInitialState,
} from "./tehnoscarb.helpers";
import { TEHNOSCARB_CONSTANTS } from "./tehnoscarb.constants";
import { sendSmsTurboSMS } from "../hooks/sms";

class TehnoscarbCheckService {
  private state: StateTehnoscarbType | null = null;
  constructor() {
    this.state = null;
  }

  private async initializationState() {
    try {
      const state = await StateTehnoscarbModel.findOne();
      if (state) {
        this.state = state.toObject();
        return this.state;
      }

      const newState = getTehnoscarbInitialState();
      const createdState = await StateTehnoscarbModel.create(newState);
      this.state = createdState.toObject();
      return this.state;
    } catch (error) {
      console.error("Error initializing state:", error);
      this.state = getTehnoscarbInitialState();
      return this.state;
    }
  }

  private async updateState(type: EDeviceType, foundIds: string[]) {
    if (!this.state) await this.initializationState();
    if (!this.state) {
      console.error("State is not initialized");
      return;
    }

    if (type === TEHNOSCARB_CONSTANTS.DeviceType.metalDetectors)
      this.state[
        TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900Key
      ].foundIds.push(...foundIds);
    else if (type === TEHNOSCARB_CONSTANTS.DeviceType.motogarntura)
      this.state[TEHNOSCARB_CONSTANTS.keywords.motogarnturaKey].foundIds.push(
        ...foundIds
      );

    try {
      await StateTehnoscarbModel.updateOne({}, { $set: this.state });
    } catch (error) {
      console.error("Error updating state:", error);
    }
  }

  private async checkTehnoscarb(type: string) {
    if (
      type !== TEHNOSCARB_CONSTANTS.DeviceType.metalDetectors &&
      type !== TEHNOSCARB_CONSTANTS.DeviceType.motogarntura
    ) {
      console.error("Невідомий тип пристрою для перевірки Tehnoscarb:", type);
      return null;
    }

    console.warn("Перевірка Tehnoscarb для типу:", type);
    const data = await getTehnoscarbData(type);
    if (!data) {
      console.error("Не вдалося отримати або перевірити дані з Tehnoscarb");
      return null;
    }

    const { options } = data;
    if (!options || !options.catalog || !options.catalog.models) {
      console.error("Невірна структура даних, отриманих з Tehnoscarb");
      return null;
    }

    const state = this.state || (await this.initializationState());
    const models = getFind(options.catalog.models, type, state);
    console.warn(`Знайдено ${models.length} моделей для типу ${type}`);
    if (models.length === 0) return null;

    const textMessage = models
      .map(
        (model) =>
          `Бренд: ${model.brand}, Аліас: ${model.alias}, URL: ${TEHNOSCARB_CONSTANTS.tehnoscarbUrl}/${model.url}`
      )
      .join("\n");
    const message = `Знайдено моделі:\n${textMessage}`;
    await sendSmsTurboSMS(message, TEHNOSCARB_CONSTANTS.myPhone);

    await this.updateState(
      type,
      models.map((item) => item.id.toString())
    );

    return models;
  }

  public async start() {
    if (!this.state) await this.initializationState();
    for (const deviceType in TEHNOSCARB_CONSTANTS.DeviceType) {
      this.checkTehnoscarb(deviceType);
    }
  }
}

const tehnoscarbCheckService = new TehnoscarbCheckService();

export default tehnoscarbCheckService;
