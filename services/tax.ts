import type { CountryCode, TaxRegion, TaxContext, TaxScheme, TaxBadge, Language, TaxRules, Messages } from "@/types";
import { isLikelyValidVat } from "./vatValidation";
import taxRules from "@/config/tax/rules.json";
import messagesDe from "@/config/tax/messages.de.json";
import messagesEn from "@/config/tax/messages.en.json";

const rules = taxRules as TaxRules;
const messages: Record<Language, Messages> = {
  de: messagesDe as Messages,
  en: messagesEn as Messages,
};

type NoteDictionary = Record<Language, Record<CountryCode | "default", string>>;

const smallBusinessNotes: NoteDictionary = {
  de: {
    AT: "Keine Umsatzsteuer gemäß § 6 Abs. 1 Z 27 UStG (Kleinunternehmerregelung).",
    DE: "Keine Umsatzsteuer gemäß § 19 Abs. 1 UStG (Kleinunternehmerregelung).",
    CH: "Keine Mehrwertsteuer gemäß Art. 10 Abs. 2 lit. a MWSTG (Schweizer Kleinunternehmen).",
    EU: "Keine Umsatzsteuer gemäß nationaler Kleinunternehmerregelung des Sitzlandes.",
    default: "Keine Umsatzsteuer gemäß nationaler Kleinunternehmerregelung des Sitzlandes.",
  },
  en: {
    AT: "No VAT charged pursuant to Sec. 6 para. 1 item 27 Austrian VAT Act (small business exemption).",
    DE: "No VAT charged pursuant to Sec. 19 para. 1 German VAT Act (small business exemption).",
    CH: "No VAT charged pursuant to Art. 10 para. 2 lit. a Swiss VAT Act (small business exemption).",
    EU: "No VAT charged under the small-business exemption of the supplier's country.",
    default: "No VAT charged under the small-business exemption of the supplier's country.",
  },
};

const reverseChargeNotes: NoteDictionary = {
  de: {
    AT: "Reverse-Charge: Steuerschuldnerschaft des Leistungsempfängers gemäß Art. 196 MwStSystRL i.V.m. § 19 Abs. 1a UStG (Österreich).",
    DE: "Reverse-Charge gemäß § 13b Abs. 2 Nr. 1 UStG i.V.m. Art. 196 MwStSystRL – Steuer schuldet der Leistungsempfänger.",
    EU: "Reverse-Charge nach Art. 196 MwStSystRL: Die Steuer ist vom Leistungsempfänger im Bestimmungsland abzuführen.",
    default: "Reverse-Charge nach Art. 196 MwStSystRL: Die Steuer wird vom Leistungsempfänger geschuldet.",
  },
  en: {
    AT: "Reverse charge: recipient is liable for VAT under Art. 196 EU VAT Directive in conjunction with Sec. 19 para. 1a Austrian VAT Act.",
    DE: "Reverse charge under Sec. 13b German VAT Act in conjunction with Art. 196 EU VAT Directive – VAT is due by the recipient.",
    EU: "Reverse charge pursuant to Article 196 of the EU VAT Directive: VAT must be accounted for by the recipient in the Member State of destination.",
    default: "Reverse charge pursuant to Article 196 of the EU VAT Directive: the recipient is liable for VAT.",
  },
};

const domesticStandardNotes: NoteDictionary = {
  de: {
    AT: "Inländischer steuerpflichtiger Umsatz gemäß § 1 Abs. 1 Z 1 UStG. Es gilt der österreichische Standardsatz.",
    DE: "Inländischer steuerpflichtiger Umsatz gemäß § 1 Abs. 1 Nr. 1 UStG. Es gilt der deutsche Standardsatz.",
    CH: "Inländische Lieferung/Dienstleistung gemäß Art. 18 MWSTG. Es gilt der schweizerische Normalsatz.",
    default: "Inländische steuerpflichtige Leistung – nationale Umsatzsteuersätze des Sitzlandes gelten.",
  },
  en: {
    AT: "Domestic taxable supply pursuant to Sec. 1 para. 1 item 1 Austrian VAT Act. Austrian standard rate applies.",
    DE: "Domestic taxable supply pursuant to Sec. 1 para. 1 No. 1 German VAT Act. German standard rate applies.",
    CH: "Domestic supply pursuant to Art. 18 Swiss VAT Act. Swiss standard rate applies.",
    default: "Domestic taxable supply – the supplier's national VAT rate applies.",
  },
};

