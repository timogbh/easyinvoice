export type CountryCode = 
  | "AT" | "DE" | "CH" | "EU" 
  | "BE" | "BG" | "HR" | "CY" | "CZ" | "DK" | "EE" | "FI" | "FR" 
  | "GR" | "HU" | "IE" | "IT" | "LV" | "LT" | "LU" | "MT" | "NL" 
  | "PL" | "PT" | "RO" | "SK" | "SI" | "ES" | "SE" 
  | "GB" | "US" | "CA" | "AU" | "JP" | "CN" | "BR" | "IN" | "RU" 
  | "NO" | "TR" | "MX" | "ZA" | "KR" | "SG" | "AE" | "NZ" 
  | "OTHER";
export type CurrencyCode = "EUR" | "USD" | "GBP" | "CHF";
export type TaxScheme = "STANDARD" | "REVERSE_CHARGE" | "EXEMPT";
export type BusinessType = "B2B" | "B2C";
export type TaxRegion = "DOMESTIC" | "INTRA_EU" | "EXTRA_EU";
export type DocType = "INVOICE" | "QUOTE";
export type UnitType = "Stk" | "Std" | "Tag" | "Monat" | "Pauschal";
export type Language = "de" | "en";
export type ServiceCategory = "SERVICE" | "DIGITAL" | "GOODS";

export interface CompanyProfile {
  id: string;
  displayName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  country: CountryCode;
  vatId?: string;
  taxNumber?: string;
  iban?: string;
  bic?: string;
  website?: string;
  logoUrl?: string;
  brandColor?: string;
  currency: CurrencyCode;
  language: Language;
  numbering: {
    invoicePrefix: string;
    invoiceNext: number;
    quotePrefix: string;
    quoteNext: number;
  };
  consentISO?: string;
  premium: boolean;
  smallBusinessFlag?: boolean;
  businessTypeDefault?: BusinessType;
  defaultTemplate?: TemplateId;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: CountryCode;
  vatId?: string;
  notes?: string;
  defaultTaxScheme?: TaxScheme;
  defaultCurrency?: CurrencyCode;
  businessType?: BusinessType;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  qty: number;
  unit: UnitType;
  unitPrice: number;
  taxRate: number;
  discountPct?: number;
}

export interface DocLine {
  itemId?: string;
  customTitle?: string;
  customDesc?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discountPct?: number;
}

export interface PaymentTerm {
  days: number;
  note?: string;
}

export interface TaxContext {
  sellerCountry: CountryCode;
  buyerCountry: CountryCode;
  businessType: BusinessType;
  sellerVatId?: string;
  buyerVatId?: string;
  scheme: TaxScheme;
  smallBusinessFlag?: boolean;
  serviceCategory?: ServiceCategory;
  invoiceDateISO: string;
  currency: CurrencyCode;
  language: Language;
}

export interface TaxBreakdownItem {
  rate: number;
  base: number;
  tax: number;
}

export interface Document {
  id: string;
  type: DocType;
  number: string;
  dateISO: string;
  dueISO?: string;
  placeOfSupply?: string;
  seller: CompanyProfile;
  client: Client;
  currency: CurrencyCode;
  taxScheme: TaxScheme;
  lines: DocLine[];
  subtotalNet: number;
  taxTotal: number;
  totalGross: number;
  notes?: string;
  attachments?: string[];
  legalNotes?: string[];
  taxBreakdown?: TaxBreakdownItem[];
  createdAtISO: string;
  updatedAtISO: string;
  template?: TemplateId;
}

export interface PlanCounters {
  periodISO: string;
  freeDocsUsed: number;
}

export type ToneType = "neutral" | "formal" | "casual";
export type AITextType = "item_title" | "item_description" | "invoice_note" | "payment_terms" | "email_cover";

export type TemplateId = "modern" | "classic" | "minimal";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  supportsLogo: boolean;
  supportsBrandColor: boolean;
  pageSize: "A4";
  margins: { top: number; right: number; bottom: number; left: number };
}

export interface AICounters {
  periodISO: string;
  freeUsed: number;
  premiumUsed: number;
}

export interface AISettings {
  enabled: boolean;
  language: Language;
  tone: ToneType;
}

export interface TaxRuleCountry {
  currency: CurrencyCode;
  rates?: {
    standard: number;
    reduced?: number[];
  };
  smallBusiness?: {
    noteKey: string;
  };
  reverseCharge?: {
    enabled: boolean;
    noteKey?: string;
  };
}

export interface TaxRules {
  [countryCode: string]: TaxRuleCountry;
}

export interface Messages {
  [key: string]: string;
}

export interface TaxBadge {
  label: string;
  color: string;
}

export interface TotalsResult {
  subtotalNet: number;
  taxTotal: number;
  totalGross: number;
  taxBreakdown: TaxBreakdownItem[];
}

export interface PDFResult {
  filePath: string;
}

export interface Offering {
  id: string;
  price: string;
}

export interface Offerings {
  monthly: Offering;
  annual: Offering;
}

export interface Entitlements {
  premium: boolean;
}

export interface MonthlyStats {
  totalRevenue: number;
  invoiceCount: number;
  quoteCount: number;
}
