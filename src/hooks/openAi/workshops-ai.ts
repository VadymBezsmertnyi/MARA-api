import OpenAI from "openai";
import { WorkshopType } from "../../routers/workshops/workshops.types";
import z from "zod";
import WorkshopModel from "../../routers/workshops/workshops.model";
import { LanguagesType } from "../../routers/user/user.types";
import PostUserSM from "../../routers/user/user.modal";

const MARA_OPENAI_API_KEY = process.env.MARA_OPENAI_API_KEY || "";
const MARA_OPENAI_ORG_ID = process.env.MARA_OPENAI_ORG_ID || "";
const MARA_OPENAI_PROJECT_ID = process.env.MARA_OPENAI_PROJECT_ID || "";

const openai = new OpenAI({
  apiKey: MARA_OPENAI_API_KEY,
  organization: MARA_OPENAI_ORG_ID,
  project: MARA_OPENAI_PROJECT_ID,
});

const getWorkshopVerificationFromAI = async (
  workshop: WorkshopType,
  language: LanguagesType
) => {
  const prompt = `Проаналізуй майстерню та визнач, чи відповідає вона правилам контенту.

Інформація про майстерню:
- Назва: ${workshop.title}
- Опис: ${workshop.description}
- Зображення: ${workshop.imageFiles?.length ? workshop.imageFiles.map((img) => img.url).join(", ") : "немає зображень"}

Правила контенту (порушення яких призводить до відхилення):
1. Заборонено образливий, ненависницький, дискримінаційний або насильницький контент
2. Заборонено контент для дорослих або порнографічний контент
3. Заборонено контент, що порушує авторські права або інші права інтелектуальної власності
4. Заборонено неправдиву або оманливу інформацію
5. Заборонено спам або надмірну рекламу
6. Заборонено особисту інформацію без згоди відповідної особи
7. Заборонено контент, що пропагує незаконну діяльність або порушує закони
8. Заборонено контент, що містить шкідливе програмне забезпечення або віруси
9. Заборонено контент, що не має відношення до теми майстерні або є поза контекстом
10. Заборонено контент, що має набір букв без сенсу або є випадковим набором символів

Вимоги до відповіді:
- Якщо контент відповідає всім правилам: встанови status = "verified", reason = null
- Якщо контент порушує правила: встанови status = "rejected" та наведи конкретну причину в reason
- Відповідай ${language === "uk" ? "українською" : language}`;

  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `
Ти експерт з модерації контенту для майстерень.
Твоя задача - проаналізувати контент майстерні та визначити, чи відповідає він правилам.
ПОВЕРТАЙ ТІЛЬКИ валідний JSON відповідно до заданої схеми.
НЕ додавай пояснень або тексту поза JSON.
`.trim(),
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ],
    text: {
      format: {
        name: "WorkshopVerification",
        type: "json_schema",
        strict: true,
        schema: {
          type: "object",
          properties: {
            verification: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["verified", "rejected"],
                },
                reason: {
                  type: ["string", "null"],
                },
              },
              required: ["status", "reason"],
              additionalProperties: false,
            },
          },
          required: ["verification"],
          additionalProperties: false,
        },
      },
    },
  });
  const moderationResult = response.output_text?.trim();
  if (!moderationResult) return null;

  const raw = moderationResult.trim();
  const jsonString = raw.startsWith("{")
    ? raw
    : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const parsedModerationResult = JSON.parse(jsonString);
  const currentResults = z
    .object({
      verification: z.object({
        status: z.enum(["verified", "rejected"]),
        reason: z.string().nullable(),
      }),
    })
    .parse(parsedModerationResult);

  return currentResults.verification;
};

export const verifyAndUpdateWorkshopContent = async (
  workshop: WorkshopType
) => {
  try {
    const language: LanguagesType = await PostUserSM.findById(
      workshop.ownerUserId || workshop.userId
    )
      .then((user) => user?.languageLocal || "en")
      .catch(() => "en");
    const verification = await getWorkshopVerificationFromAI(
      workshop,
      language
    );
    if (!verification)
      await WorkshopModel.findByIdAndUpdate(workshop._id, {
        verification: {
          status: "rejected",
          date: Date.now(),
          reason:
            language === "uk"
              ? "Не вдалося перевірити контент майстерні."
              : "Failed to verify workshop content.",
        },
      });
    else
      await WorkshopModel.findByIdAndUpdate(workshop._id, {
        verification: {
          ...verification,
          date: Date.now(),
        },
      });
  } catch (error) {
    console.warn("Error in verifyAndUpdateWorkshopContent:", error);
    await WorkshopModel.findByIdAndUpdate(workshop._id, {
      verification: {
        status: "rejected",
        date: Date.now(),
        reason: "Error during workshop content verification process.",
      },
    });
  }
};
