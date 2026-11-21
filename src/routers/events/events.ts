import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import mongoose from "mongoose";

// types
import { CommentEventType, EventType } from "./events.types";
import { FileDataType } from "../../hooks/s3-storage/s3-storage.types";

// models
import EventModel from "./events.model";
import UserModel from "../user/user.modal";
import { DBCountriesModel, DBPlacesModel } from "../places/places.modal";

// hooks
import { addFiles, deleteFile } from "../../hooks/s3-storage/s3-storage";
import { checkCityDB } from "../places/places.hooks";
import {
  parsePlaceFromFormData,
  parseJsonFieldsFromFormData,
} from "../../hooks/formData";
import { verifyAndUpdateEventContent } from "../../hooks/openAi/events-ai";

// populates
import { populateEvent } from "./events.populate";

// helpers
import {
  calculateVerifiedRating,
  getEvents,
  normalizeEventComments,
  normalizeEventTimeline,
  scheduleEventCommentVerification,
} from "./events.helpers";

// magic numbers
const ERROR_SERVER_FIVE_HUNDRED = 500;
const DEFAULT_VERIFICATION = {
  status: "pending" as const,
  date: Date.now(),
  reason: null,
};

dotenv.config();
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      sort,
      maxDistance,
      minPrice,
      maxPrice,
      eventName,
      eventStatus,
      latitude,
      longitude,
      countryId,
      placeId,
      userId,
    } = req.query;
    const filters: {
      maxDistance?: number;
      minPrice?: number;
      maxPrice?: number;
      eventName?: string;
      eventStatus?: "past" | "upcoming";
      countryId?: string;
      placeId?: string;
    } = {};
    if (maxDistance) filters.maxDistance = Number(maxDistance);
    if (minPrice !== undefined) filters.minPrice = Number(minPrice);
    if (maxPrice !== undefined) filters.maxPrice = Number(maxPrice);
    if (eventName) filters.eventName = eventName as string;
    if (eventStatus === "past" || eventStatus === "upcoming")
      filters.eventStatus = eventStatus;
    if (countryId) filters.countryId = countryId as string;
    if (placeId) filters.placeId = placeId as string;

    const sortValue = sort === "distance" || sort === "date" ? sort : null;
    const coordinates =
      latitude && longitude
        ? {
            latitude: Number(latitude),
            longitude: Number(longitude),
          }
        : undefined;
    const pagination = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    const result = await getEvents({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sort: sortValue,
      pagination: pagination.page || pagination.limit ? pagination : undefined,
      coordinates,
      populate: populateEvent,
    });
    const eventsToVerify: EventType[] = [];
    const verifiedEvents = result.events.filter((event) => {
      if (!event.verification || event.verification.status !== "verified") {
        eventsToVerify.push(event as unknown as EventType);
        return false;
      }
      return true;
    });
    if (eventsToVerify.length > 0)
      Promise.all(
        eventsToVerify.map((event) => verifyAndUpdateEventContent(event))
      ).catch((error) => {
        console.warn("Error verifying events:", error);
      });

    const viewerUserId = typeof userId === "string" ? userId : undefined;
    const normalizedEvents = verifiedEvents.map((event) =>
      normalizeEventComments(event, viewerUserId)
    );

    return res.send({
      result: true,
      events: normalizedEvents,
      pagination: result.pagination,
      maxDistance: result.maxDistance,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error fetching events:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/user/", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      page,
      limit,
      sort,
      maxDistance,
      minPrice,
      maxPrice,
      eventName,
      eventStatus,
      latitude,
      longitude,
      countryId,
      placeId,
    } = req.query;
    if (!userId)
      return res.send({
        result: false,
        events: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
        code: 1003,
      });

    const filters: {
      maxDistance?: number;
      minPrice?: number;
      maxPrice?: number;
      eventName?: string;
      eventStatus?: "past" | "upcoming";
      countryId?: string;
      placeId?: string;
    } = {};
    if (maxDistance) filters.maxDistance = Number(maxDistance);
    if (minPrice !== undefined) filters.minPrice = Number(minPrice);
    if (maxPrice !== undefined) filters.maxPrice = Number(maxPrice);
    if (eventName) filters.eventName = eventName as string;
    if (eventStatus === "past" || eventStatus === "upcoming")
      filters.eventStatus = eventStatus;
    if (countryId) filters.countryId = countryId as string;
    if (placeId) filters.placeId = placeId as string;

    const sortValue = sort === "distance" || sort === "date" ? sort : null;
    const coordinates =
      latitude && longitude
        ? {
            latitude: Number(latitude),
            longitude: Number(longitude),
          }
        : undefined;
    const pagination = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    const result = await getEvents({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sort: sortValue,
      pagination: pagination.page || pagination.limit ? pagination : undefined,
      coordinates,
      userId: userId as string,
      populate: populateEvent,
    });
    const eventsToVerify = result.events.filter((event) => !event.verification);
    if (eventsToVerify.length > 0)
      Promise.all(
        eventsToVerify.map((event) =>
          verifyAndUpdateEventContent(event as unknown as EventType)
        )
      ).catch((error) => {
        console.warn("Error verifying events:", error);
      });

    const normalizedEvents = result.events.map((event) =>
      normalizeEventComments(event, userId as string)
    );

    return res.send({
      result: true,
      events: normalizedEvents,
      pagination: result.pagination,
      maxDistance: result.maxDistance,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error fetching user events:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/locations/", async (req: Request, res: Response) => {
  try {
    const { eventStatus } = req.query;
    const now = Date.now();
    let dateQuery: Record<string, unknown> = {};
    if (eventStatus === "past") dateQuery = { "date.finish": { $lt: now } };
    else if (eventStatus === "upcoming")
      dateQuery = { "date.finish": { $gte: now } };

    const events = await EventModel.find({
      ...dateQuery,
      country_place_id: { $ne: null },
    })
      .select("country_place_id place_id")
      .lean();
    const countryIds = new Set<string>();
    const placeIds = new Set<string>();
    events.forEach((event) => {
      if (event.country_place_id)
        countryIds.add(event.country_place_id.toString());
      if (event.place_id) placeIds.add(event.place_id.toString());
    });

    const [countries, places] = await Promise.all([
      DBCountriesModel.find({
        _id: {
          $in: Array.from(countryIds).map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      }).lean(),
      DBPlacesModel.find({
        _id: {
          $in: Array.from(placeIds).map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      }).lean(),
    ]);

    return res.send({
      result: true,
      countries,
      places,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error fetching event locations:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/closest/", async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, userId } = req.query;
    const coordinates =
      latitude && longitude
        ? {
            latitude: Number(latitude),
            longitude: Number(longitude),
          }
        : undefined;
    const [upcomingResult, pastResult] = await Promise.all([
      getEvents({
        filters: {
          eventStatus: "upcoming",
        },
        sort: "date",
        pagination: { page: 1, limit: 10 },
        coordinates,
        populate: populateEvent,
      }),
      getEvents({
        filters: {
          eventStatus: "past",
        },
        sort: null,
        pagination: { page: 1, limit: 10 },
        coordinates,
        populate: populateEvent,
      }),
    ]);
    const viewerUserId = typeof userId === "string" ? userId : undefined;
    const normalizeForViewer = (event: EventType) =>
      normalizeEventComments(event, viewerUserId);

    const upcomingAndCurrent = upcomingResult.events
      .map((event) => normalizeForViewer(event as unknown as EventType))
      .filter((event) => event.date?.start && event.date?.finish)
      .filter(
        (event) =>
          !event.verification || event.verification.status === "verified"
      )
      .sort((a, b) => (a.date.start || 0) - (b.date.start || 0))
      .slice(0, 3);
    const pastEvents = pastResult.events
      .map((event) => normalizeForViewer(event as unknown as EventType))
      .filter((event) => event.date?.start && event.date?.finish)
      .filter(
        (event) =>
          !event.verification || event.verification.status === "verified"
      )
      .sort((a, b) => (b.date.finish || 0) - (a.date.finish || 0))
      .slice(0, 3);

    return res.send({
      result: true,
      upcomingAndCurrent,
      past: pastEvents,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error fetching closest events:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.post(
  "/add/",
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, string | undefined>;
      const place = parsePlaceFromFormData(body);
      const { _id: _, place: __, ...otherBodyRaw } = body;
      const otherBody = parseJsonFieldsFromFormData<EventType>(otherBodyRaw);
      const files = req.files as Express.Multer.File[];
      let imageFiles: Array<FileDataType> = [];
      if (files && files.length > 0) {
        const uploadResults = await addFiles(files, "events", "images");
        imageFiles = uploadResults.map((result) => ({
          _id: new mongoose.Types.ObjectId(),
          url: result.url,
        }));
      }
      const placeGetEvent = place ? await checkCityDB(place.placeId) : null;
      const placeEvent =
        placeGetEvent && place && placeGetEvent.region && placeGetEvent.country
          ? {
              place_id: placeGetEvent.place._id,
              region_place_id: placeGetEvent.region._id,
              country_place_id: placeGetEvent.country._id,
              coordinates: place.coordinates,
              place_address: place.address,
            }
          : null;
      const _idEvent = new mongoose.Types.ObjectId();
      await new EventModel({
        _id: _idEvent,
        ...otherBody,
        imageFiles,
        ...placeEvent,
        verification: DEFAULT_VERIFICATION,
      }).save();
      const event = await EventModel.findOne({ _id: _idEvent })
        .lean()
        .populate(populateEvent);
      const user = await UserModel.findOne({
        _id: otherBody.userId.toString(),
      });

      if (user && event) {
        const listEvents = [...user.eventsIds, event._id];

        await UserModel.findOneAndUpdate(
          { _id: otherBody.userId.toString() }, // Умова пошуку
          { $set: { eventsIds: listEvents } } // Оновлені поля
        );

        verifyAndUpdateEventContent(event as unknown as EventType).catch(
          (error) => {
            console.warn("Error verifying event:", error);
          }
        );

        const normalizedEvent = event ? normalizeEventTimeline(event) : event;
        return res.send({ result: true, event: normalizedEvent, code: 1000 });
      }
      return res.send({ result: false, code: 1003 });
    } catch (error: unknown) {
      console.warn("Error adding event:", error);
      if (error instanceof Error)
        return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
      return res
        .status(ERROR_SERVER_FIVE_HUNDRED)
        .send({ message: "Internal Server Error" });
    }
  }
);

router.post(
  "/change/",
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, string | undefined>;
      const place = parsePlaceFromFormData(body);
      const existingImages = body.existingImages;
      const { place: _, existingImages: __, ...otherBodyRaw } = body;
      const otherBody = parseJsonFieldsFromFormData<EventType>(otherBodyRaw);

      const oldEvent = await EventModel.findOne({
        _id: otherBody._id.toString(),
      });
      const files = req.files as Express.Multer.File[];

      let imageFiles: Array<FileDataType> = [];
      if (existingImages !== undefined) {
        try {
          const parsed = JSON.parse(existingImages as string) as Array<{
            _id?: string;
            url: string;
          }>;
          imageFiles = parsed
            .filter(
              (img) =>
                img.url &&
                !img.url.includes("file://") &&
                !img.url.startsWith("file://") &&
                !img.url.includes("data:image")
            )
            .map((img) => ({
              _id: img._id || new mongoose.Types.ObjectId(),
              url: img.url,
            }));
        } catch {
          imageFiles = [];
        }
      } else if (oldEvent?.imageFiles)
        imageFiles = oldEvent.imageFiles.map((img) => ({
          ...img,
          width: img.width || undefined,
          height: img.height || undefined,
          fileType: img.fileType || undefined,
          folder: img.folder || undefined,
        }));

      if (files && files.length > 0) {
        const uploadResults = await addFiles(files, "events", "images");
        const newImageFiles = uploadResults.map((result) => ({
          _id: new mongoose.Types.ObjectId(),
          url: result.url,
        }));
        imageFiles = [...imageFiles, ...newImageFiles];
      }
      const oldImageFiles = (oldEvent?.imageFiles || []) as Array<FileDataType>;
      const newImageUrls = imageFiles.map((img) => img.url).filter(Boolean);
      const imageFilesDelete = oldImageFiles.filter((imageOld) => {
        if (!imageOld?.url) return false;
        return !newImageUrls.includes(imageOld.url);
      });
      if (imageFilesDelete?.length)
        await Promise.all(
          imageFilesDelete.map((imageDelete) => {
            if (imageDelete?.url) return deleteFile(imageDelete.url);
            return Promise.resolve();
          })
        );

      const placeGetEvent = place ? await checkCityDB(place.placeId) : null;
      const placeEvent =
        placeGetEvent && place && placeGetEvent.region && placeGetEvent.country
          ? {
              place_id: placeGetEvent.place._id,
              region_place_id: placeGetEvent.region._id,
              country_place_id: placeGetEvent.country._id,
              coordinates: place.coordinates,
              place_address: place.address,
            }
          : null;

      const nonVerifyFields = new Set([
        "_id",
        "userId",
        "likeUserIds",
        "comments",
        "rating",
        "goingUserIds",
      ]);
      const updateKeys = Object.keys(otherBody);
      const hasOnlyNonVerifyChanges = updateKeys.every((key) =>
        nonVerifyFields.has(key)
      );
      const hasImageChanges =
        existingImages !== undefined || (files && files.length > 0);
      const hasPlaceChange = !!place;
      const shouldVerify =
        !hasOnlyNonVerifyChanges || hasImageChanges || hasPlaceChange;

      const event = await EventModel.findOneAndUpdate(
        { _id: otherBody._id.toString() },
        {
          $set: {
            ...otherBody,
            imageFiles,
            ...(placeEvent ? placeEvent : {}),
            ...(shouldVerify ? { verification: DEFAULT_VERIFICATION } : {}),
          },
        },
        { new: true }
      )
        .lean()
        .populate(populateEvent);

      if (event) {
        if (shouldVerify)
          verifyAndUpdateEventContent(event as unknown as EventType).catch(
            (error) => {
              console.warn("Error verifying event:", error);
            }
          );
        const normalizedEvent = normalizeEventTimeline(event);
        return res.send({ result: true, event: normalizedEvent, code: 1000 });
      }

      return res.send({ result: false, code: 1003 });
    } catch (error: unknown) {
      console.warn("Error changing event:", error);
      if (error instanceof Error)
        return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
      return res
        .status(ERROR_SERVER_FIVE_HUNDRED)
        .send({ message: "Internal Server Error" });
    }
  }
);

router.delete("/delete/", async (req: Request, res: Response) => {
  try {
    const { _id } = req.body;
    const eventDelete = await EventModel.findOne({ _id });
    if (eventDelete) {
      if (eventDelete.imageFiles.length > 0)
        await Promise.all(
          eventDelete.imageFiles.map(async (image) => {
            return await deleteFile(image.url);
          })
        );
      await EventModel.deleteOne({ _id });
      const user = await UserModel.findOne({ _id: eventDelete.userId });

      if (user) {
        const eventsIds = user.eventsIds.filter(
          (eventsId) => eventsId.toString() !== _id.toString()
        );

        await UserModel.findOneAndUpdate(
          { _id: eventDelete.userId }, // Умова пошуку
          { $set: { eventsIds } } // Оновлені поля
        );

        return res.send({ result: true, code: 1000 });
      }
      return res.send({ result: true, code: 1000 });
    }
    return res.send({ result: false, code: 1003 });
  } catch (error: unknown) {
    console.warn("Error deleting event:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.query;
    if (!eventId)
      return res.status(400).send({
        result: false,
        event: null,
        code: 1003,
      });

    const event = await EventModel.findOne({ _id: eventId })
      .lean()
      .populate(populateEvent);
    if (!event)
      return res.status(404).send({
        result: false,
        event: null,
        code: 1004,
      });

    const eventsToVerify = !event.verification ? [event] : [];
    if (eventsToVerify.length > 0)
      Promise.all(
        eventsToVerify.map((e) =>
          verifyAndUpdateEventContent(e as unknown as EventType)
        )
      ).catch((error) => {
        console.warn("Error verifying event:", error);
      });

    const viewerUserId = typeof userId === "string" ? userId : undefined;
    const normalizedEvent = normalizeEventComments(
      normalizeEventTimeline(event),
      viewerUserId
    );
    return res.send({
      result: true,
      event: normalizedEvent,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error in /events/:eventId:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.post("/comments/add/", async (req: Request, res: Response) => {
  try {
    const { idEvent, ...comment } = req.body;
    const selectEvent = await EventModel.findOne({
      _id: idEvent,
    }).lean();

    if (selectEvent) {
      const currentComments = selectEvent.comments || [];
      const _id = new mongoose.Types.ObjectId();
      const newComment: CommentEventType = {
        _id,
        ...comment,
        status: "pending",
        dateCreate: Date.now(),
        dateUpdate: Date.now(),
      };
      const rating = calculateVerifiedRating([
        ...currentComments,
        newComment,
      ] as CommentEventType[]);

      const event = await EventModel.findOneAndUpdate(
        { _id: selectEvent._id },
        {
          $set: { comments: [...currentComments, newComment], rating },
        },
        { new: true }
      )
        .lean()
        .populate(populateEvent);

      const normalizedEvent = event
        ? normalizeEventComments(event, comment.userId?.toString())
        : event;
      res.send({ result: true, event: normalizedEvent, code: 1000 });
      scheduleEventCommentVerification({
        eventId: selectEvent._id.toString(),
        commentId: _id.toString(),
        text: comment.description,
        title: selectEvent.title,
      });
      return;
    }
    return res.send({ result: false, code: 1003 });
  } catch (error: unknown) {
    console.warn("Error in /events/comments/add/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.put("/comments/change/", async (req: Request, res: Response) => {
  try {
    const { idEvent, ...changeComment } = req.body;
    const selectEvent = await EventModel.findOne({
      _id: idEvent,
    }).lean();
    if (selectEvent) {
      const targetComment = (selectEvent.comments || []).find(
        (comment) => comment._id.toString() === changeComment._id.toString()
      );
      if (!targetComment) return res.send({ result: false, code: 1003 });

      const hasDescriptionChange =
        targetComment.description !== changeComment.description;
      const hasRatingChange = targetComment.rating !== changeComment.rating;
      const shouldReverify = hasDescriptionChange || hasRatingChange;
      if (!shouldReverify) {
        const event = await EventModel.findOne({ _id: selectEvent._id })
          .lean()
          .populate(populateEvent);
        const normalizedEvent = event
          ? normalizeEventComments(event, changeComment.userId?.toString())
          : event;
        return res.send({ result: true, event: normalizedEvent, code: 1000 });
      }

      const comments: CommentEventType[] = (selectEvent.comments || []).map(
        (comment) =>
          comment._id.toString() === changeComment._id.toString()
            ? {
                ...comment,
                userId: changeComment.userId.toString(),
                userName: changeComment.userName,
                rating: changeComment.rating,
                description: changeComment.description,
                status: "pending",
                dateCreate: comment.dateCreate || Date.now(),
                dateUpdate: Date.now(),
              }
            : { ...comment, userId: comment.userId.toString() }
      );
      const rating = calculateVerifiedRating(comments);

      const event = await EventModel.findOneAndUpdate(
        { _id: selectEvent._id.toString() },
        { $set: { comments, rating } },
        { new: true }
      )
        .lean()
        .populate(populateEvent);

      const normalizedEvent = event
        ? normalizeEventComments(event, changeComment.userId?.toString())
        : event;
      res.send({ result: true, event: normalizedEvent, code: 1000 });
      scheduleEventCommentVerification({
        eventId: selectEvent._id.toString(),
        commentId: changeComment._id.toString(),
        text: changeComment.description,
        title: selectEvent.title,
      });
      return;
    }
    return res.send({ result: false, code: 1003 });
  } catch (error: unknown) {
    console.warn("Error in /events/comments/change/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

export default router;
