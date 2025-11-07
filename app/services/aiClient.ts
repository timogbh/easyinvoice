import { usePlanStore } from "@/state/planStore";
import { useUserStore } from "@/state/userStore";

export interface AIRequestInput {
  language: "de" | "en";
  type: "invoice" | "offer" | "reminder" | "email";
  details: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function getEndpointPath(): string {
  const base = API_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("API_BASE_URL_MISSING");
  }
  return `${base}/ai/generateInvoiceText`;
}

export async function requestInvoiceText(input: AIRequestInput): Promise<string> {
  const premium = useUserStore.getState().profile?.premium ?? false;
  const canUse = usePlanStore.getState().canUseAI(premium);

  if (!canUse) {
    throw new Error("AI_LIMIT_REACHED");
  }

  const endpoint = getEndpointPath();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error("AI_UNAVAILABLE");
    }

    if (response.status === 429) {
      throw new Error("AI_RATE_LIMITED");
    }

    throw new Error("AI_ERROR");
  }

  const data = (await response.json()) as { text?: string };

  if (!data.text) {
    throw new Error("AI_EMPTY_RESPONSE");
  }

  await usePlanStore.getState().incAI();
  return data.text;
}
