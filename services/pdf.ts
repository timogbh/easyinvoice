import type { Document, PDFResult, TemplateId, Language } from "@/types";
import { Platform } from "react-native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { formatCurrency, formatDate } from "@/utils/format";

export async function renderDocumentPDF(
  doc: Document,
  templateId?: TemplateId
): Promise<PDFResult> {
  const template = templateId || doc.template || "modern";
  console.log(`[PDF] Rendering document ${doc.number} with ${template} template`);

  const htmlContent = buildTemplate(doc, template);
  const fileBase = buildDocumentFileBase(doc);

  if (Platform.OS !== "web" && typeof Print.printToFileAsync === "function") {
    try {
      const pdf = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        fileName: fileBase,
      });
      console.log(`[PDF] Generated native PDF at ${pdf.uri}`);
      return { filePath: pdf.uri };
    } catch (error) {
      console.error("[PDF] Failed to render PDF via expo-print, falling back to HTML:", error);
    }
  }

  const fileName = `${fileBase}.html`;
  const fileUri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ""}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  console.log(`[PDF] Fallback HTML saved to ${fileUri}`);
  return { filePath: fileUri };
}

interface BuildParams {
  doc: Document;
  seller: Document["seller"];
  brandColor?: string;
  logoUrl?: string;
  locale: Language;
}

function buildDocumentFileBase(doc: Document): string {
  const numberPart = doc.number.replace(/[^a-zA-Z0-9-_]/g, "");
  const companyPart = (doc.seller.displayName || "Company").replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 24) || "Company";
  return `${numberPart}_${companyPart}`;
}

function normalizeColor(color: string | undefined, fallback = "#0F766E"): string {
  if (!color) return fallback;
  return color.startsWith("#") ? color : `#${color}`;
}

function calculateLineTotal(unitPrice: number, qty: number, discountPct?: number): number {
  const discountFactor = 1 - (discountPct || 0) / 100;
  return unitPrice * qty * discountFactor;
}

function renderLegalNotes(notes: string[] | undefined): string {
  if (!notes || notes.length === 0) {
    return "";
  }

  const items = notes
    .map((note) => `<li>${note}</li>`)
    .join("");

  return `
    <section class="legal-notes">
      <h2>Rechtliche Hinweise</h2>
      <ul>${items}</ul>
    </section>
  `;
}

interface TemplateContentSections {
  docTypeLabel: string;
  sellerInfo: string;
  documentInfo: string;
  clientInfo: string;
  lineItems: string;
  totalsTable: string;
  paymentDetails: string;
  notesSection: string;
  legalNotesSection: string;
  badgesSection: string;
  footer: string;
}

