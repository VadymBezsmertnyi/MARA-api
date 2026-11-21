import { BoundsType, CoordinatesType } from "./map.types";

export const parseBounds = (
  boundsValue: string | string[] | undefined
): BoundsType | null => {
  if (!boundsValue) return null;
  const raw = Array.isArray(boundsValue) ? boundsValue[0] : boundsValue;
  const parts = raw
    .split(/[,\s;]+/)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  if (parts.length !== 4) return null;
  const [lat1, lon1, lat2, lon2] = parts;
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  const minLon = Math.min(lon1, lon2);
  const maxLon = Math.max(lon1, lon2);
  return { minLat, maxLat, minLon, maxLon };
};

export const parseLocation = (
  value: string | string[] | undefined
): CoordinatesType | null => {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const parts = raw
    .split(/[,\s;]+/)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
  if (parts.length !== 2) return null;
  return { latitude: parts[0], longitude: parts[1] };
};

export const haversineKm = (a: CoordinatesType, b: CoordinatesType) => {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const calc =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(calc)));
};
