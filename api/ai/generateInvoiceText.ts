import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SUPPORTED_LANGUAGES = new Set(["de", "en"]);
const SUPPORTED_TYPES = new Set(["invoice", "offer", "reminder", "email"]);

interface GenerateInvoiceTextBody {
  language?: string;
  type?: string;
  details?: string;
}

function parseBody(req: VercelRequest): GenerateInvoiceTextBody {
  if (req.body && typeof req.body === "object") {
    return req.body as GenerateInvoiceTextBody;
  }

  if (typeof req.body === "string" && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body) as GenerateInvoiceTextBody;
    } catch {
      return {};
    }
  }

  return {};
}

function buildSystemPrompt(language: string, type: string): string {
  const base = language === "en"
    ? "You support an invoicing app. Reply with very short, professional output (max 2 sentences). No legal advice, no personal data."
    : "Du unterstützt eine Rechnungs-App. Antworte sehr kurz und professionell (maximal 2 Sätze). Keine Rechtsberatung, keine personenbezogenen Daten.";

  const typeHint = (() => {
    switch (type) {
      case "offer":
        return language === "en"
          ? "Write a concise, polished offer description."
          : "Formuliere eine kurze, hochwertige Angebotsbeschreibung.";
      case "reminder":
        return language === "en"
          ? "Write a friendly yet firm payment reminder."
          : "Formuliere eine freundliche, aber bestimmte Zahlungserinnerung.";
      case "email":
        return language === "en"
          ? "Write a short professional business email."
          : "Formuliere eine kurze professionelle Geschäfts-E-Mail.";
      case "invoice":
      default:
        return language === "en"
          ? "Write a concise service description for an invoice."
          : "Formuliere eine kurze Leistungsbeschreibung für eine Rechnung.";
    }
  })();

  return `${base} ${typeHint}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "AI_ERROR" });
    return;
  }

  const body = parseBody(req);
  const language = SUPPORTED_LANGUAGES.has(body.language ?? "") ? body.language! : "de";
  const type = SUPPORTED_TYPES.has(body.type ?? "") ? body.type! : "invoice";
  const details = (body.details ?? "").toString().trim();

  if (!details) {
    res.status(400).json({ error: "DETAILS_REQUIRED" });
    return;
  }

  if (details.length > 600) {
    res.status(400).json({ error: "DETAILS_TOO_LONG" });
    return;
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(language, type) },
        {
          role: "user",
          content: language === "en"
            ? `Context: ${details}`
            : `Kontext: ${details}`,
        },
      ],
      max_tokens: 160,
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content?.trim();

    if (!text) {
      res.status(500).json({ error: "AI_ERROR" });
      return;
    }

    res.status(200).json({ text });
  } catch (error) {
    console.error("[AI] Request failed", error);
    res.status(500).json({ error: "AI_ERROR" });
  }
}