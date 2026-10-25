// Server-only billing logic: quotes -> invoices -> payments -> receipts.
import type { SupabaseClient } from "@supabase/supabase-js";

export type ItemInput = { type: "service" | "product"; id: string; quantity: number };

export type LineRow = {
  item_type: "service" | "product";
  ref_id: string;
  title_snapshot: string;
  description_snapshot: string | null;
  unit_price: number;
  quantity: number;
  is_on_request: boolean;
  line_total: number;
};

export type BillingSettings = {
  deposit_percent: number;
  quote_validity_days: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  invoice_footer: string;
  terms: string;
};

const DEFAULT_BILLING: BillingSettings = {
  deposit_percent: 50,
  quote_validity_days: 14,
  bank_name: "",
  account_name: "C Imperium Branding",
  account_number: "",
  invoice_footer: "Thank you for choosing C Imperium Branding.",
  terms: "Work commences after the agreed downpayment is confirmed. Balance is due on delivery.",
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as SupabaseClient<any>;
}

export function token(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getBillingSettings(): Promise<BillingSettings> {
  const db = await admin();
  const { data } = await db.from("site_settings").select("value").eq("key", "billing").maybeSingle();
  return { ...DEFAULT_BILLING, ...((data?.value as Partial<BillingSettings> | null) ?? {}) };
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await admin();
  const { data } = await db.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? null;
}

/** Re-price the requested items from the database. Never trust client prices. */
export async function priceItems(items: ItemInput[]) {
  const db = await admin();
  const serviceIds = items.filter((i) => i.type === "service").map((i) => i.id);
  const productIds = items.filter((i) => i.type === "product").map((i) => i.id);

  const [{ data: services }, { data: products }] = await Promise.all([
    serviceIds.length
      ? db.from("services").select("id,title,description,price_min").in("id", serviceIds).eq("is_active", true)
      : Promise.resolve({ data: [] as any[] }),
    productIds.length
      ? db.from("products").select("id,title,description,price").in("id", productIds).eq("is_active", true)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const lines: LineRow[] = items.flatMap((i): LineRow[] => {
    const qty = Math.max(1, Math.min(999, Math.round(i.quantity || 1)));
    if (i.type === "service") {
      const s = (services ?? []).find((x: any) => x.id === i.id);
      if (!s) return [];
      // Services are never pre-priced. The client requests a quote and an
      // admin sets the figure per line before it is sent back.
      return [
        {
          item_type: "service",
          ref_id: s.id as string,
          title_snapshot: s.title as string,
          description_snapshot: (s.description as string) ?? null,
          unit_price: 0,
          quantity: qty,
          is_on_request: true,
          line_total: 0,
        },
      ];
    }
    const p = (products ?? []).find((x: any) => x.id === i.id);
    if (!p) return [];
    const unit = (p.price as number) ?? 0;
    return [
      {
        item_type: "product",
        ref_id: p.id as string,
        title_snapshot: p.title as string,
        description_snapshot: (p.description as string) ?? null,
        unit_price: unit,
        quantity: qty,
        is_on_request: false,
        line_total: unit * qty,
      },
    ];
  });

  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  return { lines, subtotal, hasOnRequest: lines.some((l) => l.is_on_request) };
}

export async function nextNumber(prefix: "Q" | "INV" | "RCP") {
  const db = await admin();
  const { data, error } = await db.rpc("next_document_number", { _prefix: prefix });
  if (error || !data) throw new Error(error?.message ?? "Could not generate a document number");
  return data as string;
}

export async function createQuote(input: {
  items: ItemInput[];
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  preferred_contact: "call" | "whatsapp" | "email";
  user_id?: string | null;
  draft_key?: string | null;
}) {
  const db = await admin();
  const { lines, subtotal, hasOnRequest } = await priceItems(input.items);
  if (!lines.length) throw new Error("No valid services or products were selected");

  const settings = await getBillingSettings();
  const quote_number = await nextNumber("Q");
  const validUntil = new Date(Date.now() + settings.quote_validity_days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  // If this browser already has a recorded draft, promote that row instead of
  // creating a duplicate. Every add/remove/quantity change was saved there.
  // Drafts are keyed by quote_number so this works on the original schema too.
  let draft: any = null;
  if (input.draft_key) {
    const { data } = await db
      .from("quotes")
      .select("*")
      .eq("quote_number", draftNumber(input.draft_key))
      .maybeSingle();
    if (data && data.status === "draft") draft = data;
  }

  let quote: any;
  if (draft) {
    const { data: updated, error } = await db
      .from("quotes")
      .update({
        quote_number,
        user_id: input.user_id ?? draft.user_id ?? null,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company ?? null,
        notes: input.notes ?? null,
        preferred_contact: input.preferred_contact,
        subtotal,
        total: subtotal,
        has_custom_items: hasOnRequest,
        valid_until: validUntil,
        status: "new",
      })
      .eq("id", draft.id)
      .select("*")
      .single();
    if (error || !updated) throw new Error(error?.message ?? "Could not save the quote");
    quote = updated;
    await db.from("quote_items").delete().eq("quote_id", quote.id);
  } else {
    const { data: inserted, error } = await db
      .from("quotes")
      .insert({
        quote_number,
        public_token: token(),
        user_id: input.user_id ?? null,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company ?? null,
        notes: input.notes ?? null,
        preferred_contact: input.preferred_contact,
        subtotal,
        total: subtotal,
        has_custom_items: hasOnRequest,
        valid_until: validUntil,
        status: "new",
      })
      .select("*")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Could not save the quote");
    quote = inserted;
  }

  const { error: itemsErr } = await db
    .from("quote_items")
    .insert(lines.map((l) => ({ ...l, quote_id: quote.id })));
  if (itemsErr) throw new Error(itemsErr.message);

  return { quote, items: lines };
}

/** Drafts reuse the unique quote_number as their lookup key. */
const draftNumber = (draftKey: string) => `DRAFT-${draftKey}`;

/**
 * Records (or refreshes) an unfinished selection. Called on every add, remove
 * and quantity change, so a request reaches the backend even if the client
 * never submits it.
 */
export async function upsertDraft(input: { draft_key: string; items: ItemInput[] }) {
  const db = await admin();
  const { lines, subtotal, hasOnRequest } = await priceItems(input.items);
  const number = draftNumber(input.draft_key);

  const { data: existing } = await db
    .from("quotes")
    .select("*")
    .eq("quote_number", number)
    .maybeSingle();

  if (existing) {
    // Never overwrite a request the client already submitted.
    if (existing.status !== "draft") return { quote: existing, items: [], locked: true };
    await db.from("quote_items").delete().eq("quote_id", existing.id);
    if (lines.length) {
      const { error } = await db
        .from("quote_items")
        .insert(lines.map((l) => ({ ...l, quote_id: existing.id })));
      if (error) throw new Error(error.message);
    }
    const { data: updated } = await db
      .from("quotes")
      .update({
        subtotal,
        total: subtotal,
        has_custom_items: hasOnRequest,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    return { quote: updated ?? existing, items: lines, locked: false };
  }

  if (!lines.length) return { quote: null, items: [], locked: false };

  const { data: created, error } = await db
    .from("quotes")
    .insert({
      // Placeholder number; a real CI-Q- number is issued on submit.
      quote_number: number,
      public_token: token(),
      full_name: "Website visitor",
      email: "",
      preferred_contact: "whatsapp",
      subtotal,
      total: subtotal,
      has_custom_items: hasOnRequest,
      status: "draft",
    })
    .select("*")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not record the draft");

  const { error: itemsErr } = await db
    .from("quote_items")
    .insert(lines.map((l) => ({ ...l, quote_id: created.id })));
  if (itemsErr) throw new Error(itemsErr.message);

  return { quote: created, items: lines, locked: false };
}

/** Links a recorded draft to the account that just signed in. */
export async function claimDraft(draftKey: string, userId: string) {
  const db = await admin();
  const { data: quote } = await db
    .from("quotes")
    .select("*")
    .eq("quote_number", draftNumber(draftKey))
    .maybeSingle();
  if (!quote) return null;
  if (!quote.user_id) {
    await db.from("quotes").update({ user_id: userId }).eq("id", quote.id);
    quote.user_id = userId;
  }
  const { data: items } = await db
    .from("quote_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("created_at");
  return { quote, items: items ?? [] };
}

/** A client's own quotes, newest first. */
export async function listQuotesForUser(userId: string) {
  const db = await admin();
  const { data: quotes } = await db
    .from("quotes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!quotes?.length) return [];
  const { data: items } = await db
    .from("quote_items")
    .select("*")
    .in("quote_id", quotes.map((q: any) => q.id));
  return quotes.map((q: any) => ({
    ...q,
    items: (items ?? []).filter((i: any) => i.quote_id === q.id),
  }));
}

/** Admin: set the price of each line, then recompute the quote total. */
export async function priceQuoteItems(input: {
  quote_id: string;
  items: { id: string; unit_price: number; on_request?: boolean; price_note?: string | null }[];
  admin_note?: string | null;
  priced_by: string;
}) {
  const db = await admin();
  const { data: quote } = await db.from("quotes").select("*").eq("id", input.quote_id).single();
  if (!quote) throw new Error("Quote not found");

  for (const line of input.items) {
    const unit = Math.max(0, Math.round(line.unit_price || 0));
    const onRequest = !!line.on_request;
    const { data: row } = await db
      .from("quote_items")
      .select("quantity")
      .eq("id", line.id)
      .eq("quote_id", quote.id)
      .maybeSingle();
    if (!row) continue;
    const { error } = await db
      .from("quote_items")
      .update({
        unit_price: onRequest ? 0 : unit,
        is_on_request: onRequest,
        line_total: onRequest ? 0 : unit * row.quantity,
        price_note: line.price_note?.trim() ? line.price_note.trim() : null,
      })
      .eq("id", line.id);
    if (error) {
      // price_note is a newer column; still save the figure if it is missing.
      if (isMissingColumn(error)) {
        const { error: retry } = await db
          .from("quote_items")
          .update({
            unit_price: onRequest ? 0 : unit,
            is_on_request: onRequest,
            line_total: onRequest ? 0 : unit * row.quantity,
          })
          .eq("id", line.id);
        if (retry) throw new Error(retry.message);
      } else {
        throw new Error(error.message);
      }
    }
  }

  const { data: items } = await db.from("quote_items").select("*").eq("quote_id", quote.id);
  const subtotal = (items ?? []).reduce((s: number, l: any) => s + (l.line_total ?? 0), 0);
  const stillOnRequest = (items ?? []).some((l: any) => l.is_on_request);
  const base = { subtotal, total: subtotal, has_custom_items: stillOnRequest, status: "priced" };
  const full = {
    ...base,
    priced_at: new Date().toISOString(),
    priced_by: input.priced_by,
    admin_note: input.admin_note?.trim() ? input.admin_note.trim() : null,
  };

  let { data: updated, error } = await db
    .from("quotes")
    .update(full)
    .eq("id", quote.id)
    .select("*")
    .single();
  if (error && isMissingColumn(error)) {
    ({ data: updated, error } = await db
      .from("quotes")
      .update(base)
      .eq("id", quote.id)
      .select("*")
      .single());
  }
  if (error) throw new Error(error.message);

  return { quote: updated, items: items ?? [], subtotal, hasOnRequest: stillOnRequest };
}

/** PostgREST reports an unknown column as 42703 / PGRST204. */
function isMissingColumn(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /column .* does not exist|Could not find the '.*' column/i.test(error.message ?? "")
  );
}

/** Admin: send the priced quote back by email and WhatsApp. */
export async function sendPricedQuote(quoteId: string, origin: string) {
  const db = await admin();
  const { data: quote } = await db.from("quotes").select("*").eq("id", quoteId).single();
  if (!quote) throw new Error("Quote not found");
  const { data: items } = await db.from("quote_items").select("*").eq("quote_id", quoteId);
  const settings = await getBillingSettings();
  const link = `${origin}/quote/${quote.public_token}`;

  const email = quoteEmailBody({ quote, items: items ?? [], link, settings });
  const emailRes = quote.email
    ? await queueMessage({
        channel: "email",
        template: "quote_reply",
        to_address: quote.email,
        subject: `Your quote ${quote.quote_number} from C Imperium Branding`,
        body: email,
        related_type: "quote",
        related_id: quote.id,
      })
    : { ok: false as const, error: "No email on file" };

  let waOk = false;
  if (quote.phone) {
    const wa = await queueMessage({
      channel: "whatsapp",
      template: "quote_reply",
      to_address: quote.phone,
      subject: `Quote ${quote.quote_number}`,
      body: quoteWhatsAppBody({ quote, items: items ?? [], link }),
      related_type: "quote",
      related_id: quote.id,
    });
    waOk = wa.ok;
  }

  await db.from("quotes").update({ status: "discussing" }).eq("id", quote.id);

  return { email: emailRes.ok, whatsapp: waOk, link };
}


export async function loadQuoteByToken(tok: string) {
  const db = await admin();
  const { data: quote } = await db.from("quotes").select("*").eq("public_token", tok).maybeSingle();
  if (!quote) return null;
  const { data: items } = await db
    .from("quote_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("created_at");
  const { data: invoice } = await db
    .from("invoices")
    .select("invoice_number, public_token")
    .eq("quote_id", quote.id)
    .maybeSingle();
  return { quote, items: items ?? [], invoice: invoice ?? null };
}

export async function invoiceFromQuote(quoteId: string, opts?: { payment_terms?: "deposit" | "full" }) {
  const db = await admin();
  const { data: existing } = await db
    .from("invoices")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (existing) return existing;

  const { data: quote } = await db.from("quotes").select("*").eq("id", quoteId).single();
  const { data: qItems } = await db.from("quote_items").select("*").eq("quote_id", quoteId);
  // Never raise an invoice for work that has not been priced yet.
  if ((qItems ?? []).some((l: any) => l.is_on_request)) {
    throw new Error(
      "Some lines are still priced on request. Set a price for every line before raising the invoice.",
    );
  }
  const settings = await getBillingSettings();

  const subtotal = (qItems ?? []).reduce((s: number, l: any) => s + l.line_total, 0);
  const terms = opts?.payment_terms ?? "deposit";
  const depositPercent = terms === "full" ? 100 : settings.deposit_percent;
  const depositAmount = Math.round((subtotal * depositPercent) / 100);

  const invoice_number = await nextNumber("INV");
  const { data: invoice, error } = await db
    .from("invoices")
    .insert({
      invoice_number,
      public_token: token(),
      quote_id: quoteId,
      user_id: quote.user_id,
      full_name: quote.full_name,
      email: quote.email,
      phone: quote.phone,
      company: quote.company,
      notes: quote.notes,
      subtotal,
      total: subtotal,
      deposit_percent: depositPercent,
      deposit_amount: depositAmount,
      payment_terms: terms,
      due_date: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
    })
    .select("*")
    .single();
  if (error || !invoice) throw new Error(error?.message ?? "Could not create the invoice");

  if (qItems?.length) {
    await db.from("invoice_items").insert(
      qItems.map((l: any) => ({
        invoice_id: invoice.id,
        item_type: l.item_type,
        ref_id: l.ref_id,
        title_snapshot: l.title_snapshot,
        description_snapshot: l.description_snapshot,
        unit_price: l.unit_price,
        quantity: l.quantity,
        is_on_request: l.is_on_request,
        line_total: l.line_total,
      })),
    );
  }

  await db.from("quotes").update({ status: "converted" }).eq("id", quoteId);
  return invoice;
}

export async function loadInvoiceByToken(tok: string) {
  const db = await admin();
  const { data: invoice } = await db.from("invoices").select("*").eq("public_token", tok).maybeSingle();
  if (!invoice) return null;
  const [{ data: items }, { data: payments }, { data: receipts }] = await Promise.all([
    db.from("invoice_items").select("*").eq("invoice_id", invoice.id).order("created_at"),
    db.from("payments").select("*").eq("invoice_id", invoice.id).order("created_at"),
    db.from("receipts").select("*").eq("invoice_id", invoice.id).order("created_at"),
  ]);
  const settings = await getBillingSettings();
  return {
    invoice,
    items: items ?? [],
    payments: payments ?? [],
    receipts: receipts ?? [],
    settings: {
      bank_name: settings.bank_name,
      account_name: settings.account_name,
      account_number: settings.account_number,
      invoice_footer: settings.invoice_footer,
      terms: settings.terms,
    },
  };
}

export async function loadReceiptByToken(tok: string) {
  const db = await admin();
  const { data: receipt } = await db.from("receipts").select("*").eq("public_token", tok).maybeSingle();
  if (!receipt) return null;
  const { data: invoice } = await db
    .from("invoices")
    .select("invoice_number, full_name, email, phone, company, total, amount_paid, public_token")
    .eq("id", receipt.invoice_id)
    .maybeSingle();
  const settings = await getBillingSettings();
  return { receipt, invoice, footer: settings.invoice_footer };
}

/** Recalculate paid/balance/status and issue a receipt for a confirmed payment. Idempotent. */
export async function settlePayment(paymentId: string) {
  const db = await admin();
  const { data: payment } = await db.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (!payment || payment.status !== "confirmed") return null;

  const { data: existingReceipt } = await db
    .from("receipts")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  const { data: confirmed } = await db
    .from("payments")
    .select("amount")
    .eq("invoice_id", payment.invoice_id)
    .eq("status", "confirmed");
  const amountPaid = (confirmed ?? []).reduce((s: number, p: any) => s + p.amount, 0);

  const { data: invoice } = await db
    .from("invoices")
    .select("*")
    .eq("id", payment.invoice_id)
    .single();
  const balance = Math.max(0, invoice.total - amountPaid);

  await db
    .from("invoices")
    .update({
      amount_paid: amountPaid,
      status: balance === 0 ? "paid" : amountPaid > 0 ? "partially_paid" : invoice.status,
      fulfilment_status:
        invoice.fulfilment_status === "awaiting_payment" && amountPaid > 0
          ? "in_production"
          : invoice.fulfilment_status,
    })
    .eq("id", invoice.id);

  if (existingReceipt) return { receipt: existingReceipt, invoice, balance };

  const receipt_number = await nextNumber("RCP");
  const { data: receipt } = await db
    .from("receipts")
    .insert({
      receipt_number,
      public_token: token(),
      invoice_id: invoice.id,
      payment_id: paymentId,
      amount: payment.amount,
      balance_after: balance,
      method: payment.method,
    })
    .select("*")
    .single();

  await queueMessage({
    channel: "email",
    template: "receipt",
    to_address: invoice.email,
    subject: `Payment received — receipt ${receipt.receipt_number} (${invoice.invoice_number})`,
    body: receiptEmailBody({ invoice, receipt, balance }),
    related_type: "receipt",
    related_id: receipt.id,
  });

  // WhatsApp copy of the receipt, ready for one-tap sending from the admin workflow board.
  if (invoice.phone) {
    await db.from("outbound_messages").insert({
      channel: "whatsapp",
      template: "receipt",
      to_address: invoice.phone,
      subject: `Receipt ${receipt.receipt_number}`,
      body: receiptWhatsAppBody({ invoice, receipt, balance }),
      related_type: "receipt",
      related_id: receipt.id,
      status: "queued",
    });
  }

  return { receipt, invoice, balance };
}

export async function confirmPaystackPayment(reference: string, amountNaira?: number) {
  const db = await admin();
  const { data: payment } = await db
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) return null;
  if (payment.status !== "confirmed") {
    await db
      .from("payments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        ...(amountNaira ? { amount: amountNaira } : {}),
      })
      .eq("id", payment.id);
  }
  return settlePayment(payment.id);
}

// ---------- messaging ----------

const cleanPhone = (raw: string) => {
  const digits = (raw ?? "").replace(/[^0-9]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
};

/** Sends through Termii's WhatsApp channel when it is enabled. */
async function trySendWhatsApp(msg: { to_address: string; body: string }) {
  const cfg = await getSetting<{ enabled?: boolean; whatsapp?: boolean; sender_id?: string }>("termii");
  const apiKey = typeof process !== "undefined" ? process.env["TERMII_API_KEY"] : undefined;
  if (!cfg?.enabled || !cfg?.whatsapp || !apiKey) {
    return { ok: false as const, error: "Termii WhatsApp not configured" };
  }
  const to = cleanPhone(msg.to_address);
  if (!to) return { ok: false as const, error: "No valid WhatsApp number" };
  try {
    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        to,
        from: cfg.sender_id || "CImperium",
        sms: msg.body,
        type: "plain",
        channel: "whatsapp",
      }),
    });
    if (!res.ok) return { ok: false as const, error: `Termii ${res.status}` };
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "send failed" };
  }
}

export async function queueMessage(msg: {
  channel: "email" | "whatsapp";
  template: string;
  to_address: string;
  subject?: string;
  body: string;
  related_type?: string;
  related_id?: string;
}) {
  const db = await admin();
  const sent =
    msg.channel === "whatsapp"
      ? await trySendWhatsApp(msg)
      : await trySendEmail(msg);
  await db.from("outbound_messages").insert({
    channel: msg.channel,
    template: msg.template,
    to_address: msg.to_address,
    subject: msg.subject ?? null,
    body: msg.body,
    related_type: msg.related_type ?? null,
    related_id: msg.related_id ?? null,
    status: sent.ok ? "sent" : "queued",
    error: sent.ok ? null : sent.error,
    sent_at: sent.ok ? new Date().toISOString() : null,
  });
  return sent;
}

/**
 * Tells the studio a quote request has landed: WhatsApp first (the number in
 * site_settings.whatsapp_number unless quote_notifications overrides it),
 * then email. Every attempt is written to outbound_messages so nothing is lost
 * when a channel is not configured yet.
 */
export async function notifyQuoteRequest(args: {
  quote: any;
  items: any[];
  origin: string;
}) {
  const { quote, items, origin } = args;
  const settings = await getSetting<{
    whatsapp_numbers?: string[];
    emails?: string[];
  }>("quote_notifications");
  const site = await getSetting<string>("whatsapp_number");
  const contactEmail = await getSetting<string>("contact_email");

  const numbers = (
    settings?.whatsapp_numbers?.length
      ? settings.whatsapp_numbers
      : [site ?? process.env["QUOTE_NOTIFY_WHATSAPP"] ?? ""]
  ).filter(Boolean);

  const emails = (settings?.emails?.length ? settings.emails : [contactEmail ?? ""]).filter(Boolean);

  const lines = (items ?? [])
    .map(
      (l: any) =>
        `• ${l.title_snapshot} x${l.quantity} — ${l.is_on_request ? "price on request" : naira(l.line_total)}`,
    )
    .join("\n");

  const body = `C IMPERIUM — new quote request

${quote.quote_number}
${quote.full_name}${quote.company ? ` (${quote.company})` : ""}
Email: ${quote.email || "—"}
WhatsApp: ${quote.phone || "—"}
Prefers: ${quote.preferred_contact}

ITEMS
${lines}

BRIEF
${quote.notes || "(none provided)"}

Price the lines and reply here:
${origin}/dashboard?tab=billing

Reply to the client: ${quote.phone ? `https://wa.me/${cleanPhone(quote.phone)}` : "no number on file"}`;

  const results: { channel: string; to: string; ok: boolean; error?: string }[] = [];

  for (const to of numbers) {
    const r = await queueMessage({
      channel: "whatsapp",
      template: "quote_request",
      to_address: to,
      subject: `New quote request ${quote.quote_number}`,
      body,
      related_type: "quote",
      related_id: quote.id,
    });
    results.push({ channel: "whatsapp", to, ok: r.ok, error: r.ok ? undefined : r.error });
  }

  for (const to of emails) {
    const r = await queueMessage({
      channel: "email",
      template: "quote_request",
      to_address: to,
      subject: `New quote request ${quote.quote_number} — ${quote.full_name}`,
      body,
      related_type: "quote",
      related_id: quote.id,
    });
    results.push({ channel: "email", to, ok: r.ok, error: r.ok ? undefined : r.error });
  }

  // Acknowledgement to the client, so they know it landed.
  if (quote.email) {
    await queueMessage({
      channel: "email",
      template: "quote_received",
      to_address: quote.email,
      subject: `We have your request — ${quote.quote_number}`,
      body: quoteReceivedEmailBody({ quote, items: items ?? [], origin }),
      related_type: "quote",
      related_id: quote.id,
    });
  }

  const firstNumber = numbers[0] ? cleanPhone(numbers[0]) : "";
  return {
    results,
    waLink: firstNumber
      ? `https://wa.me/${firstNumber}?text=${encodeURIComponent(body)}`
      : null,
  };
}


/**
 * Sends through Resend when a verified sender domain is configured.
 * Without one, the message stays queued (visible in the admin message log)
 * so nothing is silently lost.
 */
async function trySendEmail(msg: { channel: string; to_address: string; subject?: string; body: string }) {
  if (msg.channel !== "email") return { ok: false as const, error: "non-email channel" };
  const cfEnv = typeof globalThis !== "undefined" ? (globalThis as any)._cf_env : undefined;
  const apiKey =
    cfEnv?.RESEND_API_KEY || (typeof process !== "undefined" ? process.env["RESEND_API_KEY"] : undefined);
  const from = await getSetting<{ from_email?: string }>("email");
  if (!apiKey || !from?.from_email) {
    return { ok: false as const, error: "No verified sender domain configured yet" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from.from_email,
        to: [msg.to_address],
        subject: msg.subject ?? "C Imperium Branding",
        text: msg.body,
      }),
    });
    if (!res.ok) return { ok: false as const, error: `Resend ${res.status}` };
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "send failed" };
  }
}

