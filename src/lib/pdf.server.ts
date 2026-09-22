// Server-only PDF rendering for quotes, invoices and receipts.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const naira = (n: number) => `NGN ${n.toLocaleString("en-NG")}`;

type Line = {
  title_snapshot: string;
  quantity: number;
  line_total: number;
  is_on_request: boolean;
};

export type DocPayload = {
  kind: "quote" | "invoice" | "receipt";
  number: string;
  dateLabel: string;
  dateValue: string;
  party: { name: string; company?: string | null; email?: string | null; phone?: string | null };
  lines: Line[];
  totals: { label: string; value: string; strong?: boolean }[];
  notes: string[];
};

export async function renderDocumentPdf(doc: DocPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.09, 0.09, 0.1);
  const muted = rgb(0.45, 0.45, 0.48);
  const accent = rgb(0.78, 0.6, 0.2);
  const left = 48;
  const right = 595.28 - 48;
  let y = 790;

  const text = (
    s: string,
    opts: { x?: number; size?: number; bold?: boolean; color?: any; alignRight?: boolean } = {},
  ) => {
    const size = opts.size ?? 10;
    const f = opts.bold ? bold : font;
    const x = opts.alignRight ? right - f.widthOfTextAtSize(s, size) : (opts.x ?? left);
    page.drawText(s, { x, y, size, font: f, color: opts.color ?? ink });
  };

  const rule = (color = rgb(0.86, 0.86, 0.88)) => {
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.7, color });
  };

  // Header
  text("C IMPERIUM BRANDING", { size: 18, bold: true });
  text(doc.kind.toUpperCase(), { size: 18, bold: true, color: accent, alignRight: true });
  y -= 16;
  text("Jos, Plateau State, Nigeria", { size: 9, color: muted });
  text(doc.number, { size: 11, bold: true, alignRight: true });
  y -= 12;
  text("cimperiumbranding.com", { size: 9, color: muted });
  y -= 18;
  rule(accent);
  y -= 26;

  // Parties
  text(doc.kind === "quote" ? "PREPARED FOR" : "BILLED TO", { size: 8, bold: true, color: muted });
  text(doc.dateLabel.toUpperCase(), { size: 8, bold: true, color: muted, alignRight: true });
  y -= 15;
  text(doc.party.name, { size: 12, bold: true });
  text(doc.dateValue, { size: 11, alignRight: true });
  y -= 14;
  for (const l of [doc.party.company, doc.party.email, doc.party.phone].filter(Boolean) as string[]) {
    text(l, { size: 9, color: muted });
    y -= 12;
  }
  y -= 14;

  // Items
  if (doc.lines.length) {
    text("ITEM", { size: 8, bold: true, color: muted });
    text("AMOUNT", { size: 8, bold: true, color: muted, alignRight: true });
    page.drawText("QTY", { x: 400, y, size: 8, font: bold, color: muted });
    y -= 8;
    rule();
    y -= 16;
    for (const l of doc.lines) {
      const title = l.title_snapshot.length > 52 ? `${l.title_snapshot.slice(0, 52)}…` : l.title_snapshot;
      text(title, { size: 10 });
      page.drawText(String(l.quantity), { x: 405, y, size: 10, font, color: ink });
      text(l.is_on_request ? "On request" : naira(l.line_total), { size: 10, alignRight: true });
      y -= 10;
      rule(rgb(0.93, 0.93, 0.94));
      y -= 16;
      if (y < 160) break;
    }
  }

  // Totals
  y -= 8;
  for (const t of doc.totals) {
    text(t.label, { size: t.strong ? 11 : 10, bold: t.strong, color: t.strong ? ink : muted });
    text(t.value, { size: t.strong ? 13 : 10, bold: t.strong, color: t.strong ? accent : ink, alignRight: true });
    y -= 18;
  }

  // Notes / footer
  y -= 10;
  rule();
  y -= 20;
  for (const n of doc.notes) {
    for (const chunk of wrap(n, 100)) {
      if (y < 50) break;
      text(chunk, { size: 8.5, color: muted });
      y -= 12;
    }
    y -= 4;
  }

  return pdf.save();
}

