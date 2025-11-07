import type { PaymentTerm, TaxScheme, CountryCode, ToneType, Language, AITextType } from "@/types";

export async function suggestItemTitle(ctx?: { industry?: string; keywords?: string }): Promise<string> {
  console.log("[AI] Suggesting item title", ctx);
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const suggestions = [
    "Beratungsleistung",
    "Projektmanagement",
    "Design & Entwicklung",
    "Technische Unterstützung",
    "Wartung & Support",
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

export async function suggestItemDesc(ctx?: { title?: string }): Promise<string> {
  console.log("[AI] Suggesting item description", ctx);
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return "Professionelle Dienstleistung nach Vereinbarung, inklusive Vor- und Nachbereitung.";
}

export async function suggestInvoiceNote(ctx: { country?: CountryCode; scheme?: TaxScheme }): Promise<string> {
  console.log("[AI] Suggesting invoice note", ctx);
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  if (ctx.scheme === "REVERSE_CHARGE") {
    return "Zahlbar innerhalb von 14 Tagen nach Rechnungserhalt. Bei Fragen stehen wir gerne zur Verfügung.";
  }
  
  return "Vielen Dank für Ihr Vertrauen. Zahlbar innerhalb von 14 Tagen netto.";
}

export async function suggestEmailCover(ctx: {
  docType: "INVOICE" | "QUOTE";
  clientName: string;
  amount: number;
  currency: string;
  dueISO?: string;
}): Promise<string> {
  console.log("[AI] Suggesting email cover", ctx);
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  if (ctx.docType === "INVOICE") {
    return `Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung über ${ctx.amount.toFixed(2)} ${ctx.currency}.

Zahlungsziel: ${ctx.dueISO || "14 Tage"}

Mit freundlichen Grüßen`;
  }
  
  return `Sehr geehrte Damen und Herren,

gerne unterbreiten wir Ihnen unser Angebot über ${ctx.amount.toFixed(2)} ${ctx.currency}.

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.

Mit freundlichen Grüßen`;
}

export async function suggestPaymentTerms(ctx?: { country?: CountryCode }): Promise<PaymentTerm> {
  console.log("[AI] Suggesting payment terms", ctx);
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    days: 14,
    note: "Zahlbar ohne Abzug",
  };
}

export async function generateItemTitle(ctx?: {
  industry?: string;
  keywords?: string;
  language?: Language;
  tone?: ToneType;
}): Promise<string> {
  console.log("[AI] Generating item title", ctx);
  
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const suggestionsDE = [
    "Beratungsleistung",
    "Projektmanagement",
    "Design & Entwicklung",
    "Technische Unterstützung",
    "Wartung & Support",
    "Schulung & Training",
    "Analyse & Konzeption",
  ];
  
  const suggestionsEN = [
    "Consulting Services",
    "Project Management",
    "Design & Development",
    "Technical Support",
    "Maintenance & Support",
    "Training & Education",
    "Analysis & Conceptualization",
  ];
  
  const suggestions = ctx?.language === "en" ? suggestionsEN : suggestionsDE;
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

export async function generateItemDescription(ctx?: {
  title?: string;
  language?: Language;
  tone?: ToneType;
}): Promise<string> {
  console.log("[AI] Generating item description", ctx);
  
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  if (ctx?.language === "en") {
    if (ctx.tone === "formal") {
      return "Professional service as agreed upon, including preparation and follow-up activities.";
    } else if (ctx.tone === "casual") {
      return "Great service as we discussed, including prep and follow-up work.";
    }
    return "Professional service according to agreement, including preparation and follow-up.";
  }
  
  if (ctx?.tone === "formal") {
    return "Professionelle Dienstleistung gemäß Vereinbarung, inklusive Vor- und Nachbereitung der Tätigkeiten.";
  } else if (ctx?.tone === "casual") {
    return "Tolle Dienstleistung wie besprochen, inklusive Vorbereitung und Nachbearbeitung.";
  }
  return "Professionelle Dienstleistung nach Vereinbarung, inklusive Vor- und Nachbereitung.";
}

export async function generateText(params: {
  type: AITextType;
  language: Language;
  tone: ToneType;
  inputText?: string;
  context?: Record<string, unknown>;
}): Promise<string> {
  console.log("[AI] Generating text", params);
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  const { type, language, tone, inputText } = params;
  
  if (type === "item_title") {
    return generateItemTitle({ language, tone });
  }
  
  if (type === "item_description") {
    return generateItemDescription({ language, tone, title: inputText });
  }
  
  if (type === "invoice_note") {
    if (language === "en") {
      if (tone === "formal") {
        return "We kindly request payment within the specified period. Should you have any questions, please do not hesitate to contact us.";
      } else if (tone === "casual") {
        return "Thanks for your business! Please pay within the specified timeframe. Let us know if you have any questions.";
      }
      return "Thank you for your trust. Payment is due within the specified period.";
    }
    
    if (tone === "formal") {
      return "Wir bitten um Zahlung innerhalb der angegebenen Frist. Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.";
    } else if (tone === "casual") {
      return "Danke für deinen Auftrag! Bitte zahle innerhalb der angegebenen Frist. Melde dich bei Fragen!";
    }
    return "Vielen Dank für Ihr Vertrauen. Zahlbar innerhalb der angegebenen Frist.";
  }
  
  if (type === "payment_terms") {
    if (language === "en") {
      return "Payment due within 14 days net, no deductions.";
    }
    return "Zahlbar innerhalb von 14 Tagen netto, ohne Abzug.";
  }
  
  if (type === "email_cover") {
    if (language === "en") {
      if (tone === "formal") {
        return `Dear Sir or Madam,\n\nPlease find attached the requested document.\n\nShould you have any questions, please do not hesitate to contact us.\n\nKind regards`;
      } else if (tone === "casual") {
        return `Hi there,\n\nHere's the document you requested.\n\nLet me know if you have any questions!\n\nCheers`;
      }
      return `Dear Sir or Madam,\n\nAttached you will find the document as requested.\n\nIf you have any questions, please feel free to contact us.\n\nBest regards`;
    }
    
    if (tone === "formal") {
      return `Sehr geehrte Damen und Herren,\n\nanbei übersenden wir Ihnen das gewünschte Dokument.\n\nBei Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen`;
    } else if (tone === "casual") {
      return `Hallo,\n\nhier ist das gewünschte Dokument.\n\nMelde dich bei Fragen!\n\nLiebe Grüße`;
    }
    return `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie das gewünschte Dokument.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen`;
  }
  
  return "AI-generated text will appear here.";
}