function prepareTemplateContent(params: BuildParams): TemplateContentSections {
  const { doc, seller, locale } = params;
  const docTypeLabel = doc.type === "INVOICE" ? "Rechnung" : "Angebot";

  const sellerAddressLines = [
    seller.street,
    [seller.zip, seller.city].filter(Boolean).join(" ").trim(),
    seller.country,
  ].filter(Boolean);

  const sellerInfo = `
    <div class="info-card">
      <h2>Absender</h2>
      <p class="info-title">${seller.displayName}</p>
      ${sellerAddressLines.map((line) => `<p>${line}</p>`).join("")}
      ${seller.vatId ? `<p class="info-meta">UID: ${seller.vatId}</p>` : ""}
      ${seller.taxNumber ? `<p class="info-meta">Steuernummer: ${seller.taxNumber}</p>` : ""}
    </div>
  `;

  const docMetaRows = [
    { label: docTypeLabel, value: doc.number },
    { label: "Datum", value: formatDate(doc.dateISO, locale) },
    doc.dueISO ? { label: "Fällig", value: formatDate(doc.dueISO, locale) } : null,
    doc.placeOfSupply ? { label: "Leistungsort", value: doc.placeOfSupply } : null,
    seller.businessTypeDefault ? { label: "Standardkunde", value: seller.businessTypeDefault } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row && row.value));

  const documentInfo = `
    <div class="info-card">
      <h2>Dokument</h2>
      <dl>
        ${docMetaRows
          .map(
            (row) => `
              <div class="meta-row">
                <dt>${row.label}</dt>
                <dd>${row.value}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    </div>
  `;

  const client = doc.client;
  const clientLines = [
    client.street,
    [client.zip, client.city].filter(Boolean).join(" ").trim(),
    client.country,
  ].filter(Boolean);

  const clientInfo = `
    <section class="client-card">
      <h2>Kunde</h2>
      <p class="info-title">${client.name}</p>
      ${clientLines.map((line) => `<p>${line}</p>`).join("")}
      ${client.email ? `<p class="info-meta">${client.email}</p>` : ""}
      ${client.vatId ? `<p class="info-meta">UID: ${client.vatId}</p>` : ""}
      ${client.notes ? `<p class="info-meta">${client.notes}</p>` : ""}
    </section>
  `;

  const lineItems = doc.lines
    .map((line, idx) => {
      const total = calculateLineTotal(line.unitPrice, line.qty, line.discountPct);
      const discount = line.discountPct ? `${line.discountPct}%` : "—";
      return `
        <tr>
          <td class="col-index">${idx + 1}</td>
          <td class="col-description">
            <div class="line-title">${line.customTitle || "Position"}</div>
            ${line.customDesc ? `<p class="line-desc">${line.customDesc}</p>` : ""}
          </td>
          <td class="col-qty">${line.qty} ${line.unit || ""}</td>
          <td class="col-price">${formatCurrency(line.unitPrice, doc.currency, locale)}</td>
          <td class="col-tax">${line.taxRate}%</td>
          <td class="col-discount">${discount}</td>
          <td class="col-total">${formatCurrency(total, doc.currency, locale)}</td>
        </tr>
      `;
    })
    .join("");

  const taxBreakdown = doc.taxBreakdown && doc.taxBreakdown.length > 0
    ? doc.taxBreakdown
        .map(
          (item) => `
            <tr>
              <td class="label">MwSt. ${item.rate}%</td>
              <td class="value">${formatCurrency(item.tax, doc.currency, locale)}</td>
            </tr>
          `
        )
        .join("")
    : "";

  const totalsTable = `
    <table class="totals">
      <tbody>
        <tr>
          <td class="label">Zwischensumme</td>
          <td class="value">${formatCurrency(doc.subtotalNet, doc.currency, locale)}</td>
        </tr>
        ${taxBreakdown}
        <tr class="grand-total">
          <td class="label">Gesamtbetrag</td>
          <td class="value">${formatCurrency(doc.totalGross, doc.currency, locale)}</td>
        </tr>
      </tbody>
    </table>
  `;

  const paymentRows: string[] = [];
  if (seller.iban) {
    paymentRows.push(`<tr><td>IBAN</td><td>${seller.iban}</td></tr>`);
  }
  if (seller.bic) {
    paymentRows.push(`<tr><td>BIC</td><td>${seller.bic}</td></tr>`);
  }
  if (seller.website) {
    paymentRows.push(`<tr><td>Website</td><td>${seller.website}</td></tr>`);
  }

  const paymentDetails = paymentRows.length
    ? `
        <section class="payment-card">
          <h2>Zahlungsinformationen</h2>
          <table>
            <tbody>${paymentRows.join("")}</tbody>
          </table>
        </section>
      `
    : "";

  const notesSection = doc.notes
    ? `
        <section class="notes">
          <h2>Bemerkungen</h2>
          <p>${doc.notes}</p>
        </section>
      `
    : "";

  const badges: string[] = [];
  if (doc.taxScheme === "REVERSE_CHARGE") {
    badges.push(
      `<div class="badge warning">⚠ Reverse Charge: Steuerschuldnerschaft des Leistungsempfängers</div>`
    );
  }
  if (doc.taxScheme === "EXEMPT" && seller.smallBusinessFlag) {
    badges.push(
      `<div class="badge info">ℹ Kleinunternehmerregelung gemäß §19 UStG – keine Umsatzsteuer ausgewiesen</div>`
    );
  }

  const badgesSection = badges.length
    ? `<section class="badges">${badges.join("")}</section>`
    : "";

  const footerParts = [seller.displayName, seller.email, seller.phone]
    .filter(Boolean)
    .join(" • ");

  return {
    docTypeLabel,
    sellerInfo,
    documentInfo,
    clientInfo,
    lineItems,
    totalsTable,
    paymentDetails,
    notesSection,
    legalNotesSection: renderLegalNotes(doc.legalNotes),
    badgesSection,
    footer: footerParts,
  };
}

function renderTemplate(
  theme: "modern" | "classic" | "minimal",
  styles: string,
  params: BuildParams,
  content: TemplateContentSections
): string {
  const { doc, seller, logoUrl, locale } = params;
  const contactLine = [seller.email, seller.phone, seller.website]
    .filter(Boolean)
    .join(" • ");
  const baseStyles = `
    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    tbody tr { page-break-inside: avoid; }
    table, thead, tbody, tr, td, th { page-break-after: auto; page-break-inside: avoid; }
  `;

  return `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8" />
      <title>${content.docTypeLabel} ${doc.number}</title>
      <style>
        ${baseStyles}
        ${styles}
      </style>
    </head>
    <body class="template-${theme}">
      <div class="page">
        <header class="header">
          <div class="branding">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : `<div class="wordmark">${seller.displayName}</div>`}
            ${logoUrl ? `<div class="brand-meta">${seller.displayName}</div>` : contactLine ? `<div class="brand-meta">${contactLine}</div>` : ""}
          </div>
          <div class="document-head">
            <span class="doc-type">${content.docTypeLabel}</span>
            <span class="doc-number">${doc.number}</span>
            <span class="doc-date">${formatDate(doc.dateISO, locale)}</span>
          </div>
        </header>

        <section class="info-grid">
          ${content.sellerInfo}
          ${content.documentInfo}
        </section>

        ${content.clientInfo}

        <section class="items">
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th class="col-description">Beschreibung</th>
                <th class="col-qty">Menge</th>
                <th class="col-price">Einzelpreis</th>
                <th class="col-tax">Steuer</th>
                <th class="col-discount">Rabatt</th>
                <th class="col-total">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${content.lineItems}
            </tbody>
          </table>
        </section>

        <section class="summary">
          <div class="totals-card">
            ${content.totalsTable}
          </div>
          ${content.paymentDetails}
        </section>

        ${content.badgesSection}
        ${content.notesSection}
        ${content.legalNotesSection}

        <footer class="footer">
          <p>${content.footer}</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

