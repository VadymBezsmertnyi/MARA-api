import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { balanceTurboSMSUser } from "../../hooks/sms";

// magic numbers
const ERROR_SERVER_FIVE_HUNDRED = 500;

dotenv.config();
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await balanceTurboSMSUser();
    if (result.status === "OK") {
      res.status(200).send(result.data);
      return;
    }

    res.status(404).send(result.error);
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Error getting balance:", error.message);
    } else {
      console.warn("Error getting balance:", error);
    }
    res.status(ERROR_SERVER_FIVE_HUNDRED).send("Internal Server Error");
  }
});

export default router;