function wrap(s: string, max: number): string[] {
  const words = s.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      out.push(line.trim());
      line = w;
    } else {
      line = `${line} ${w}`;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

/** Build the PDF payload for a quote / invoice / receipt from its public token. */
export async function buildDocumentPdf(kind: "quote" | "invoice" | "receipt", tok: string) {
  const { loadQuoteByToken, loadInvoiceByToken, loadReceiptByToken, getBillingSettings } = await import(
    "./billing.server"
  );
  const settings = await getBillingSettings();

  if (kind === "quote") {
    const found = await loadQuoteByToken(tok);
    if (!found) return null;
    const { quote, items } = found;
    return {
      filename: `${quote.quote_number}.pdf`,
      bytes: await renderDocumentPdf({
        kind: "quote",
        number: quote.quote_number,
        dateLabel: "Valid until",
        dateValue: quote.valid_until ?? "—",
        party: quote,
        lines: items as any,
        totals: [{ label: "Quote total", value: naira(quote.total), strong: true }],
        notes: [
          quote.has_custom_items
            ? "Items priced on request are confirmed after your consultation and reflected on the invoice."
            : "",
          settings.terms,
          settings.invoice_footer,
        ].filter(Boolean),
      }),
    };
  }

  if (kind === "invoice") {
    const found = await loadInvoiceByToken(tok);
    if (!found) return null;
    const { invoice, items } = found;
    const balance = Math.max(0, invoice.total - invoice.amount_paid);
    return {
      filename: `${invoice.invoice_number}.pdf`,
      bytes: await renderDocumentPdf({
        kind: "invoice",
        number: invoice.invoice_number,
        dateLabel: "Due date",
        dateValue: invoice.due_date ?? "—",
        party: invoice,
        lines: items as any,
        totals: [
          { label: "Subtotal", value: naira(invoice.subtotal) },
          ...(invoice.discount > 0 ? [{ label: "Discount", value: `- ${naira(invoice.discount)}` }] : []),
          { label: "Total", value: naira(invoice.total), strong: true },
          { label: "Paid", value: naira(invoice.amount_paid) },
          { label: "Balance", value: naira(balance), strong: true },
        ],
        notes: [
          `Downpayment required before work begins: ${naira(invoice.deposit_amount)} (${invoice.deposit_percent}%).`,
          `Bank transfer — ${settings.account_name}, ${settings.bank_name || "(contact us)"}, ${settings.account_number || "(contact us)"}. Use ${invoice.invoice_number} as your reference.`,
          settings.terms,
          settings.invoice_footer,
        ].filter(Boolean),
      }),
    };
  }

  const found = await loadReceiptByToken(tok);
  if (!found) return null;
  const { receipt, invoice } = found;
  return {
    filename: `${receipt.receipt_number}.pdf`,
    bytes: await renderDocumentPdf({
      kind: "receipt",
      number: receipt.receipt_number,
      dateLabel: "Date",
      dateValue: new Date(receipt.created_at).toISOString().slice(0, 10),
      party: {
        name: invoice?.full_name ?? "Customer",
        company: invoice?.company ?? null,
        email: invoice?.email ?? null,
        phone: null,
      },
      lines: [],
      totals: [
        { label: "Amount received", value: naira(receipt.amount), strong: true },
        { label: "Payment method", value: String(receipt.method) },
        { label: "Invoice", value: invoice?.invoice_number ?? "—" },
        { label: "Outstanding balance", value: naira(receipt.balance_after), strong: true },
      ],
      notes: [
        receipt.balance_after === 0
          ? "Payment complete. We will contact you for delivery or pickup once your job is ready."
          : "Your job is in production. The remaining balance is due on delivery.",
        settings.invoice_footer,
      ].filter(Boolean),
    }),
  };
}
