import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import mongoose from "mongoose";

// types
import { CommentWorkshopType, WorkshopType } from "./workshops.types";

// models
import WorkshopModel from "./workshops.model";
import UserModel from "../user/user.modal";

// hooks
import { addFiles, deleteFile } from "../../hooks/s3-storage/s3-storage";
import { newCommentWorkshop } from "../../hooks/pushNotification/pushNotification";
import { checkCityDB } from "../places/places.hooks";
import {
  parsePlaceFromFormData,
  parseJsonFieldsFromFormData,
} from "../../hooks/formData";
import { FileDataType } from "../../hooks/s3-storage/s3-storage.types";
import { verifyAndUpdateWorkshopContent } from "../../hooks/openAi/workshops-ai";

// populates
import { workshopPopulate } from "./workshops.populates";

// helpers
import {
  calculateVerifiedRating,
  getWorkshops,
  normalizeWorkshopComments,
  scheduleWorkshopCommentVerification,
} from "./workshops.helpers";

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
      moto,
      auto,
      maxDistance,
      minRating,
      workshopName,
      latitude,
      longitude,
      userId,
    } = req.query;
    const filters: {
      moto?: number[] | null;
      auto?: number[] | null;
      maxDistance?: number;
      minRating?: number | null;
      workshopName?: string;
    } = {};
    if (moto !== undefined) {
      try {
        filters.moto =
          moto === "null" || moto === "" ? null : JSON.parse(moto as string);
      } catch {
        filters.moto = null;
      }
    }
    if (auto !== undefined) {
      try {
        filters.auto =
          auto === "null" || auto === "" ? null : JSON.parse(auto as string);
      } catch {
        filters.auto = null;
      }
    }
    if (maxDistance) filters.maxDistance = Number(maxDistance);
    if (minRating !== undefined)
      filters.minRating =
        minRating === "null" || minRating === "" ? null : Number(minRating);
    if (workshopName) filters.workshopName = workshopName as string;

    const sortValue =
      sort === "comments" || sort === "distance" || sort === "rating"
        ? sort
        : null;
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
    const result = await getWorkshops({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sort: sortValue,
      pagination: pagination.page || pagination.limit ? pagination : undefined,
      coordinates,
      populate: workshopPopulate,
    });
    const workshopsToVerify: WorkshopType[] = [];
    const verifiedWorkshops = result.workshops.filter((workshop) => {
      if (
        !workshop.verification ||
        workshop.verification.status !== "verified"
      ) {
        workshopsToVerify.push(workshop as unknown as WorkshopType);
        return false;
      }
      return true;
    });
    if (workshopsToVerify.length > 0)
      Promise.all(
        workshopsToVerify.map((workshop) =>
          verifyAndUpdateWorkshopContent(workshop)
        )
      ).catch((error) => {
        console.warn("Error verifying workshops:", error);
      });

    const viewerUserId = typeof userId === "string" ? userId : undefined;
    const normalizedWorkshops = verifiedWorkshops.map((workshop) =>
      normalizeWorkshopComments(workshop, viewerUserId)
    );

    return res.send({
      result: true,
      workshops: normalizedWorkshops,
      pagination: result.pagination,
      maxDistance: result.maxDistance,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error in /workshops/:", error);
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
      moto,
      auto,
      maxDistance,
      minRating,
      workshopName,
      latitude,
      longitude,
    } = req.query;
    if (!userId)
      return res.send({
        result: false,
        workshops: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
        code: 1003,
      });

    const filters: {
      moto?: number[] | null;
      auto?: number[] | null;
      maxDistance?: number;
      minRating?: number | null;
      workshopName?: string;
    } = {};
    if (moto !== undefined) {
      try {
        filters.moto =
          moto === "null" || moto === "" ? null : JSON.parse(moto as string);
      } catch {
        filters.moto = null;
      }
    }
    if (auto !== undefined) {
      try {
        filters.auto =
          auto === "null" || auto === "" ? null : JSON.parse(auto as string);
      } catch {
        filters.auto = null;
      }
    }
    if (maxDistance) filters.maxDistance = Number(maxDistance);
    if (minRating !== undefined)
      filters.minRating =
        minRating === "null" || minRating === "" ? null : Number(minRating);
    if (workshopName) filters.workshopName = workshopName as string;

    const sortValue =
      sort === "comments" || sort === "distance" || sort === "rating"
        ? sort
        : null;
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
    const result = await getWorkshops({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sort: sortValue,
      pagination: pagination.page || pagination.limit ? pagination : undefined,
      coordinates,
      userId: userId as string,
      populate: workshopPopulate,
    });
    const workshopsToVerify = result.workshops.filter(
      (workshop) => !workshop.verification
    );
    if (workshopsToVerify.length > 0)
      Promise.all(
        workshopsToVerify.map((workshop) =>
          verifyAndUpdateWorkshopContent(workshop as unknown as WorkshopType)
        )
      ).catch((error) => {
        console.warn("Error verifying workshops:", error);
      });

    const normalizedWorkshops = result.workshops.map((workshop) =>
      normalizeWorkshopComments(workshop, userId as string)
    );

    return res.send({
      result: true,
      workshops: normalizedWorkshops,
      pagination: result.pagination,
      maxDistance: result.maxDistance,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error in /workshops/user/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.get("/:workshopId", async (req: Request, res: Response) => {
  try {
    const { workshopId } = req.params;
    const { userId } = req.query;
    if (!workshopId)
      return res.status(400).send({
        result: false,
        workshop: null,
        code: 1003,
      });

    const workshop = await WorkshopModel.findOne({ _id: workshopId })
      .lean()
      .populate(workshopPopulate);
    if (!workshop)
      return res.status(404).send({
        result: false,
        workshop: null,
        code: 1004,
      });

    const workshopsToVerify = !workshop.verification ? [workshop] : [];
    if (workshopsToVerify.length > 0)
      Promise.all(
        workshopsToVerify.map((w) =>
          verifyAndUpdateWorkshopContent(w as unknown as WorkshopType)
        )
      ).catch((error) => {
        console.warn("Error verifying workshop:", error);
      });

    const normalizedWorkshop = normalizeWorkshopComments(
      workshop,
      typeof userId === "string" ? userId : undefined
    );

    return res.send({
      result: true,
      workshop: normalizedWorkshop,
      code: 1000,
    });
  } catch (error: unknown) {
    console.warn("Error in /workshops/:workshopId:", error);
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
      const otherBody = parseJsonFieldsFromFormData<WorkshopType>(otherBodyRaw);
      const files = req.files as Express.Multer.File[];

      let imageFiles: Array<FileDataType> = [];
      if (files && files.length > 0) {
        const uploadResults = await addFiles(files, "workshops", "images");
        imageFiles = uploadResults.map((result) => ({
          _id: new mongoose.Types.ObjectId(),
          url: result.url,
        }));
      }
      const placeGetEvent = place ? await checkCityDB(place.placeId) : null;
      const placeEvent =
        placeGetEvent && place
          ? {
              place_id: placeGetEvent.place._id,
              region_place_id: placeGetEvent.region?._id || null,
              country_place_id: placeGetEvent.country?._id || null,
              coordinates: place.coordinates,
              place_address: place.address,
            }
          : null;
      const _id = new mongoose.Types.ObjectId();
      await new WorkshopModel({
        _id,
        ...otherBody,
        imageFiles,
        ...placeEvent,
        verification: DEFAULT_VERIFICATION,
      }).save();
      const workshopFull = await WorkshopModel.findOne({ _id })
        .lean()
        .populate(workshopPopulate);
      const user = await UserModel.findOne({
        _id: otherBody.userId.toString(),
      });

      if (user && workshopFull) {
        const listWorkshopsIds = [...user.workshopsIds, workshopFull._id];

        await UserModel.findOneAndUpdate(
          { _id: otherBody.userId.toString() },
          { $set: { workshopsIds: listWorkshopsIds } }
        );

        verifyAndUpdateWorkshopContent(
          workshopFull as unknown as WorkshopType
        ).catch((error) => {
          console.warn("Error verifying workshop:", error);
        });

        return res.send({ result: true, workshop: workshopFull, code: 1000 });
      }
      return res.send({ result: false, code: 1003 });
    } catch (error: unknown) {
      console.warn("Error in /workshops/add/:", error);
      if (error instanceof Error)
        return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
      return res
        .status(ERROR_SERVER_FIVE_HUNDRED)
        .send({ message: "Internal Server Error" });
    }
  }
);

router.put(
  "/change/",
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, string | undefined>;
      const place = parsePlaceFromFormData(body);
      const existingImages = body.existingImages;
      const { place: _, existingImages: __, ...otherBodyRaw } = body;
      const otherBody = parseJsonFieldsFromFormData<WorkshopType>(otherBodyRaw);

      const oldWorkshop = await WorkshopModel.findOne({
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
      } else if (oldWorkshop?.imageFiles)
        imageFiles = oldWorkshop.imageFiles.map((img) => ({
          ...img,
          width: img.width || undefined,
          height: img.height || undefined,
          fileType: img.fileType || undefined,
          folder: img.folder || undefined,
        }));

      if (files && files.length > 0) {
        const uploadResults = await addFiles(files, "workshops", "images");
        const newImageFiles = uploadResults.map((result) => ({
          _id: new mongoose.Types.ObjectId(),
          url: result.url,
        }));
        imageFiles = [...imageFiles, ...newImageFiles];
      }
      const oldImageFiles = (oldWorkshop?.imageFiles ||
        []) as Array<FileDataType>;
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
        placeGetEvent && place
          ? {
              place_id: placeGetEvent.place._id,
              region_place_id: placeGetEvent.region?._id,
              country_place_id: placeGetEvent.country?._id,
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
      const workshop = await WorkshopModel.findOneAndUpdate(
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
        .populate(workshopPopulate);

      if (workshop) {
        if (shouldVerify)
          verifyAndUpdateWorkshopContent(
            workshop as unknown as WorkshopType
          ).catch((error) => {
            console.warn("Error verifying workshop:", error);
          });
        return res.send({ result: true, workshop, code: 1000 });
      }
      return res.send({ result: false, code: 1003 });
    } catch (error: unknown) {
      console.warn("Error in /workshops/change/:", error);
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
    const workshopDelete = await WorkshopModel.findOne({ _id });
    if (workshopDelete) {
      if (workshopDelete.imageFiles.length > 0)
        await Promise.all(
          workshopDelete.imageFiles.map(async (image) => {
            return await deleteFile(image.url);
          })
        );
      const user = await UserModel.findOne({ _id: workshopDelete.userId });

      if (user) {
        const workshopsIds = user.workshopsIds.filter(
          (workshopsId) => workshopsId.toString() !== _id
        );

        await UserModel.findOneAndUpdate(
          { _id: workshopDelete.userId },
          { $set: { workshopsIds } }
        );
        await WorkshopModel.deleteOne({ _id });
        return res.send({ result: true, code: 1000 });
      }
      return res.send({ result: false, code: 1003 });
    }
    return res.send({ result: false, code: 1003 });
  } catch (error: unknown) {
    console.warn("Error in /workshops/delete/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.post("/comments/add/", async (req: Request, res: Response) => {
  try {
    const { idWorkshop, ...comment } = req.body;
    const selectWorkshop = await WorkshopModel.findOne({
      _id: idWorkshop,
    }).lean();

    if (selectWorkshop) {
      const _id = new mongoose.Types.ObjectId();
      const newComment: CommentWorkshopType = {
        _id,
        ...comment,
        status: "pending",
        dateCreate: Date.now(),
        dateUpdate: Date.now(),
      };
      const rating = calculateVerifiedRating([
        ...selectWorkshop.comments,
        newComment,
      ] as CommentWorkshopType[]);

      const workshop = await WorkshopModel.findOneAndUpdate(
        { _id: selectWorkshop._id },
        {
          $set: { comments: [...selectWorkshop.comments, newComment], rating },
        },
        { new: true }
      )
        .lean()
        .populate(workshopPopulate);

      await newCommentWorkshop(
        selectWorkshop.userId.toString(),
        selectWorkshop._id.toString(),
        selectWorkshop.title
      );

      const normalizedWorkshop = workshop
        ? normalizeWorkshopComments(workshop, comment.userId?.toString())
        : workshop;
      res.send({ result: true, workshop: normalizedWorkshop, code: 1000 });
      scheduleWorkshopCommentVerification({
        workshopId: selectWorkshop._id.toString(),
        commentId: _id.toString(),
        text: comment.description,
        title: selectWorkshop.title,
        notifyUserId: selectWorkshop.userId?.toString(),
      });
      return;
    }
    return res.send({ result: false, code: 1003 });
  } catch (error: unknown) {
    console.warn("Error in /workshops/comments/add/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

router.put("/comments/change/", async (req: Request, res: Response) => {
  try {
    const { idWorkshop, ...changeComment } = req.body;
    const selectWorkshop = await WorkshopModel.findOne({
      _id: idWorkshop,
    }).lean();
    if (selectWorkshop) {
      const targetComment = selectWorkshop.comments.find(
        (comment) => comment._id.toString() === changeComment._id.toString()
      );
      if (!targetComment) return res.send({ result: false, code: 1003 });

      const hasDescriptionChange =
        targetComment.description !== changeComment.description;
      const hasRatingChange = targetComment.rating !== changeComment.rating;
      const shouldReverify = hasDescriptionChange || hasRatingChange;

      if (!shouldReverify) {
        const workshop = await WorkshopModel.findOne({
          _id: selectWorkshop._id,
        })
          .lean()
          .populate(workshopPopulate);
        const normalizedWorkshop = workshop
          ? normalizeWorkshopComments(
              workshop,
              changeComment.userId?.toString()
            )
          : workshop;
        return res.send({
          result: true,
          workshop: normalizedWorkshop,
          code: 1000,
        });
      }

      const comments: CommentWorkshopType[] = selectWorkshop.comments.map(
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

      const workshop = await WorkshopModel.findOneAndUpdate(
        { _id: selectWorkshop._id.toString() },
        { $set: { comments, rating } },
        { new: true }
      )
        .lean()
        .populate(workshopPopulate);

      const normalizedWorkshop = workshop
        ? normalizeWorkshopComments(workshop, changeComment.userId?.toString())
        : workshop;
      res.send({
        result: true,
        workshop: normalizedWorkshop,
        code: 1000,
      });
      scheduleWorkshopCommentVerification({
        workshopId: selectWorkshop._id.toString(),
        commentId: changeComment._id.toString(),
        text: changeComment.description,
        title: selectWorkshop.title,
        notifyUserId: selectWorkshop.userId?.toString(),
      });
      return;
    }
    return res.send({ result: false, code: 1003 });
  } catch (error: unknown) {
    console.warn("Error in /workshops/comments/change/:", error);
    if (error instanceof Error)
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Internal Server Error" });
  }
});

export default router;
