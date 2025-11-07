import type { IncomingMessage, ServerResponse } from "http";
import OpenAI from "openai";

type SupportedLanguage = "de" | "en";
type SupportedType = "invoice" | "offer" | "reminder" | "email";

export interface GenerateInvoiceTextInput {
  language: SupportedLanguage;
  type: SupportedType;
  details: string;
}

const MAX_DETAIL_LENGTH = 400;

const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT_DE =
  "Du bist ein Assistent fuer eine Rechnungs-App. Du schreibst sehr kurze, professionelle, rechtlich saubere Texte auf Deutsch, maximal 2 Saetze, kein Smalltalk.";

const SYSTEM_PROMPT_EN =
  "You are an assistant for an invoicing app. You write very short, professional and clear business texts in English, max 2 sentences, no smalltalk.";

function resolveSystemPrompt(language: SupportedLanguage): string {
  return language === "de" ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;
}

function resolveTypeHint(type: SupportedType): string {
  switch (type) {
    case "invoice":
      return "Formuliere eine kurze Leistungsbeschreibung fuer eine Rechnung.";
    case "offer":
      return "Formuliere eine kurze Beschreibung fuer ein Angebot.";
    case "reminder":
      return "Formuliere eine freundliche aber bestimmte Zahlungserinnerung.";
    case "email":
    default:
      return "Formuliere eine kurze, professionelle Nachricht.";
  }
}

export async function generateInvoiceText(input: GenerateInvoiceTextInput) {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error("OPENAI_API_KEY missing"), { statusCode: 503 });
  }

  if (!input.details?.trim()) {
    throw Object.assign(new Error("Details required"), { statusCode: 400 });
  }

  if (input.details.length > MAX_DETAIL_LENGTH) {
    throw Object.assign(new Error("Details too long"), { statusCode: 400 });
  }

  const systemPrompt = resolveSystemPrompt(input.language);
  const typeHint = resolveTypeHint(input.type);
  const userContent = `${typeHint} Kontext: ${input.details}`.slice(0, 600);

  const completion = await openAIClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    max_tokens: 120,
    temperature: 0.4,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  return { text };
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  let rawBody = "";
  req
    .on("data", (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1000) {
        req.destroy();
      }
    })
    .on("end", async () => {
      try {
        const parsed = JSON.parse(rawBody || "{}") as Partial<GenerateInvoiceTextInput>;
        const input: GenerateInvoiceTextInput = {
          language: (parsed.language || "de") as SupportedLanguage,
          type: (parsed.type || "invoice") as SupportedType,
          details: (parsed.details || "").slice(0, MAX_DETAIL_LENGTH),
        };

        const result = await generateInvoiceText(input);
        sendJson(res, 200, result);
      } catch (error: any) {
        const status = error?.statusCode ?? (error?.message === "OPENAI_API_KEY missing" ? 503 : 500);
        sendJson(res, status, { error: error?.message ?? "AI_UNAVAILABLE" });
      }
    })
    .on("error", () => {
      sendJson(res, 500, { error: "AI_UNAVAILABLE" });
    });
}

export default handler;