function buildTemplate(doc: Document, template: TemplateId): string {
  const params: BuildParams = {
    doc,
    seller: doc.seller,
    brandColor: doc.seller.brandColor,
    logoUrl: doc.seller.logoUrl,
    locale: doc.seller.language,
  };

  switch (template) {
    case "classic":
      return buildClassic(params);
    case "minimal":
      return buildMinimal(params);
    case "modern":
    default:
      return buildModern(params);
  }
}

function buildClassic(params: BuildParams): string {
  const primary = normalizeColor(params.brandColor, "#8B4513");
  const accent = `${primary}26`;
  const content = prepareTemplateContent(params);

  const styles = `
    @page { size: A4; margin: 0; }
    :root {
      --brand: ${primary};
      --accent: ${accent};
      --text: #2d1f0f;
      --muted: #6f5640;
      --border: #e6d8c7;
      --parchment: #fffdf6;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Georgia', 'Times New Roman', serif; background: #f4ede1; color: var(--text); }
    .page { width: 794px; min-height: 1123px; margin: 0 auto; background: var(--parchment); padding: 64px 72px; border: 12px double ${primary}33; box-shadow: 0 18px 40px rgba(103, 65, 34, 0.18); display: flex; flex-direction: column; gap: 28px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 28px; border-bottom: 3px double var(--brand); }
    .branding { text-align: left; display: flex; flex-direction: column; gap: 10px; }
    .branding .logo { max-width: 220px; max-height: 90px; object-fit: contain; }
    .wordmark { font-size: 34px; font-weight: 600; letter-spacing: 4px; color: var(--brand); text-transform: uppercase; }
    .brand-meta { font-size: 13px; color: var(--muted); font-style: italic; }
    .document-head { text-align: right; display: flex; flex-direction: column; gap: 6px; }
    .doc-type { font-size: 20px; font-weight: 700; color: var(--brand); letter-spacing: 6px; text-transform: uppercase; }
    .doc-number { font-size: 26px; font-weight: 700; }
    .doc-date { font-size: 13px; color: var(--muted); }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
    .info-card { background: linear-gradient(135deg, ${primary}08, transparent); border: 1px solid ${primary}33; border-radius: 14px; padding: 22px 24px; }
    .info-card h2 { margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3em; color: var(--muted); }
    .info-title { font-size: 20px; font-weight: 600; margin-bottom: 6px; }
    .info-card p { margin: 0; font-size: 13px; line-height: 1.6; }
    .info-meta { font-size: 12px; color: var(--muted); font-style: italic; }
    .info-card dl { margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .meta-row { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; }
    .meta-row dt { color: var(--muted); text-transform: uppercase; font-size: 11px; letter-spacing: 0.18em; }
    .meta-row dd { margin: 0; font-weight: 600; }
    .client-card { background: #fffaf0; border: 1px solid var(--border); border-radius: 14px; padding: 26px 28px; box-shadow: inset 0 0 0 1px ${primary}14; }
    .client-card h2 { margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.25em; color: var(--muted); }
    .client-card .info-title { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
    .items-table { width: 100%; border-collapse: collapse; border: 1px solid var(--border); box-shadow: 0 10px 18px rgba(87, 59, 35, 0.08); }
    .items-table thead { background: linear-gradient(to right, ${primary}12, ${primary}05); }
    .items-table th { padding: 14px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); border-bottom: 2px solid ${primary}33; }
    .items-table td { padding: 16px 18px; border-bottom: 1px solid var(--border); font-size: 13px; }
    .items-table tr:nth-child(even) td { background: #fffaf3; }
    .col-index { width: 48px; text-align: center; color: var(--muted); font-style: italic; }
    .col-qty, .col-price, .col-tax, .col-discount, .col-total { text-align: right; white-space: nowrap; }
    .line-title { font-weight: 600; letter-spacing: 0.05em; margin-bottom: 6px; }
    .line-desc { margin: 0; font-size: 12px; color: var(--muted); font-style: italic; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: start; }
    .totals-card { background: #fffdfa; border: 2px solid ${primary}26; border-radius: 16px; padding: 24px 26px; box-shadow: 0 12px 22px rgba(87, 59, 35, 0.12); }
    .totals { width: 100%; border-collapse: collapse; }
    .totals .label { text-align: left; color: var(--muted); font-size: 13px; padding: 8px 0; text-transform: uppercase; letter-spacing: 0.18em; }
    .totals .value { text-align: right; font-size: 16px; font-weight: 600; padding: 8px 0; }
    .totals .grand-total .label { font-size: 18px; color: var(--brand); }
    .totals .grand-total .value { font-size: 24px; color: var(--brand); font-weight: 700; }
    .payment-card { background: #fffdfa; border: 1px solid var(--border); border-radius: 16px; padding: 24px 26px; box-shadow: inset 0 0 0 1px ${primary}19; }
    .payment-card h2 { margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
    .payment-card table { width: 100%; border-collapse: collapse; }
    .payment-card td { padding: 8px 0; font-size: 13px; }
    .payment-card td:first-child { color: var(--muted); width: 35%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.2em; }
    .badges { display: flex; flex-direction: column; gap: 16px; }
    .badge { border-radius: 12px; padding: 16px 20px; font-size: 13px; font-weight: 600; background: #fffbe6; border: 1px solid ${primary}26; }
    .badge.warning { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #7c2d12; border: 1px solid #fcd34d; }
    .badge.info { background: linear-gradient(135deg, #e0f2fe, #bfdbfe); color: #1e40af; border: 1px solid #93c5fd; }
    .notes, .legal-notes { background: #fffdfa; border: 1px solid var(--border); border-radius: 16px; padding: 26px 28px; box-shadow: inset 0 0 0 1px ${primary}12; }
    .notes h2, .legal-notes h2 { margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.25em; color: var(--muted); }
    .notes p { margin: 0; font-size: 13px; line-height: 1.7; }
    .legal-notes ul { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 10px; font-size: 13px; }
    .footer { border-top: 3px double var(--brand); padding-top: 22px; text-align: center; color: var(--muted); font-size: 12px; letter-spacing: 0.12em; margin-top: auto; }
    @media print { body { background: #ffffff; } .page { box-shadow: none; border: none; } }
  `;

  return renderTemplate("classic", styles, params, content);
}

