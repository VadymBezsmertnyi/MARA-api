import { Router, Request, Response } from "express";
import dotenv from "dotenv";

// models
import { UserLocationMapModel } from "./locationUsers.model";

// hooks
import mongoose from "mongoose";

// magic numbers
const ERROR_SERVER_FIVE_HUNDRED = 500;
const TWO_HOURS = 1000 * 60 * 60 * 2;

dotenv.config();
const router = Router();

export const deleteOtherUsersLocation = async () => {
  const usersLocation = await UserLocationMapModel.find().lean();
  const dateNow = new Date().getTime();
  const deleteUsersLocation = usersLocation
    .filter((userLocation) => userLocation.date + TWO_HOURS < dateNow)
    .map((userLocation) => userLocation._id);
  await UserLocationMapModel.deleteMany({ _id: deleteUsersLocation });
};

router.post("/", async (req: Request, res: Response) => {
  try {
    const userLocation = await UserLocationMapModel.findOne({
      userId: req.body.userId,
    });

    if (userLocation)
      await UserLocationMapModel.findOneAndUpdate(
        { _id: userLocation._id },
        { $set: { ...req.body } },
        { new: true }
      );
    else {
      const _id = new mongoose.Types.ObjectId();
      await new UserLocationMapModel({
        _id,
        ...req.body,
      }).save();
    }

    const usersLocation = await UserLocationMapModel.find();
    return res.send({ result: true, usersLocation, code: 1000 });
  } catch (error: unknown) {
    console.warn("Error in /location-users/:", error);
    return res.status(ERROR_SERVER_FIVE_HUNDRED).send(error);
  }
});

export default router;
