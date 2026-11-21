import EventModel from "../routers/events/events.model";
import PostUserSM from "../routers/user/user.modal";

export const updateAllUsers = async (
  key: string,
  value: any | string | null = null
) => {
  await PostUserSM.updateMany({}, { $set: { [key]: value } });
};

export const updateAllEvents = async (
  key: string,
  value: any | string | null = null
) => {
  await EventModel.updateMany({}, { $set: { [key]: value } });
};
