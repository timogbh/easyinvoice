import type { CountryCode } from "@/types";

export interface Country {
  code: CountryCode;
  name: string;
  emoji: string;
  isEU: boolean;
}

export const EU_COUNTRIES: Country[] = [
  { code: "AT", name: "Austria", emoji: "🇦🇹", isEU: true },
  { code: "DE", name: "Germany", emoji: "🇩🇪", isEU: true },
  { code: "BE", name: "Belgium", emoji: "🇧🇪", isEU: true },
  { code: "BG", name: "Bulgaria", emoji: "🇧🇬", isEU: true },
  { code: "HR", name: "Croatia", emoji: "🇭🇷", isEU: true },
  { code: "CY", name: "Cyprus", emoji: "🇨🇾", isEU: true },
  { code: "CZ", name: "Czech Republic", emoji: "🇨🇿", isEU: true },
  { code: "DK", name: "Denmark", emoji: "🇩🇰", isEU: true },
  { code: "EE", name: "Estonia", emoji: "🇪🇪", isEU: true },
  { code: "FI", name: "Finland", emoji: "🇫🇮", isEU: true },
  { code: "FR", name: "France", emoji: "🇫🇷", isEU: true },
  { code: "GR", name: "Greece", emoji: "🇬🇷", isEU: true },
  { code: "HU", name: "Hungary", emoji: "🇭🇺", isEU: true },
  { code: "IE", name: "Ireland", emoji: "🇮🇪", isEU: true },
  { code: "IT", name: "Italy", emoji: "🇮🇹", isEU: true },
  { code: "LV", name: "Latvia", emoji: "🇱🇻", isEU: true },
  { code: "LT", name: "Lithuania", emoji: "🇱🇹", isEU: true },
  { code: "LU", name: "Luxembourg", emoji: "🇱🇺", isEU: true },
  { code: "MT", name: "Malta", emoji: "🇲🇹", isEU: true },
  { code: "NL", name: "Netherlands", emoji: "🇳🇱", isEU: true },
  { code: "PL", name: "Poland", emoji: "🇵🇱", isEU: true },
  { code: "PT", name: "Portugal", emoji: "🇵🇹", isEU: true },
  { code: "RO", name: "Romania", emoji: "🇷🇴", isEU: true },
  { code: "SK", name: "Slovakia", emoji: "🇸🇰", isEU: true },
  { code: "SI", name: "Slovenia", emoji: "🇸🇮", isEU: true },
  { code: "ES", name: "Spain", emoji: "🇪🇸", isEU: true },
  { code: "SE", name: "Sweden", emoji: "🇸🇪", isEU: true },
];

export const OTHER_COUNTRIES: Country[] = [
  { code: "CH", name: "Switzerland", emoji: "🇨🇭", isEU: false },
  { code: "GB", name: "United Kingdom", emoji: "🇬🇧", isEU: false },
  { code: "US", name: "United States", emoji: "🇺🇸", isEU: false },
  { code: "CA", name: "Canada", emoji: "🇨🇦", isEU: false },
  { code: "AU", name: "Australia", emoji: "🇦🇺", isEU: false },
  { code: "JP", name: "Japan", emoji: "🇯🇵", isEU: false },
  { code: "CN", name: "China", emoji: "🇨🇳", isEU: false },
  { code: "BR", name: "Brazil", emoji: "🇧🇷", isEU: false },
  { code: "IN", name: "India", emoji: "🇮🇳", isEU: false },
  { code: "RU", name: "Russia", emoji: "🇷🇺", isEU: false },
  { code: "NO", name: "Norway", emoji: "🇳🇴", isEU: false },
  { code: "TR", name: "Turkey", emoji: "🇹🇷", isEU: false },
  { code: "MX", name: "Mexico", emoji: "🇲🇽", isEU: false },
  { code: "ZA", name: "South Africa", emoji: "🇿🇦", isEU: false },
  { code: "KR", name: "South Korea", emoji: "🇰🇷", isEU: false },
  { code: "SG", name: "Singapore", emoji: "🇸🇬", isEU: false },
  { code: "AE", name: "United Arab Emirates", emoji: "🇦🇪", isEU: false },
  { code: "NZ", name: "New Zealand", emoji: "🇳🇿", isEU: false },
  { code: "OTHER", name: "Other", emoji: "🌍", isEU: false },
];

export const ALL_COUNTRIES: Country[] = [...EU_COUNTRIES, ...OTHER_COUNTRIES];

export const getCountryByCode = (code?: CountryCode | string): Country | undefined => {
  return ALL_COUNTRIES.find((c) => c.code === code);
};

export const getCountryName = (code?: CountryCode | string): string => {
  const country = getCountryByCode(code);
  return country ? country.name : code || "Unknown";
};
