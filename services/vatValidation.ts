export function normalizeVatId(id?: string): string {
  if (!id) return "";
  return id.replace(/[\s\-\.]/g, "").toUpperCase();
}

export function isLikelyValidVat(id?: string): boolean {
  const normalized = normalizeVatId(id);
  if (normalized.length < 4) return false;

  const patterns: Record<string, RegExp> = {
    AT: /^ATU\d{8}$/,
    DE: /^DE\d{9}$/,
    CH: /^CHE\d{9}(MWST|TVA|IVA)?$/,
    BE: /^BE[01]\d{9}$/,
    BG: /^BG\d{9,10}$/,
    CY: /^CY\d{8}[A-Z]$/,
    CZ: /^CZ\d{8,10}$/,
    DK: /^DK\d{8}$/,
    EE: /^EE\d{9}$/,
    EL: /^EL\d{9}$/,
    ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
    FI: /^FI\d{8}$/,
    FR: /^FR[A-Z0-9]{2}\d{9}$/,
    GB: /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    HR: /^HR\d{11}$/,
    HU: /^HU\d{8}$/,
    IE: /^IE\d[A-Z0-9]\d{5}[A-Z]$/,
    IT: /^IT\d{11}$/,
    LT: /^LT(\d{9}|\d{12})$/,
    LU: /^LU\d{8}$/,
    LV: /^LV\d{11}$/,
    MT: /^MT\d{8}$/,
    NL: /^NL\d{9}B\d{2}$/,
    PL: /^PL\d{10}$/,
    PT: /^PT\d{9}$/,
    RO: /^RO\d{2,10}$/,
    SE: /^SE\d{12}$/,
    SI: /^SI\d{8}$/,
    SK: /^SK\d{10}$/,
  };

  for (const pattern of Object.values(patterns)) {
    if (pattern.test(normalized)) {
      console.log(`[VATValidation] ${normalized} matches pattern`);
      return true;
    }
  }

  console.log(`[VATValidation] ${normalized} does not match any known pattern`);
  return false;
}

export function getVatCountryCode(vatId?: string): string | null {
  const normalized = normalizeVatId(vatId);
  if (normalized.length < 2) return null;
  
  const prefix = normalized.substring(0, 2);
  const validPrefixes = [
    "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES",
    "FI", "FR", "GB", "HR", "HU", "IE", "IT", "LT", "LU", "LV",
    "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "CH"
  ];
  
  if (normalized.startsWith("CHE")) return "CH";
  
  return validPrefixes.includes(prefix) ? prefix : null;
}
