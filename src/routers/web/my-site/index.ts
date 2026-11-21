import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { sendPushEmails } from "../../../hooks/pushEmail/pushEmail";

dotenv.config();
const router = Router();

router.post("/feedback", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body;
    const resultSend = await sendPushEmails(email, name, phone, message);
    if (resultSend) return res.send(true);

    return res.send(false);
  } catch (error) {
    console.warn("Error sending feedback", error);
    return res.status(400).json({ message: "Error sending feedback" });
  }
});

export default router;
