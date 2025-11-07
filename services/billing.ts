import type { DocLine, TaxScheme, TotalsResult, TaxBreakdownItem } from "@/types";

export function priceAfterDiscount(unitPrice: number, discountPct?: number): number {
  if (!discountPct || discountPct <= 0) return unitPrice;
  return unitPrice * (1 - discountPct / 100);
}

export function lineNet(docLine: DocLine): number {
  const priceAfterDisc = priceAfterDiscount(docLine.unitPrice, docLine.discountPct);
  return priceAfterDisc * docLine.qty;
}

export function lineTax(docLine: DocLine, taxScheme: TaxScheme): number {
  if (taxScheme === "REVERSE_CHARGE" || taxScheme === "EXEMPT") {
    return 0;
  }
  const net = lineNet(docLine);
  return net * (docLine.taxRate / 100);
}

export function totals(lines: DocLine[], taxScheme: TaxScheme): TotalsResult {
  console.log(`[Billing] Calculating totals for ${lines.length} lines, scheme: ${taxScheme}`);
  
  let subtotalNet = 0;
  let taxTotal = 0;
  const taxMap = new Map<number, { base: number; tax: number }>();

  for (const line of lines) {
    const net = lineNet(line);
    const tax = lineTax(line, taxScheme);

    subtotalNet += net;
    taxTotal += tax;

    if (taxScheme === "STANDARD" && line.taxRate > 0) {
      const existing = taxMap.get(line.taxRate) || { base: 0, tax: 0 };
      taxMap.set(line.taxRate, {
        base: existing.base + net,
        tax: existing.tax + tax,
      });
    }
  }

  const taxBreakdown: TaxBreakdownItem[] = Array.from(taxMap.entries()).map(
    ([rate, { base, tax }]) => ({
      rate,
      base: Math.round(base * 100) / 100,
      tax: Math.round(tax * 100) / 100,
    })
  );

  const totalGross = subtotalNet + taxTotal;

  console.log(`[Billing] Result: net=${subtotalNet.toFixed(2)}, tax=${taxTotal.toFixed(2)}, gross=${totalGross.toFixed(2)}`);

  return {
    subtotalNet: Math.round(subtotalNet * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
    taxBreakdown,
  };
}
