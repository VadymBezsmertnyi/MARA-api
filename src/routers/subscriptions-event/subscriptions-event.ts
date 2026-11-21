import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { verifyToken } from "../../hooks/token";
import { SubscriptionEventModel } from "./subscriptions-event.model";

// magic numbers
const ERROR_SERVER_FIVE_HUNDRED = 500;

dotenv.config();
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send({ message: "Unauthorized" });

  const dataToken = verifyToken(token);
  if (!dataToken) return res.status(401).send({ message: "Unauthorized" });

  try {
    const subscriptions = await SubscriptionEventModel.find({
      userId: dataToken.userId,
    });
    return res.status(200).send(subscriptions);
  } catch (error) {
    return res
      .status(ERROR_SERVER_FIVE_HUNDRED)
      .send({ message: "Server error" });
  }
});

export default router;
