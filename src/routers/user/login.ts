import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import qs from "qs";
import multer from "multer";

import i18n from "../../i18n.config";

// models
import PostUserSM from "./user.modal";

// types
import { UserPostT, TokenVerifyType, RequestBodyType } from "./user.types";

// schemas
import { facebookBDSchema, userPostSZ } from "./user.schemas";

// constants
import { DEFAULT_USER_INFO, FALSE_RESULT_USER } from "./user.const";

// helpers
import { setTokens, verifyToken } from "../../hooks/token";
import { addFile, deleteFile } from "../../hooks/s3-storage/s3-storage";
import { checkCityDB } from "../places/places.hooks";
import { addSubscriptionUser } from "../../hooks/pushNotification/pushNotification";

// models
import EventModel from "../events/events.model";
import WorkshopModel from "../workshops/workshops.model";
import mongoose from "mongoose";
import { populateUser } from "./user.populates";
import { FileDataType } from "../../hooks/s3-storage/s3-storage.types";

// magic numbers
const ERROR_SERVER_FIVE_HUNDRED = 500;
const URL_FACEBOOK = "https://graph.facebook.com/v13.0/me";
const FACEBOOK_FIELDS = [
  "_id",
  "first_name",
  "last_name",
  "middle_name",
  "name",
  "email",
];

dotenv.config();
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const { SECRET_KEY_TOKEN, CLIENT_ID_GOOGLE } = process.env;

