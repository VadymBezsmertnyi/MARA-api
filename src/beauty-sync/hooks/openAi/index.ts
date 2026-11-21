import OpenAI from "openai";
import { File } from "node:buffer";

const BEAUTY_SYNC_OPENAI_API_KEY = process.env.BEAUTY_SYNC_OPENAI_API_KEY || "";
const BEAUTY_SYNC_OPENAI_ORG_ID = process.env.BEAUTY_SYNC_OPENAI_ORG_ID || "";
const BEAUTY_SYNC_OPENAI_PROJECT_ID =
  process.env.BEAUTY_SYNC_OPENAI_PROJECT_ID || "";

const openai = new OpenAI({
  apiKey: BEAUTY_SYNC_OPENAI_API_KEY,
  organization: BEAUTY_SYNC_OPENAI_ORG_ID,
  project: BEAUTY_SYNC_OPENAI_PROJECT_ID,
});

export const getTextFromFileWithOpenAi = async (file: Express.Multer.File) => {
  try {
    if (!file) throw new Error("No file provided");
    if (file.size === 0) throw new Error("File is empty");
    if (file.mimetype !== "audio/mpeg" && file.mimetype !== "audio/wav")
      if (!BEAUTY_SYNC_OPENAI_API_KEY || BEAUTY_SYNC_OPENAI_API_KEY === "")
        throw new Error("Invalid or missing OpenAI API key");

    const uint8 = new Uint8Array(file.buffer);
    const openAiFile = new File([uint8], file.originalname, {
      type: file.mimetype === "audio/vnd.wave" ? "audio/wav" : file.mimetype,
    });

    const response = await openai.audio.transcriptions.create({
      file: openAiFile,
      model: "gpt-4o-transcribe",
      response_format: "text",
    });
    return response;
  } catch (error) {
    console.error("Error processing file with OpenAI:", error);
    throw error;
  }
};
