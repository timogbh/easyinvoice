import type { CompanyProfile, Client, Document, TaxContext } from "@/types";
import { isLikelyValidVat } from "./vatValidation";

export function validateCompany(profile: Partial<CompanyProfile>): string[] {
  const errors: string[] = [];

  if (!profile.displayName?.trim()) {
    errors.push("Display name is required");
  }

  if (!profile.country) {
    errors.push("Country is required");
  }

  if (!profile.currency) {
    errors.push("Currency is required");
  }

  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push("Invalid email format");
  }

  if (profile.vatId && profile.vatId.trim() && !isLikelyValidVat(profile.vatId)) {
    errors.push("VAT ID format appears invalid");
  }

  console.log(`[Validators] validateCompany: ${errors.length} errors`);
  return errors;
}

export function validateClient(client: Partial<Client>): string[] {
  const errors: string[] = [];

  if (!client.name?.trim()) {
    errors.push("Client name is required");
  }

  if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
    errors.push("Invalid email format");
  }

  if (client.vatId && client.vatId.trim() && !isLikelyValidVat(client.vatId)) {
    errors.push("VAT ID format appears invalid");
  }

  console.log(`[Validators] validateClient: ${errors.length} errors`);
  return errors;
}

export function validateDocument(doc: Partial<Document>): string[] {
  const errors: string[] = [];

  if (!doc.number?.trim()) {
    errors.push("Document number is required");
  }

  if (!doc.dateISO) {
    errors.push("Date is required");
  }

  if (!doc.client) {
    errors.push("Client is required");
  }

  if (!doc.lines || doc.lines.length === 0) {
    errors.push("At least one line item is required");
  }

  console.log(`[Validators] validateDocument: ${errors.length} errors`);
  return errors;
}

export function validateTaxContext(ctx: Partial<TaxContext>): string[] {
  const errors: string[] = [];

  if (!ctx.sellerCountry) {
    errors.push("Seller country is required");
  }

  if (!ctx.buyerCountry) {
    errors.push("Buyer country is required");
  }

  if (!ctx.businessType) {
    errors.push("Business type is required");
  }

  if (ctx.scheme === "REVERSE_CHARGE") {
    if (ctx.businessType !== "B2B") {
      errors.push("Reverse charge requires B2B transaction");
    }
    if (!isLikelyValidVat(ctx.buyerVatId)) {
      errors.push("Reverse charge requires valid buyer VAT ID");
    }
  }

  if (ctx.smallBusinessFlag && ctx.scheme === "STANDARD") {
    errors.push("Small business flag conflicts with standard VAT scheme");
  }

  console.log(`[Validators] validateTaxContext: ${errors.length} errors`);
  return errors;
}

export function validateDocumentForPDF(doc: Document): string[] {
  const errors: string[] = [];

  if (doc.taxScheme === "EXEMPT" && doc.taxTotal > 0) {
    errors.push("EXEMPT scheme (KUR) must have zero tax");
  }

  if (doc.taxScheme === "REVERSE_CHARGE" && doc.taxTotal > 0) {
    errors.push("REVERSE_CHARGE scheme must have zero tax");
  }

  if (doc.taxScheme === "REVERSE_CHARGE") {
    const hasRCNote = doc.legalNotes?.some(note => 
      note.toLowerCase().includes("reverse") || 
      note.toLowerCase().includes("umkehr")
    );
    if (!hasRCNote) {
      errors.push("REVERSE_CHARGE requires RC notice in legalNotes");
    }
  }

  if (doc.taxScheme === "EXEMPT") {
    const hasKURNote = doc.legalNotes?.some(note => 
      note.toLowerCase().includes("kleinunternehmer") || 
      note.toLowerCase().includes("small business")
    );
    if (!hasKURNote) {
      errors.push("EXEMPT (KUR) requires small business notice in legalNotes");
    }
  }

  console.log(`[Validators] validateDocumentForPDF: ${errors.length} errors`);
  return errors;
}
