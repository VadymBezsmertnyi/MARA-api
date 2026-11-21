import OpenAI from "openai";
import z from "zod";

const MARA_OPENAI_API_KEY = process.env.MARA_OPENAI_API_KEY || "";
const MARA_OPENAI_ORG_ID = process.env.MARA_OPENAI_ORG_ID || "";
const MARA_OPENAI_PROJECT_ID = process.env.MARA_OPENAI_PROJECT_ID || "";

const openai = new OpenAI({
  apiKey: MARA_OPENAI_API_KEY,
  organization: MARA_OPENAI_ORG_ID,
  project: MARA_OPENAI_PROJECT_ID,
});

export const AI_ERROR_REASONS = new Set([
  "Failed to verify comment content.",
  "Error during comment verification process.",
]);

const moderationSchema = z.object({
  moderation: z.object({
    ok: z.boolean(),
    reason: z.string().nullable(),
  }),
});

type VerifyCommentInput = {
  text: string;
  context: "event" | "workshop";
  title?: string;
};

export const verifyCommentWithAI = async (input: VerifyCommentInput) => {
  try {
    const prompt = `Проаналізуй коментар користувача та визнач, чи він відповідає правилам контенту.

Контекст: ${input.context === "event" ? "подія" : "майстерня"}
Назва: ${input.title || "не вказано"}
Коментар: ${input.text}

Правила контенту (порушення яких призводить до відхилення):
1. Заборонено образливий, ненависницький, дискримінаційний або насильницький контент
2. Заборонено контент для дорослих або порнографічний контент
3. Заборонено контент, що порушує авторські права або інші права інтелектуальної власності
4. Заборонено неправдиву або оманливу інформацію
5. Заборонено спам або надмірну рекламу
6. Заборонено особисту інформацію без згоди відповідної особи
7. Заборонено контент, що пропагує незаконну діяльність або порушує закони
8. Заборонено контент, що містить шкідливе програмне забезпечення або віруси
9. Заборонено контент, що не має відношення до контексту події або майстерні
10. Заборонено контент, що має набір букв без сенсу або є випадковим набором символів

Вимоги до відповіді:
- Якщо контент відповідає всім правилам: ok = true, reason = null
- Якщо контент порушує правила: ok = false та наведи конкретну причину в reason
- ПОВЕРТАЙ ТІЛЬКИ валідний JSON відповідно до заданої схеми, без пояснень.`;

    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
Ти експерт з модерації коментарів.
Твоя задача - проаналізувати коментар та визначити, чи відповідає він правилам.
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
          name: "CommentModeration",
          type: "json_schema",
          strict: true,
          schema: {
            type: "object",
            properties: {
              moderation: {
                type: "object",
                properties: {
                  ok: { type: "boolean" },
                  reason: { type: ["string", "null"] },
                },
                required: ["ok", "reason"],
                additionalProperties: false,
              },
            },
            required: ["moderation"],
            additionalProperties: false,
          },
        },
      },
    });

    const moderationResult = response.output_text?.trim();
    if (!moderationResult)
      return {
        ok: false,
        reason: "Failed to verify comment content.",
      };

    const raw = moderationResult.trim();
    const jsonString = raw.startsWith("{")
      ? raw
      : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsedModerationResult = JSON.parse(jsonString);
    const currentResults = moderationSchema.parse(parsedModerationResult);
    const { ok, reason } = currentResults.moderation;

    return {
      ok,
      reason: ok ? undefined : reason || undefined,
    };
  } catch (error) {
    console.warn("Error in verifyCommentWithAI:", error);
    return { ok: false, reason: "Error during comment verification process." };
  }
};