router.post("/facebook", async (req: Request, res: Response) => {
  const { accessToken } = req.body as Record<string, string>;
  try {
    const queryParams = qs.stringify(
      {
        access_token: accessToken,
        fields: FACEBOOK_FIELDS,
      },
      {
        arrayFormat: "comma",
        addQueryPrefix: true,
      }
    );
    const payload = await axios.get(`${URL_FACEBOOK}${queryParams}`);
    const currentFacebook = facebookBDSchema.safeParse(payload.data);
    if (!SECRET_KEY_TOKEN) {
      res.status(204).statusMessage = i18n.__(
        "Error: secret key token incorrect"
      );
      return res.send();
    }

    if (currentFacebook.success) {
      const { email } = currentFacebook.data;
      const userDate = await PostUserSM.findOne({
        $or: [
          { email },
          { "googleDate.email": email },
          { "facebookDate.email": email },
        ],
      });
      if (userDate) {
        const currentUserDate = userPostSZ.safeParse(userDate);
        const tokens = setTokens(userDate._id.toString());
        const newDataUser = {
          ...DEFAULT_USER_INFO,
          ...(currentUserDate.success && currentUserDate.data),
          email,
          facebookDate: currentFacebook.data,
          isDeleteUser: false,
        };
        await PostUserSM.findOneAndUpdate(
          { _id: newDataUser._id }, // Умова пошуку
          { $set: newDataUser }, // Оновлені поля
          { new: true } // Опція new: true повертає оновлений запис
        );
        return res.send({ userData: newDataUser, tokens });
      }

      const _id = new mongoose.Types.ObjectId();
      const tokens = setTokens(_id.toString());
      const newDataUser = {
        _id,
        ...DEFAULT_USER_INFO,
        facebookDate: currentFacebook.data,
        email: email || null,
      };
      const post = await new PostUserSM({
        ...newDataUser,
        isNewUser: true,
        isDeleteUser: false,
      }).save();
      const result = (await post.populate(
        populateUser
      )) as unknown as UserPostT;
      return res.send({
        userData: result,
        tokens,
      });
    } else {
      res.status(204).statusMessage = i18n.__("Error: token google incorrect");
      return res.send();
    }
  } catch (error) {
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

router.post("/google", async (req: Request, res: Response) => {
  const { idToken } = req.body as Record<string, string>;

  const client = new OAuth2Client(CLIENT_ID_GOOGLE);
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID_GOOGLE,
    });
    const payload = ticket.getPayload();
    if (!SECRET_KEY_TOKEN) {
      res.status(204).statusMessage = i18n.__(
        "Error: secret key token incorrect"
      );
      return res.send();
    }
    if (!payload) {
      res.status(204).statusMessage = i18n.__("Error: token google incorrect");
      return res.send();
    }

    const { email } = payload;
    const userDate = await PostUserSM.findOne({
      $or: [
        { email },
        { "googleDate.email": email },
        { "facebookDate.email": email },
      ],
    });
    if (userDate) {
      const tokens = setTokens(userDate._id.toString());
      const newDataUser = await PostUserSM.findOneAndUpdate(
        { _id: userDate._id }, // Умова пошуку
        {
          $set: {
            email,
            googleDate: payload,
            isDeleteUser: false,
          },
        }, // Оновлені поля
        { new: true } // Опція new: true повертає оновлений запис
      )
        .lean()
        .populate(populateUser);
      if (!newDataUser)
        return res.status(404).send({ message: "User not found" });

      const newDataUserWithPrices = userPostSZ.safeParse(newDataUser);
      if (!newDataUserWithPrices.success) {
        console.warn("Zod error:", newDataUserWithPrices.error);
        return res.status(404).send({ message: "Zod error: google sing" });
      }
      return res.send({
        userData: newDataUserWithPrices.data,
        tokens,
      });
    }

    const _id = new mongoose.Types.ObjectId();
    const tokens = setTokens(_id.toString());
    const newDataUser = {
      ...DEFAULT_USER_INFO,
      _id,
      googleDate: payload,
      email: email || null,
    };
    const post = await new PostUserSM({
      ...newDataUser,
      isNewUser: true,
      isDeleteUser: false,
    }).save();
    const result = (await post.populate(populateUser)) as unknown as UserPostT;
    return res.send({
      userData: result,
      tokens,
    });
  } catch (error) {
    console.warn("Google sign-in error:", error);
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

router.post("/apple", async (req: Request, res: Response) => {
  try {
    const { identityToken } = req.body as Record<string, string>;
    const decoded = jwt.decode(identityToken, {
      complete: true,
    }) as unknown as {
      payload: { email?: string };
    };
    if (!decoded || !decoded.payload.email) {
      res.status(204);
      res.statusMessage = i18n.__("Error: token apple incorrect");
      return res.send();
    }
    if (!SECRET_KEY_TOKEN) {
      res.status(204).statusMessage = i18n.__(
        "Error: secret key token incorrect"
      );
      return res.send();
    }

    const email = decoded.payload.email;
    const userDate = await PostUserSM.findOne({
      $or: [
        { email },
        { "googleDate.email": email },
        { "facebookDate.email": email },
      ],
    });
    if (userDate) {
      const currentUserDate = userPostSZ.safeParse(userDate);
      const tokens = setTokens(userDate._id.toString());
      const newDataUser = {
        ...DEFAULT_USER_INFO,
        ...(currentUserDate.success && currentUserDate.data),
        email,
        appleDate: decoded.payload,
        isDeleteUser: false,
      };
      await PostUserSM.findOneAndUpdate(
        { _id: newDataUser._id }, // Умова пошуку
        { $set: newDataUser }, // Оновлені поля
        { new: true } // Опція new: true повертає оновлений запис
      );
      const result = await userDate.populate(populateUser);
      return res.send({
        userData: result,
        tokens,
      });
    }
    const _id = new mongoose.Types.ObjectId();
    const tokens = setTokens(_id.toString());
    const newDataUser = {
      ...DEFAULT_USER_INFO,
      appleDate: decoded.payload,
      email: email || null,
    };
    await new PostUserSM({
      ...newDataUser,
      _id,
      isNewUser: true,
      isDeleteUser: false,
    }).save();
    const result = await PostUserSM.findOne({ _id })
      .lean()
      .populate(populateUser);
    return res.send({
      userData: result,
      tokens,
    });
  } catch (error) {
    console.warn("Apple sign-in error:", error);
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const dataToken = verifyToken(token);
    if (!dataToken) return res.status(401).json({ message: "Invalid token" });

    const userData = await PostUserSM.findOne({
      _id: dataToken.userId,
    })
      .lean()
      .populate(populateUser);
    if (userData) {
      const isTimeOver = dataToken.exp < Date.now() / 1000;
      if (!isTimeOver) {
        const currentUserDate = userPostSZ.safeParse(userData);
        if (!currentUserDate.success) return res.status(404).send();

        return res.send({ userData: currentUserDate.data });
      } else {
        res.statusMessage = i18n.__("Error: token time is over");
        return res.status(401).send();
      }
    } else return res.status(204).send();
  } catch (error) {
    console.warn("Get me error:", error);
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

router.get("/token", async (req: Request, res: Response) => {
  try {
    const {
      headers: { authorization },
    } = req;
    if (!SECRET_KEY_TOKEN) return res.status(204).send();
    if (authorization) {
      const token = Array.isArray(authorization)
        ? authorization[0].toString()
        : authorization.toString();
      const { userId } = jwt.verify(token, SECRET_KEY_TOKEN) as TokenVerifyType;
      const userData = await PostUserSM.findOne({ _id: userId });
      if (!userData) return res.status(404).send();

      const currentUserDate = userPostSZ.safeParse(userData);
      if (currentUserDate.success) {
        const tokens = setTokens(currentUserDate.data._id.toString());
        return res.send({
          userData: currentUserDate.data,
          tokens,
        });
      } else return res.status(204).send();
    } else return res.status(204).send();
  } catch (error) {
    console.warn("Get token error:", error);
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

router.put(
  "/editUser",
  upload.single("avatarFile"),
  async (req: Request, res: Response) => {
    try {
      const { deviceId, platform } = req.query as RequestBodyType;
      const body = req.body as Record<string, string | null>;
      let cityUser: { placeId: string; title: string } | undefined;
      if (body.cityUser) {
        try {
          cityUser =
            typeof body.cityUser === "string"
              ? JSON.parse(body.cityUser)
              : (body.cityUser as { placeId: string; title: string });
        } catch {
          cityUser = undefined;
        }
      }
      const avatarUrl = body.avatarUrl;
      const deleteAvatarValue = body.avatarFile;
      const isDeleteAvatar =
        deleteAvatarValue === null ||
        deleteAvatarValue === "null" ||
        deleteAvatarValue === "";
      const { _id, ...regBodyRaw } = body;

      const regBody: Record<string, any> = {};
      for (const [key, value] of Object.entries(regBodyRaw)) {
        if (key !== "cityUser" && key !== "avatarUrl" && key !== "avatarFile") {
          if (
            typeof value === "string" &&
            (value.startsWith("{") || value.startsWith("["))
          )
            try {
              regBody[key] = JSON.parse(value);
            } catch {
              regBody[key] = value;
            }
          else regBody[key] = value;
        }
      }

      const oldUser = (await PostUserSM.findOne({ _id })) as UserPostT;
      const updatedFields = {
        ...DEFAULT_USER_INFO,
        ...regBody,
        isDeleteUser: false,
      } as UserPostT;

      let avatarFile: FileDataType | null = null;
      if (req.file) {
        if (oldUser?.avatarFile?.url) await deleteFile(oldUser.avatarFile.url);

        const result = await addFile(req.file, "avatars", "images");
        avatarFile = {
          _id: new mongoose.Types.ObjectId(),
          url: result.url,
        };
      } else if (isDeleteAvatar) {
        if (oldUser?.avatarFile?.url) await deleteFile(oldUser.avatarFile.url);
        avatarFile = null;
      } else if (avatarUrl) {
        try {
          const parsed = JSON.parse(avatarUrl) as { _id?: string; url: string };
          avatarFile = {
            _id: parsed._id || new mongoose.Types.ObjectId(),
            url: parsed.url,
          };
        } catch {
          avatarFile = {
            _id: new mongoose.Types.ObjectId(),
            url: avatarUrl,
          };
        }
      } else if (oldUser?.avatarFile?.url)
        avatarFile = {
          _id: oldUser.avatarFile._id || new mongoose.Types.ObjectId(),
          url: oldUser.avatarFile.url,
        };

      const placeGetUser = cityUser
        ? await checkCityDB(cityUser.placeId)
        : null;
      const placeUser = placeGetUser
        ? {
            place_id: placeGetUser.place._id,
            region_place_id: placeGetUser.region?._id || null,
            country_place_id: placeGetUser.country?._id || null,
          }
        : null;

      if (regBody.subscriptionId)
        await addSubscriptionUser(
          oldUser._id.toString(),
          deviceId,
          regBody.subscriptionId,
          updatedFields.languageLocal,
          platform
        );
      const updatedUser = await PostUserSM.findOneAndUpdate(
        { _id }, // Умова пошуку
        { $set: { ...updatedFields, avatarFile, ...placeUser } }, // Оновлені поля
        { new: true } // Опція new: true повертає оновлений запис
      )
        .lean()
        .populate(populateUser);
      if (!updatedUser) return res.send({ ...FALSE_RESULT_USER, code: 1006 });
      if (!SECRET_KEY_TOKEN)
        return res.send({ ...FALSE_RESULT_USER, code: 1007 });

      // token
      const tokens = setTokens(updatedUser._id.toString());
      const currentUserDate = userPostSZ.safeParse(updatedUser);
      if (!currentUserDate.success) return res.status(404).send();

      return res.send({
        userData: currentUserDate.data,
        tokens,
      });
    } catch (error) {
      console.warn("Edit user error:", error);
      return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
    }
  }
);

router.get("/user-stats", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const dataToken = verifyToken(token);
    if (!dataToken) return res.status(401).json({ message: "Invalid token" });

    const userId = dataToken.userId;
    const [workshops, events] = await Promise.all([
      WorkshopModel.find({
        $or: [{ userId }, { ownerUserId: userId }],
      }).lean(),
      EventModel.find({
        $or: [{ userId }, { ownerUserId: userId }],
      }).lean(),
    ]);
    const userRoles = {
      ownerWorkshopIds: workshops
        .filter((w) => w.ownerUserId?.toString() === userId)
        .map((w) => w._id),
      addedWorkshopIds: workshops
        .filter((w) => w.userId?.toString() === userId)
        .map((w) => w._id),
      ownerEventIds: events
        .filter((e) => e.ownerUserId?.toString() === userId)
        .map((e) => e._id),
      addedEventIds: events
        .filter((e) => e.userId?.toString() === userId)
        .map((e) => e._id),
    };
    const userActions = {
      workshops: {
        active: workshops.filter((w) => w.verification?.status === "verified")
          .length,
        onReview: workshops.filter((w) => w.verification?.status === "pending")
          .length,
        rejected: workshops.filter((w) => w.verification?.status === "rejected")
          .length,
      },
      events: {
        active: events.filter((e) => e.verification?.status === "verified")
          .length,
        onReview: events.filter((e) => e.verification?.status === "pending")
          .length,
      },
    };
    const allUserComments = [
      ...workshops.flatMap((w) => w.comments || []),
      ...events.flatMap((e) => e.comments || []),
    ].filter((comment) => comment.userId?.toString() === userId);
    const userComments = {
      totalComments: allUserComments.length,
      averageRating:
        allUserComments.length > 0
          ? Number(
              (
                allUserComments.reduce(
                  (sum, comment) => sum + (comment.rating || 0),
                  0
                ) / allUserComments.length
              ).toFixed(1)
            )
          : 0,
    };
    const totals = {
      totalWorkshops: workshops.length,
      totalEvents: events.length,
    };

    return res.json({
      userRoles,
      userActions,
      userComments,
      totals,
    });
  } catch (error) {
    console.warn("Get user stats error:", error);
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

router.post("/delete", async (req: Request, res: Response) => {
  try {
    const { _id } = req.body as Record<string, string>;
    const userDelete = await PostUserSM.findOne({ _id })
      .lean()
      .populate(populateUser);
    const currentUserDelete = userPostSZ.safeParse(userDelete);
    if (currentUserDelete.success && currentUserDelete.data.avatarFile?.url)
      await deleteFile(currentUserDelete.data.avatarFile.url);

    if (currentUserDelete.success) {
      await EventModel.deleteMany({ _id: currentUserDelete.data.eventsIds });
      await WorkshopModel.deleteMany({
        _id: currentUserDelete.data.workshopsIds,
      });
      const newUserInfo: UserPostT = {
        ...DEFAULT_USER_INFO,
        ...currentUserDelete.data,
        googleDate: null,
        facebookDate: null,
        isDeleteUser: true,
        isNewUser: true,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        avatarFile: null,
        isGeoLocation: false,
      };

      await PostUserSM.findOneAndUpdate(
        { _id }, // Умова пошуку
        { $set: { ...newUserInfo } }, // Оновлені поля
        { new: true } // Опція new: true повертає оновлений запис
      );

      return res.send({
        result: true,
        code: 1000,
      });
    }
    return res.send({
      ...FALSE_RESULT_USER,
      errors: currentUserDelete.error,
      code: 1005,
    });
  } catch (error) {
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

export default router;
