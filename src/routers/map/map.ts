import { Router, Request, Response } from "express";

// models
import EventModel from "../events/events.model";
import WorkshopModel from "../workshops/workshops.model";

// helpers
import { haversineKm, parseBounds, parseLocation } from "./map.helpers";
import { CoordinatesType, NearestResponseType } from "./map.types";

// magic numbers
const ERROR_SERVER_FIVE_HUNDRED = 500;

const router = Router();

router.get("/points", async (req: Request, res: Response) => {
  try {
    const {
      bounds,
      types,
      userLocation,
      cityLocation,
      nearest,
      includeNearest,
    } = req.query;
    const parsedBounds = parseBounds(bounds as string | undefined);
    if (!parsedBounds)
      return res.status(400).send({ result: false, code: 1003 });

    const typeList =
      typeof types === "string" && types.length > 0
        ? types.split(",").map((item) => item.trim())
        : ["events", "workshops"];
    const typeSet = new Set(typeList);
    const includeEvents = typeSet.has("events");
    const includeWorkshops = typeSet.has("workshops");
    const shouldIncludeNearest =
      nearest === "true" || includeNearest === "true";

    const now = Date.now();
    const boundsQuery = {
      "coordinates.latitude": {
        $gte: parsedBounds.minLat,
        $lte: parsedBounds.maxLat,
      },
      "coordinates.longitude": {
        $gte: parsedBounds.minLon,
        $lte: parsedBounds.maxLon,
      },
      coordinates: { $exists: true, $ne: null },
      "verification.status": "verified" as const,
    };

    const eventsQuery = {
      ...boundsQuery,
      "date.finish": { $gte: now },
    };

    const primaryLocation: CoordinatesType | null =
      parseLocation(userLocation as string | undefined) ||
      parseLocation(cityLocation as string | undefined);

    const nearestQuery =
      shouldIncludeNearest && primaryLocation
        ? {
            coordinates: { $exists: true, $ne: null },
            "verification.status": "verified" as const,
            "date.finish": { $gte: now },
          }
        : null;

    const [events, workshops, allEventsForNearest] = await Promise.all([
      includeEvents
        ? EventModel.find(eventsQuery)
            .select("_id title coordinates date imageFiles")
            .lean()
        : Promise.resolve([]),
      includeWorkshops
        ? WorkshopModel.find(boundsQuery)
            .select("_id title coordinates imageFiles rating")
            .lean()
        : Promise.resolve([]),
      nearestQuery
        ? EventModel.find(nearestQuery)
            .select("_id title coordinates date imageFiles place_id")
            .populate("place_id")
            .lean()
        : Promise.resolve([]),
    ]);

    const nearestResult: NearestResponseType = {
      nearestEvent: null,
      nearestEventDistance: null,
    };
    if (
      shouldIncludeNearest &&
      primaryLocation &&
      allEventsForNearest.length > 0
    ) {
      let minDistance = Number.POSITIVE_INFINITY;
      let minEvent: (typeof allEventsForNearest)[number] | null = null;
      allEventsForNearest.forEach((event) => {
        const coordinates = event?.coordinates;
        if (!coordinates) return;
        const distance = haversineKm(primaryLocation, {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
        if (distance < minDistance) {
          minDistance = distance;
          minEvent = event;
        }
      });
      nearestResult.nearestEvent = minEvent;
      nearestResult.nearestEventDistance =
        minEvent && Number.isFinite(minDistance) ? minDistance : null;
    }

    return res.send({
      result: true,
      events: includeEvents ? events : [],
      workshops: includeWorkshops ? workshops : [],
      ...nearestResult,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error in /map/points:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

export default router;