const naira = (n: number) => `NGN ${n.toLocaleString("en-NG")}`;

export function invoiceEmailBody(args: {
  invoice: any;
  items: any[];
  origin: string;
  settings: BillingSettings;
  preferred_contact: string;
}) {
  const { invoice, items, origin, settings, preferred_contact } = args;
  const lines = items
    .map((l) => `  • ${l.title_snapshot} x${l.quantity} — ${l.is_on_request ? "on request" : naira(l.line_total)}`)
    .join("\n");
  const contactNote =
    preferred_contact === "call"
      ? "One of our representatives will call you shortly to discuss the details."
      : preferred_contact === "whatsapp"
        ? "One of our representatives will message you on WhatsApp shortly to discuss the details."
        : "One of our representatives will reply to this email shortly to discuss the details.";
  return `Hello ${invoice.full_name},

Thank you for choosing C Imperium Branding. Your invoice ${invoice.invoice_number} is ready.

ITEMS
${lines}

Total: ${naira(invoice.total)}
Downpayment required before work begins: ${naira(invoice.deposit_amount)} (${invoice.deposit_percent}%)
Due date: ${invoice.due_date}

View and pay online: ${origin}/invoice/${invoice.public_token}

BANK TRANSFER
  Account name: ${settings.account_name}
  Bank: ${settings.bank_name || "(contact us)"}
  Account number: ${settings.account_number || "(contact us)"}

${contactNote}
You can also reach the studio any time — Jos, Plateau State, Nigeria.

TERMS
${settings.terms}

${settings.invoice_footer}`;
}

