import EventModel, { EventDocType } from "./events.model";
import { PipelineStage, QueryFilter } from "mongoose";
import {
  CommentEventType,
  FiltersEventType,
  SortEventType,
  CoordinatesType,
  PaginationResult,
  GetEventsParams,
  TimelineItemType,
} from "./events.types";
import mongoose from "mongoose";
import {
  AI_ERROR_REASONS,
  verifyCommentWithAI,
} from "../../hooks/openAi/comment-ai";

const calculateBoundingBox = (
  latitude: number,
  longitude: number,
  maxDistanceKm: number
) => {
  const R = 6371;
  const latDelta = (maxDistanceKm / R) * (180 / Math.PI);
  const lonDelta =
    (maxDistanceKm / (R * Math.cos((latitude * Math.PI) / 180))) *
    (180 / Math.PI);

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta,
  };
};

const calculateMaxDistance = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  const pipeline: PipelineStage[] = [
    {
      $addFields: {
        distance: {
          $let: {
            vars: {
              lat1Rad: { $multiply: [{ $literal: latitude }, Math.PI / 180] },
              lon1Rad: { $multiply: [{ $literal: longitude }, Math.PI / 180] },
              lat2Rad: {
                $multiply: ["$coordinates.latitude", Math.PI / 180],
              },
              lon2Rad: {
                $multiply: ["$coordinates.longitude", Math.PI / 180],
              },
            },
            in: {
              $multiply: [
                6371,
                {
                  $acos: {
                    $add: [
                      {
                        $multiply: [
                          { $sin: "$$lat1Rad" },
                          { $sin: "$$lat2Rad" },
                        ],
                      },
                      {
                        $multiply: [
                          { $cos: "$$lat1Rad" },
                          { $cos: "$$lat2Rad" },
                          {
                            $cos: {
                              $subtract: ["$$lon2Rad", "$$lon1Rad"],
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        maxDistance: { $max: "$distance" },
      },
    },
  ];

  const result = await EventModel.aggregate<{
    _id: null;
    maxDistance: number;
  }>(pipeline).exec();
  if (result.length === 0) return 5;

  const maxDist = Math.max(...result.map((r) => r.maxDistance));
  return Math.max(5, Math.ceil(maxDist));
};

const buildFilterQuery = (
  filters: FiltersEventType | undefined,
  coordinates: CoordinatesType | undefined
): QueryFilter<EventDocType> => {
  const query: QueryFilter<EventDocType> = {};
  const now = Date.now();

  if (filters?.eventName)
    query.title = { $regex: filters.eventName, $options: "i" };

  if (filters?.eventStatus) {
    if (filters.eventStatus === "past") {
      query["date.finish"] = { $lt: now };
    } else if (filters.eventStatus === "upcoming") {
      query["date.finish"] = { $gte: now };
    }
  }

  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    const priceConditions: Array<Record<string, unknown>> = [];
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      priceConditions.push({
        $and: [
          { "price.start": { $lte: filters.maxPrice } },
          { "price.finish": { $gte: filters.minPrice } },
        ],
      });
    } else if (filters.minPrice !== undefined) {
      priceConditions.push({ "price.finish": { $gte: filters.minPrice } });
    } else if (filters.maxPrice !== undefined) {
      priceConditions.push({ "price.start": { $lte: filters.maxPrice } });
    }
    if (priceConditions.length > 0) {
      query.$and = [...(query.$and || []), ...priceConditions];
      query.price = { $ne: null };
    }
  }

  if (filters?.maxDistance && coordinates) {
    const bbox = calculateBoundingBox(
      coordinates.latitude,
      coordinates.longitude,
      filters.maxDistance
    );
    query["coordinates.latitude"] = { $gte: bbox.minLat, $lte: bbox.maxLat };
    query["coordinates.longitude"] = { $gte: bbox.minLon, $lte: bbox.maxLon };
    query.coordinates = { $exists: true, $ne: null };
  }
  if (filters?.countryId)
    query.country_place_id = new mongoose.Types.ObjectId(filters.countryId);
  if (filters?.placeId)
    query.place_id = new mongoose.Types.ObjectId(filters.placeId);

  return query;
};

const buildSortQuery = (
  sort: SortEventType | undefined
): Record<string, 1 | -1> | null => {
  if (!sort) return null;
  if (sort === "date") return { "date.start": 1 };

  return null;
};

const normalizeTimelineItems = (
  timeline: TimelineItemType[] | undefined | null
) => {
  try {
    if (!Array.isArray(timeline)) return [];
    return [...timeline].sort((a, b) => (a.start || 0) - (b.start || 0));
  } catch (error) {
    console.log("Error normalizing timeline items:", error);
    return [];
  }
};

export const normalizeEventTimeline = <T extends { timeline?: unknown }>(
  event: T
): T => ({
  ...event,
  timeline: normalizeTimelineItems(
    event.timeline as unknown as TimelineItemType[]
  ),
});

const normalizeCommentStatus = (comment: CommentEventType) => ({
  ...comment,
  status: comment.status || "verify",
});

const shouldIncludeComment = (
  comment: CommentEventType,
  viewerUserId?: string
) => {
  const status = comment.status || "verify";
  if (status !== "pending") return true;
  if (!viewerUserId) return false;
  return comment.userId?.toString() === viewerUserId.toString();
};

export const normalizeEventComments = <T extends { comments?: unknown }>(
  event: T,
  viewerUserId?: string
): T => ({
  ...event,
  comments: Array.isArray(event.comments)
    ? (event.comments as unknown as CommentEventType[])
        .map(normalizeCommentStatus)
        .filter((comment) => shouldIncludeComment(comment, viewerUserId))
    : [],
});

export const calculateVerifiedRating = (
  comments: CommentEventType[] | undefined | null
) => {
  if (!Array.isArray(comments) || comments.length === 0) return null;
  const verifiedComments = comments.filter(
    (comment) => (comment.status || "verify") === "verify"
  );

  if (verifiedComments.length === 0) return null;
  const sum = verifiedComments.reduce(
    (total, comment) => total + comment.rating,
    0
  );
  return sum / verifiedComments.length;
};

export const scheduleEventCommentVerification = ({
  eventId,
  commentId,
  text,
  title,
}: {
  eventId: string;
  commentId: string;
  text: string;
  title?: string;
}) => {
  (async () => {
    try {
      const { ok, reason } = await verifyCommentWithAI({
        text,
        context: "event",
        title,
      });
      if (ok) {
        const event = await EventModel.findOneAndUpdate(
          { _id: eventId, "comments._id": commentId },
          { $set: { "comments.$.status": "verify" } },
          { new: true }
        ).lean();
        if (!event) return;
        const rating = calculateVerifiedRating(
          event.comments as unknown as CommentEventType[]
        );
        await EventModel.updateOne({ _id: eventId }, { $set: { rating } });
        return;
      }
      if (!reason || AI_ERROR_REASONS.has(reason)) return;

      const event = await EventModel.findOneAndUpdate(
        { _id: eventId },
        { $pull: { comments: { _id: commentId } } },
        { new: true }
      ).lean();
      if (!event) return;

      const rating = calculateVerifiedRating(
        event.comments as unknown as CommentEventType[]
      );
      await EventModel.updateOne({ _id: eventId }, { $set: { rating } });
    } catch (error) {
      console.warn("Error in scheduleEventCommentVerification:", error);
    }
  })().catch((error) => {
    console.warn("Error in scheduleEventCommentVerification:", error);
  });
};

export const getEvents = async ({
  filters,
  sort,
  pagination,
  coordinates,
  userId,
  populate,
}: GetEventsParams) => {
  const page = pagination?.page ? Math.max(1, pagination.page) : 1;
  const limit = pagination?.limit ? Math.max(1, pagination.limit) : 50;
  const baseQuery: QueryFilter<EventDocType> = userId
    ? {
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { ownerUserId: new mongoose.Types.ObjectId(userId) },
        ],
      }
    : {};
  const filterQuery = buildFilterQuery(filters, coordinates);
  const query = { ...baseQuery, ...filterQuery };
  let queryBuilder = EventModel.find(query);
  if (populate && populate.length > 0)
    populate.forEach((pop) => {
      queryBuilder = queryBuilder.populate(pop);
    });

  let maxDistance = 5;
  if (coordinates)
    maxDistance = await calculateMaxDistance(
      coordinates.latitude,
      coordinates.longitude
    );

  if (sort === "distance" && coordinates) {
    const lat1 = coordinates.latitude;
    const lon1 = coordinates.longitude;

    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          distance: {
            $let: {
              vars: {
                lat1Rad: { $multiply: [{ $literal: lat1 }, Math.PI / 180] },
                lon1Rad: { $multiply: [{ $literal: lon1 }, Math.PI / 180] },
                lat2Rad: {
                  $multiply: ["$coordinates.latitude", Math.PI / 180],
                },
                lon2Rad: {
                  $multiply: ["$coordinates.longitude", Math.PI / 180],
                },
              },
              in: {
                $multiply: [
                  6371,
                  {
                    $acos: {
                      $add: [
                        {
                          $multiply: [
                            { $sin: "$$lat1Rad" },
                            { $sin: "$$lat2Rad" },
                          ],
                        },
                        {
                          $multiply: [
                            { $cos: "$$lat1Rad" },
                            { $cos: "$$lat2Rad" },
                            { $cos: { $subtract: ["$$lon2Rad", "$$lon1Rad"] } },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $sort: { distance: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [eventsResult, totalResult] = await Promise.all([
      EventModel.aggregate<EventDocType>(pipeline).exec(),
      EventModel.countDocuments(query).exec(),
    ]);

    const eventIds = eventsResult.map((e) => e._id);
    let eventsQuery = EventModel.find({ _id: { $in: eventIds } });

    if (populate && populate.length > 0) {
      populate.forEach((pop) => {
        eventsQuery = eventsQuery.populate(pop);
      });
    }

    const events = await eventsQuery.lean();
    const eventsMap = new Map(events.map((e) => [e._id.toString(), e]));
    const sortedEvents = eventIds
      .map((id) => eventsMap.get(id.toString()))
      .filter((e) => e !== undefined);
    const normalizedEvents = sortedEvents.map((event) =>
      normalizeEventTimeline(event)
    );

    const total = totalResult;
    const totalPages = Math.ceil(total / limit);

    const paginationResult: PaginationResult = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      events: normalizedEvents,
      pagination: paginationResult,
      maxDistance,
    };
  }

  const sortQuery = buildSortQuery(sort);
  if (sortQuery) queryBuilder = queryBuilder.sort(sortQuery);
  else queryBuilder = queryBuilder.sort({ "date.start": -1 });

  const total = await EventModel.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  queryBuilder = queryBuilder.skip(skip).limit(limit);

  const events = await queryBuilder.lean();
  const normalizedEvents = events.map((event) => normalizeEventTimeline(event));
  const paginationResult: PaginationResult = {
    page,
    limit,
    total,
    totalPages,
  };

  return {
    events: normalizedEvents,
    pagination: paginationResult,
    maxDistance,
  };
};
