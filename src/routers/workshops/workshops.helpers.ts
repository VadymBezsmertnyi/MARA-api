import WorkshopModel, { WorkshopDocType } from "./workshops.model";
import { PipelineStage, QueryFilter } from "mongoose";
import {
  CommentWorkshopType,
  FiltersType,
  SortType,
  CoordinatesType,
  PaginationResult,
  GetWorkshopsParams,
} from "./workshops.types";
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

  const result = await WorkshopModel.aggregate<{
    _id: null;
    maxDistance: number;
  }>(pipeline).exec();
  if (result.length === 0) return 5;

  const maxDist = Math.max(...result.map((r) => r.maxDistance));
  return Math.max(5, Math.ceil(maxDist));
};

const buildFilterQuery = (
  filters: FiltersType | undefined,
  coordinates: CoordinatesType | undefined
): QueryFilter<WorkshopDocType> => {
  const query: QueryFilter<WorkshopDocType> = {};
  if (filters?.moto !== null && filters?.moto !== undefined) {
    if (filters.moto.length === 0)
      query.motoTypesWorks = { $exists: true, $ne: [] };
    else query.motoTypesWorks = { $in: filters.moto };
  }
  if (filters?.auto !== null && filters?.auto !== undefined) {
    if (filters.auto.length === 0)
      query.autoTypesWorks = { $exists: true, $ne: [] };
    else query.autoTypesWorks = { $in: filters.auto };
  }
  if (filters?.minRating !== null && filters?.minRating !== undefined)
    query.rating = { $gte: filters.minRating };
  if (filters?.workshopName)
    query.title = { $regex: filters.workshopName, $options: "i" };
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

  return query;
};

const buildSortQuery = (
  sort: SortType | undefined
): Record<string, 1 | -1> | null => {
  if (!sort) return null;
  if (sort === "comments") return { comments: -1 };
  if (sort === "rating") return { rating: -1 };

  return null;
};

export const getWorkshops = async ({
  filters,
  sort,
  pagination,
  coordinates,
  userId,
  populate,
}: GetWorkshopsParams) => {
  const page = pagination?.page ? Math.max(1, pagination.page) : 1;
  const limit = pagination?.limit ? Math.max(1, pagination.limit) : 50;
  const baseQuery: QueryFilter<WorkshopDocType> = userId
    ? {
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { ownerUserId: new mongoose.Types.ObjectId(userId) },
        ],
      }
    : {};
  const filterQuery = buildFilterQuery(filters, coordinates);
  const query = { ...baseQuery, ...filterQuery };
  let queryBuilder = WorkshopModel.find(query);
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

    const [workshopsResult, totalResult] = await Promise.all([
      WorkshopModel.aggregate<WorkshopDocType>(pipeline).exec(),
      WorkshopModel.countDocuments(query).exec(),
    ]);

    const workshopIds = workshopsResult.map((w) => w._id);
    let workshopsQuery = WorkshopModel.find({ _id: { $in: workshopIds } });

    if (populate && populate.length > 0) {
      populate.forEach((pop) => {
        workshopsQuery = workshopsQuery.populate(pop);
      });
    }

    const workshops = await workshopsQuery.lean();
    const workshopsMap = new Map(workshops.map((w) => [w._id.toString(), w]));
    const sortedWorkshops = workshopIds
      .map((id) => workshopsMap.get(id.toString()))
      .filter((w) => w !== undefined);

    const total = totalResult;
    const totalPages = Math.ceil(total / limit);

    const paginationResult: PaginationResult = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      workshops: sortedWorkshops,
      pagination: paginationResult,
      maxDistance,
    };
  }

  const sortQuery = buildSortQuery(sort);
  if (sortQuery) queryBuilder = queryBuilder.sort(sortQuery);

  const total = await WorkshopModel.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  queryBuilder = queryBuilder.skip(skip).limit(limit);

  const workshops = await queryBuilder.lean();
  const paginationResult: PaginationResult = {
    page,
    limit,
    total,
    totalPages,
  };

  return {
    workshops,
    pagination: paginationResult,
    maxDistance,
  };
};

const normalizeCommentStatus = (comment: CommentWorkshopType) => ({
  ...comment,
  status: comment.status || "verify",
});

const shouldIncludeComment = (
  comment: CommentWorkshopType,
  viewerUserId?: string
) => {
  const status = comment.status || "verify";
  if (status !== "pending") return true;
  if (!viewerUserId) return false;
  return comment.userId?.toString() === viewerUserId.toString();
};

export const normalizeWorkshopComments = <T extends { comments?: unknown }>(
  workshop: T,
  viewerUserId?: string
): T => ({
  ...workshop,
  comments: Array.isArray(workshop.comments)
    ? (workshop.comments as unknown as CommentWorkshopType[])
        .map(normalizeCommentStatus)
        .filter((comment) => shouldIncludeComment(comment, viewerUserId))
    : [],
});

export const calculateVerifiedRating = (
  comments: CommentWorkshopType[] | undefined | null
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

export const scheduleWorkshopCommentVerification = ({
  workshopId,
  commentId,
  text,
  title,
}: {
  workshopId: string;
  commentId: string;
  text: string;
  title?: string;
  notifyUserId?: string;
}) => {
  (async () => {
    try {
      const { ok, reason } = await verifyCommentWithAI({
        text,
        context: "workshop",
        title,
      });
      if (ok) {
        const workshop = await WorkshopModel.findOneAndUpdate(
          { _id: workshopId, "comments._id": commentId },
          { $set: { "comments.$.status": "verify" } },
          { new: true }
        ).lean();
        if (!workshop) return;
        const rating = calculateVerifiedRating(
          workshop.comments as unknown as CommentWorkshopType[]
        );
        await WorkshopModel.updateOne(
          { _id: workshopId },
          { $set: { rating } }
        );
        return;
      }
      if (!reason || AI_ERROR_REASONS.has(reason)) return;

      const workshop = await WorkshopModel.findOneAndUpdate(
        { _id: workshopId },
        { $pull: { comments: { _id: commentId } } },
        { new: true }
      ).lean();
      if (!workshop) return;

      const rating = calculateVerifiedRating(
        workshop.comments as unknown as CommentWorkshopType[]
      );
      await WorkshopModel.updateOne({ _id: workshopId }, { $set: { rating } });
    } catch (error) {
      console.warn("Error in scheduleWorkshopCommentVerification:", error);
    }
  })().catch((error) => {
    console.warn("Error in scheduleWorkshopCommentVerification:", error);
  });
};