export function receiptEmailBody(args: { invoice: any; receipt: any; balance: number }) {
  const { invoice, receipt, balance } = args;
  return `Hello ${invoice.full_name},

We have received your payment of ${naira(receipt.amount)} for invoice ${invoice.invoice_number}.

Receipt number: ${receipt.receipt_number}
Amount paid to date: ${naira(invoice.total - balance)}
Outstanding balance: ${naira(balance)}

${balance === 0 ? "Your payment is complete. We are starting on your job and will contact you for delivery or pickup once it is ready." : "Your job is now in production. The balance is due on delivery."}

Thank you for choosing C Imperium Branding.`;
}

export function quoteReceivedEmailBody(args: { quote: any; items: any[]; origin: string }) {
  const { quote, items, origin } = args;
  const lines = items
    .map((l) => `  • ${l.title_snapshot} x${l.quantity}`)
    .join("\n");
  return `Hello ${quote.full_name},

Thank you — we have your quote request ${quote.quote_number}.

WHAT YOU ASKED FOR
${lines}

${quote.notes ? `YOUR BRIEF\n${quote.notes}\n\n` : ""}Every line is priced by hand, so there is no automatic total. A member of the team will review it and send itemised prices back to you on WhatsApp${quote.email ? " and by email" : ""} — usually within one business day.

You can follow it any time here: ${origin}/quote/${quote.public_token}

If anything changes, just reply to this email or message the studio on WhatsApp.

C Imperium Branding & Productions`;
}

