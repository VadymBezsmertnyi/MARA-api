import OpenAI from "openai";
import z from "zod";

import { EventType } from "../../routers/events/events.types";
import EventModel from "../../routers/events/events.model";
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

const getEventVerificationFromAI = async (
  event: EventType,
  language: LanguagesType
) => {
  const prompt = `Проаналізуй подію та визнач, чи відповідає вона правилам контенту.

Інформація про подію:
- Назва: ${event.title}
- Опис: ${event.description}
- Дата: ${event.date?.start || "невідомо"} - ${event.date?.finish || "невідомо"}
- Ціна: ${event.price ? `${event.price.start} - ${event.price.finish} ${event.currency}` : "безкоштовно / не вказано"}
- Зображення: ${event.imageFiles?.length ? event.imageFiles.map((img) => img.url).join(", ") : "немає зображень"}
- Розклад: ${event.timeline?.length ? event.timeline.map((item, index) => `Пункт ${index + 1}: ${item.title}, опис: ${item.description || "немає опису"}, початок: ${item.start}, кінець: ${item.finish || "не вказано"}`).join("; ") : "немає розкладу"}

Правила контенту (порушення яких призводить до відхилення):
1. Заборонено образливий, ненависницький, дискримінаційний або насильницький контент
2. Заборонено контент для дорослих або порнографічний контент
3. Заборонено контент, що порушує авторські права або інші права інтелектуальної власності
4. Заборонено неправдиву або оманливу інформацію
5. Заборонено спам або надмірну рекламу
6. Заборонено особисту інформацію без згоди відповідної особи
7. Заборонено контент, що пропагує незаконну діяльність або порушує закони
8. Заборонено контент, що містить шкідливе програмне забезпечення або віруси
9. Заборонено контент, що не має відношення до теми події або є поза контекстом
10. Заборонено контент, що має набір букв без сенсу або є випадковим набором символів
11. Заборонено контент, що містить мову ворожнечі або заклики до насильства

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
Ти експерт з модерації контенту для подій.
Твоя задача - проаналізувати контент події та визначити, чи відповідає він правилам.
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
        name: "EventVerification",
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

export const verifyAndUpdateEventContent = async (event: EventType) => {
  try {
    const language: LanguagesType = await PostUserSM.findById(
      event.ownerUserId || event.userId
    )
      .then((user) => user?.languageLocal || "en")
      .catch(() => "en");
    const verification = await getEventVerificationFromAI(event, language);
    if (!verification)
      await EventModel.findByIdAndUpdate(event._id, {
        verification: {
          status: "rejected",
          date: Date.now(),
          reason:
            language === "uk"
              ? "Не вдалося перевірити контент події."
              : "Failed to verify event content.",
        },
      });
    else
      await EventModel.findByIdAndUpdate(event._id, {
        verification: {
          ...verification,
          date: Date.now(),
        },
      });
  } catch (error) {
    console.warn("Error in verifyAndUpdateEventContent:", error);
    await EventModel.findByIdAndUpdate(event._id, {
      verification: {
        status: "rejected",
        date: Date.now(),
        reason: "Error during event content verification process.",
      },
    });
  }
};
