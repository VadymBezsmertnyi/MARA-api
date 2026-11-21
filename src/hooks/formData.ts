import { PlaceType } from "../routers/events/events.types";

export const parsePlaceFromFormData = (
  body: Record<string, string | undefined>
): PlaceType | undefined => {
  if (!body.place) return undefined;

  try {
    return typeof body.place === "string"
      ? JSON.parse(body.place)
      : (body.place as PlaceType);
  } catch {
    return undefined;
  }
};

export const parseJsonFieldsFromFormData = <T>(
  body: Record<string, string | undefined>,
  excludeKeys: string[] = []
): Record<string, T> => {
  const parsed: Record<string, any> = {};
  const arrayFields = [
    "likeUserIds",
    "goingUserIds",
    "comments",
    "motoTypesWorks",
    "autoTypesWorks",
    "timeline",
  ];
  for (const [key, value] of Object.entries(body)) {
    if (excludeKeys.includes(key)) continue;
    if (value !== undefined && value !== null) {
      if (value === "" && arrayFields.includes(key)) parsed[key] = [];
      else if (
        typeof value === "string" &&
        (value.startsWith("{") || value.startsWith("["))
      ) {
        try {
          parsed[key] = JSON.parse(value);
        } catch {
          parsed[key] = value;
        }
      } else parsed[key] = value;
    }
  }

  return parsed;
};