export function quoteEmailBody(args: {
  quote: any;
  items: any[];
  link: string;
  settings: BillingSettings;
}) {
  const { quote, items, link, settings } = args;
  const lines = items
    .map(
      (l) =>
        `  • ${l.title_snapshot} x${l.quantity} — ${
          l.is_on_request ? "on request" : naira(l.line_total)
        }${l.price_note ? ` (${l.price_note})` : ""}`,
    )
    .join("\n");
  const total = items.some((l) => l.is_on_request)
    ? "Some lines are still on request — we will confirm those with you."
    : `Total: ${naira(quote.total)}`;
  return `Hello ${quote.full_name},

Your quote ${quote.quote_number} is ready.

ITEMS
${lines}

${total}
${quote.admin_note ? `\nNOTE FROM THE TEAM\n${quote.admin_note}\n` : ""}
View it online: ${link}

Happy with it? Reply to this email or message us on WhatsApp and we will raise the invoice and start.

TERMS
${settings.terms}

${settings.invoice_footer}`;
}

export function quoteWhatsAppBody(args: { quote: any; items: any[]; link: string }) {
  const { quote, items, link } = args;
  const lines = items
    .map(
      (l) =>
        `• ${l.title_snapshot} x${l.quantity} — ${
          l.is_on_request ? "on request" : naira(l.line_total)
        }`,
    )
    .join("\n");
  const total = items.some((l) => l.is_on_request)
    ? "Some lines are still on request."
    : `Total: ${naira(quote.total)}`;
  return `C IMPERIUM — quote ${quote.quote_number}

Hello ${quote.full_name}, here is your itemised quote:

${lines}

${total}
${quote.admin_note ? `\n${quote.admin_note}\n` : ""}
View it here: ${link}

Reply here if you would like us to start.`;
}

export async function assertStaff(supabase: SupabaseClient<any>, userId: string) {
  for (const role of ["admin", "super_admin", "staff"]) {
    const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
    if (data) return role;
  }
  throw new Error("Forbidden");
}

export function receiptWhatsAppBody(args: { invoice: any; receipt: any; balance: number }) {
  const { invoice, receipt, balance } = args;
  return `C IMPERIUM BRANDING — payment received ✅

Hello ${invoice.full_name}, we've received ${naira(receipt.amount)} for invoice ${invoice.invoice_number}.
Receipt: ${receipt.receipt_number}
Outstanding balance: ${naira(balance)}

${balance === 0 ? "Payment complete. We'll contact you for delivery or pickup once your job is ready." : "Your job is now in production. The balance is due on delivery."}

Thank you for choosing C Imperium Branding.`;
}
