import type { CurrencyCode, Language } from "@/types";

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: Language
): string {
  const localeString = locale === "de" ? "de-DE" : "en-US";
  
  try {
    return new Intl.NumberFormat(localeString, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.warn(`[Format] Currency format error:`, error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateISO: string, locale: Language): string {
  const localeString = locale === "de" ? "de-DE" : "en-US";
  
  try {
    const date = new Date(dateISO);
    return new Intl.DateTimeFormat(localeString, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch (error) {
    console.warn(`[Format] Date format error:`, error);
    return dateISO;
  }
}

export function formatNumber(value: number, locale: Language): string {
  const localeString = locale === "de" ? "de-DE" : "en-US";
  
  try {
    return new Intl.NumberFormat(localeString, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.warn(`[Format] Number format error:`, error);
    return value.toFixed(2);
  }
}