const exportNotes: NoteDictionary = {
  de: {
    default: "Steuerfreie Ausfuhrlieferung gemäß Art. 146 MwStSystRL bzw. nationalem Recht. Ausfuhrnachweise aufbewahren.",
  },
  en: {
    default: "Zero-rated export under Article 146 EU VAT Directive or corresponding national law. Retain export evidence.",
  },
};

function getNote(dictionary: NoteDictionary, lang: Language, country: CountryCode): string | undefined {
  const langBucket = dictionary[lang];
  return langBucket[country] || langBucket.EU || langBucket.default;
}

function pushUnique(target: Set<string>, value?: string) {
  if (value && value.trim().length > 0) {
    target.add(value.trim());
  }
}

export function determineRegion(sellerCountry: CountryCode, buyerCountry: CountryCode): TaxRegion {
  console.log(`[Tax] Determining region: seller=${sellerCountry}, buyer=${buyerCountry}`);
  
  if (sellerCountry === buyerCountry) {
    return "DOMESTIC";
  }

  const euCountries: CountryCode[] = ["AT", "DE", "BE", "BG", "CY", "CZ", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"] as CountryCode[];
  
  const sellerInEU = euCountries.includes(sellerCountry);
  const buyerInEU = euCountries.includes(buyerCountry);

  if (sellerInEU && buyerInEU) {
    return "INTRA_EU";
  }

  return "EXTRA_EU";
}

export function getRatesForCountry(country: CountryCode, _dateISO: string): { standard: number; reduced?: number[] } {
  const countryRules = rules[country];
  
  if (!countryRules?.rates) {
    console.warn(`[Tax] No rates found for ${country}, using 0%`);
    return { standard: 0 };
  }

  return countryRules.rates;
}

export function resolveScheme(ctx: TaxContext): TaxScheme {
  console.log(`[Tax] Resolving scheme:`, {
    smallBusiness: ctx.smallBusinessFlag,
    region: determineRegion(ctx.sellerCountry, ctx.buyerCountry),
    businessType: ctx.businessType,
    buyerVatId: ctx.buyerVatId,
  });

  if (ctx.smallBusinessFlag) {
    console.log(`[Tax] Scheme: EXEMPT (small business)`);
    return "EXEMPT";
  }

  const region = determineRegion(ctx.sellerCountry, ctx.buyerCountry);

  if (region === "INTRA_EU" && ctx.businessType === "B2B" && isLikelyValidVat(ctx.buyerVatId)) {
    console.log(`[Tax] Scheme: REVERSE_CHARGE (intra-EU B2B with valid VAT)`);
    return "REVERSE_CHARGE";
  }

  if (region === "DOMESTIC") {
    console.log(`[Tax] Scheme: STANDARD (domestic)`);
    return "STANDARD";
  }

  console.log(`[Tax] Scheme: EXEMPT (extra-EU or no VAT)`);
  return "EXEMPT";
}

export function buildLegalNotes(ctx: TaxContext): string[] {
  const lang = ctx.language;
  const msg = messages[lang];
  const notes = new Set<string>();

  const scheme = resolveScheme(ctx);
  const region = determineRegion(ctx.sellerCountry, ctx.buyerCountry);

  if (ctx.smallBusinessFlag) {
    pushUnique(notes, getNote(smallBusinessNotes, lang, ctx.sellerCountry));
  }

  if (scheme === "REVERSE_CHARGE") {
    pushUnique(notes, getNote(reverseChargeNotes, lang, ctx.sellerCountry));
    pushUnique(notes, msg.uid_hint);
  }

  if (scheme === "STANDARD" && region === "DOMESTIC") {
    pushUnique(notes, getNote(domesticStandardNotes, lang, ctx.sellerCountry));
  }

  if (region === "EXTRA_EU" && scheme === "EXEMPT") {
    pushUnique(notes, getNote(exportNotes, lang, ctx.sellerCountry));
  }

  // Always append generic messages for transparency
  pushUnique(notes, msg.disclaimer);

  const result = Array.from(notes);
  console.log(`[Tax] Generated ${result.length} legal notes`);
  return result;
}

export function summarizeTaxBadge(ctx: TaxContext): TaxBadge {
  const scheme = resolveScheme(ctx);

  if (ctx.smallBusinessFlag) {
    return { label: "KUR", color: "#10B981" };
  }

  if (scheme === "REVERSE_CHARGE") {
    return { label: "RC", color: "#3B82F6" };
  }

  if (scheme === "EXEMPT") {
    return { label: "0%", color: "#6B7280" };
  }

  const rates = getRatesForCountry(ctx.sellerCountry, ctx.invoiceDateISO);
  const standardRate = rates.standard;

  return {
    label: `${standardRate}%`,
    color: "#8B5CF6",
  };
}
