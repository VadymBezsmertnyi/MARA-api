import { Router, Request, Response } from "express";
import dotenv from "dotenv";

// hooks
import { CURRENCIES } from "../../../hooks/currencies/currencies";

dotenv.config();
const router = Router();
const ERROR_SERVER_FIVE_HUNDRED = 500;

router.get("/", async (req: Request, res: Response) => {
  try {
    const currencies = CURRENCIES;

    if (currencies) {
      res.status(200).send(currencies);
      return;
    }

    res.status(404).send("Not found");
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Error getting currencies:", error.message);
    } else {
      console.warn("Error getting currencies:", error);
    }
    res.status(ERROR_SERVER_FIVE_HUNDRED).send("Internal Server Error");
  }
});

export default router;