function buildMinimal(params: BuildParams): string {
  const primary = normalizeColor(params.brandColor, "#111827");
  const subtle = `${primary}10`;
  const content = prepareTemplateContent(params);

  const styles = `
    @page { size: A4; margin: 0; }
    :root {
      --brand: ${primary};
      --muted: #6b7280;
      --border: #e5e7eb;
      --background: #f8fafc;
      --text: #111827;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; background: var(--background); color: var(--text); }
    .page { width: 794px; min-height: 1123px; margin: 0 auto; background: #ffffff; padding: 84px 92px; display: flex; flex-direction: column; gap: 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 28px; }
    .branding { display: flex; flex-direction: column; gap: 10px; }
    .branding .logo { max-width: 200px; max-height: 80px; object-fit: contain; opacity: 0.9; }
    .wordmark { font-size: 32px; font-weight: 500; letter-spacing: -0.6px; }
    .brand-meta { font-size: 13px; color: var(--muted); }
    .document-head { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; text-align: right; }
    .doc-type { font-size: 20px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }
    .doc-number { font-size: 26px; font-weight: 600; color: var(--brand); }
    .doc-date { font-size: 12px; color: var(--muted); }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; }
    .info-card { border: 1px solid transparent; border-radius: 18px; padding: 24px 26px; background: rgba(248, 250, 252, 0.6); }
    .info-card h2 { margin: 0 0 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.28em; color: var(--muted); }
    .info-title { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
    .info-card p { margin: 0; font-size: 14px; line-height: 1.7; }
    .info-meta { font-size: 12px; color: var(--muted); }
    .info-card dl { margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 13px; gap: 20px; }
    .meta-row dt { color: var(--muted); text-transform: uppercase; font-size: 11px; letter-spacing: 0.2em; }
    .meta-row dd { margin: 0; font-weight: 600; }
    .client-card { border-radius: 18px; padding: 28px 32px; background: #ffffff; border: 1px solid var(--border); }
    .client-card h2 { margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.28em; color: var(--muted); }
    .client-card .info-title { font-size: 24px; font-weight: 600; margin-bottom: 6px; }
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table thead { display: none; }
    .items-table tr { border-bottom: 1px solid var(--border); }
    .items-table td { padding: 26px 0; font-size: 15px; vertical-align: top; }
    .col-index { display: none; }
    .col-description { width: 60%; }
    .line-title { font-weight: 600; letter-spacing: -0.2px; margin-bottom: 6px; }
    .line-desc { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.7; }
    .col-qty, .col-price, .col-tax, .col-discount, .col-total { text-align: right; color: var(--muted); font-feature-settings: 'tnum'; }
    .col-total { color: var(--brand); font-weight: 600; font-size: 16px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: start; }
    .totals-card { border-radius: 18px; border: 1px solid var(--border); padding: 28px 32px; background: #ffffff; }
    .totals { width: 100%; border-collapse: collapse; }
    .totals .label { text-align: left; color: var(--muted); font-size: 14px; padding: 10px 0; text-transform: uppercase; letter-spacing: 0.18em; }
    .totals .value { text-align: right; font-size: 16px; font-weight: 600; padding: 10px 0; }
    .totals .grand-total .label { color: var(--brand); font-size: 16px; }
    .totals .grand-total .value { font-size: 30px; font-weight: 600; color: var(--brand); }
    .payment-card { border-radius: 18px; border: 1px solid transparent; padding: 28px 32px; background: #f9fafb; }
    .payment-card h2 { margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.24em; color: var(--muted); }
    .payment-card table { width: 100%; border-collapse: collapse; }
    .payment-card td { padding: 8px 0; font-size: 14px; }
    .payment-card td:first-child { color: var(--muted); text-transform: uppercase; font-size: 11px; letter-spacing: 0.18em; }
    .badges { display: flex; flex-direction: column; gap: 14px; }
    .badge { border-radius: 14px; padding: 16px 22px; font-size: 13px; font-weight: 500; background: ${subtle}; color: var(--brand); border: 1px solid var(--border); }
    .badge.warning { background: #fffbeb; color: #92400e; border-color: #fef08a; }
    .badge.info { background: #eef2ff; color: #3730a3; border-color: #c7d2fe; }
    .notes, .legal-notes { border-radius: 18px; border: 1px solid transparent; padding: 30px 34px; background: #fcfcfd; }
    .notes h2, .legal-notes h2 { margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); }
    .notes p { margin: 0; font-size: 14px; line-height: 1.8; color: #1f2937; }
    .legal-notes ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #374151; }
    .footer { border-top: 1px solid var(--border); padding-top: 24px; margin-top: auto; text-align: center; color: var(--muted); font-size: 12px; }
    @media print { body { background: #ffffff; } .page { box-shadow: none; } }
  `;

  return renderTemplate("minimal", styles, params, content);
}

export async function shareOrSave(filePath: string): Promise<void> {
  console.log(`[PDF] Mock share/save for ${filePath}`);
  
  alert("PDF-Export ist derzeit im Mock-Modus. In der finalen Version wird hier ein natives Share-Sheet oder Download angezeigt.");
}
