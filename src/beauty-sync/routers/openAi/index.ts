import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";

// hooks
import { getTextFromFileWithOpenAi } from "../../hooks/openAi";

dotenv.config();
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ERROR_SERVER_FIVE_HUNDRED = 500;

router.post(
  "/speech-to-text",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const response = await getTextFromFileWithOpenAi(req.file);
      return res.json({ text: response });
    } catch (error) {
      console.error("Error in /speech-to-text:", error);
      return res
        .status(ERROR_SERVER_FIVE_HUNDRED)
        .json({ error: "Internal server error" });
    }
  }
);

export default router;
