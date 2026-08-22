import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const itemSchema = z.object({
  type: z.enum(["service", "product"]),
  id: z.string().uuid(),
  quantity: z.number().int().min(1).max(999),
});

const submitSchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  preferred_contact: z.enum(["call", "whatsapp", "email"]),
  user_id: z.string().uuid().nullable().optional(),
});

const tokenSchema = z.object({ token: z.string().min(10).max(120) });

/** Recompute a quote total from live database prices (no record saved). */
export const previewQuote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ items: z.array(itemSchema).max(50) }).parse(d))
  .handler(async ({ data }) => {
    const { priceItems } = await import("./billing.server");
    return priceItems(data.items);
  });

/** Public: save a quote request and return its shareable reference. */
export const submitQuote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { createQuote } = await import("./billing.server");
    const { quote } = await createQuote({
      items: data.items,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
      preferred_contact: data.preferred_contact,
      user_id: data.user_id ?? null,
    });
    return {
      quoteNumber: quote.quote_number as string,
      token: quote.public_token as string,
      total: quote.total as number,
      validUntil: quote.valid_until as string | null,
    };
  });

/** Public: read a quote through its private link. */
export const getQuote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { loadQuoteByToken } = await import("./billing.server");
    return loadQuoteByToken(data.token);
  });

/** Public: accept a quote — creates the invoice and queues the email. */
export const proceedWithQuote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema
      .extend({
        payment_terms: z.enum(["deposit", "full"]).default("deposit"),
        preferred_contact: z.enum(["call", "whatsapp", "email"]).optional(),
        origin: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const {
      loadQuoteByToken,
      invoiceFromQuote,
      getBillingSettings,
      queueMessage,
      invoiceEmailBody,
    } = await import("./billing.server");
    const found = await loadQuoteByToken(data.token);
    if (!found) throw new Error("Quote not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.preferred_contact) {
      await supabaseAdmin
        .from("quotes")
        .update({ preferred_contact: data.preferred_contact })
        .eq("id", found.quote.id);
    }

    const invoice = await invoiceFromQuote(found.quote.id, { payment_terms: data.payment_terms });
    const settings = await getBillingSettings();

    const { data: existingMsg } = await supabaseAdmin
      .from("outbound_messages")
      .select("id")
      .eq("related_id", invoice.id)
      .eq("template", "invoice")
      .maybeSingle();

    if (!existingMsg) {
      await queueMessage({
        channel: "email",
        template: "invoice",
        to_address: invoice.email,
        subject: `Your invoice ${invoice.invoice_number} from C Imperium Branding`,
        body: invoiceEmailBody({
          invoice,
          items: found.items,
          origin: data.origin,
          settings,
          preferred_contact: data.preferred_contact ?? found.quote.preferred_contact,
        }),
        related_type: "invoice",
        related_id: invoice.id,
      });
    }

    return {
      invoiceNumber: invoice.invoice_number as string,
      token: invoice.public_token as string,
    };
  });

/** Public: read an invoice through its private link. */
export const getInvoice = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { loadInvoiceByToken } = await import("./billing.server");
    return loadInvoiceByToken(data.token);
  });

/** Public: read a receipt through its private link. */
export const getReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { loadReceiptByToken } = await import("./billing.server");
    return loadReceiptByToken(data.token);
  });

/** Public: start a Paystack payment for a deposit or the full balance. */
export const payInvoice = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema.extend({ kind: z.enum(["deposit", "balance", "full"]), origin: z.string().url() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { loadInvoiceByToken } = await import("./billing.server");
    const { getPaystackMode, paystackSecret } = await import("./paystack-core.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const found = await loadInvoiceByToken(data.token);
    if (!found) throw new Error("Invoice not found");
    const inv = found.invoice;
    const balance = Math.max(0, inv.total - inv.amount_paid);
    if (balance <= 0) throw new Error("This invoice is already paid in full");

    const amount =
      data.kind === "deposit"
        ? Math.min(balance, Math.max(1, inv.deposit_amount - inv.amount_paid) || balance)
        : balance;
    if (amount <= 0) throw new Error("Nothing left to pay for this option");

    const mode = await getPaystackMode();
    const secret = paystackSecret(mode);
    const reference = `ci_inv_${inv.invoice_number.replace(/[^A-Za-z0-9]/g, "")}_${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inv.email,
        amount: amount * 100,
        currency: "NGN",
        reference,
        callback_url: `${data.origin}/invoice/${inv.public_token}?ref=${reference}`,
        metadata: { invoice_id: inv.id, invoice_number: inv.invoice_number },
      }),
    });
    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!res.ok || !json.status || !json.data) throw new Error(json.message ?? "Paystack init failed");

    await supabaseAdmin.from("payments").insert({
      invoice_id: inv.id,
      amount,
      method: "paystack",
      kind: data.kind === "deposit" ? "deposit" : "balance",
      reference,
      status: "pending",
    });

    return { authorizationUrl: json.data.authorization_url, reference, amount, mode };
  });

/** Public: verify a Paystack return and issue the receipt. */
export const verifyInvoicePayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ reference: z.string().min(4).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { confirmPaystackPayment } = await import("./billing.server");
    const { getPaystackMode, paystackSecret } = await import("./paystack-core.server");
    const mode = await getPaystackMode();
    const secret = paystackSecret(mode);

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const json = (await res.json()) as {
      status?: boolean;
      data?: { status: string; amount: number };
    };
    if (!res.ok || !json.status || !json.data) return { ok: false as const };
    if (json.data.status !== "success") return { ok: false as const, status: json.data.status };

    const settled = await confirmPaystackPayment(data.reference, Math.round(json.data.amount / 100));
    return {
      ok: true as const,
      receiptNumber: settled?.receipt?.receipt_number ?? null,
      receiptToken: settled?.receipt?.public_token ?? null,
      balance: settled?.balance ?? 0,
    };
  });

/** Customer: notify the studio of a bank transfer awaiting confirmation. */
export const declareTransfer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema.extend({ amount: z.number().int().positive().max(500_000_000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { loadInvoiceByToken } = await import("./billing.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const found = await loadInvoiceByToken(data.token);
    if (!found) throw new Error("Invoice not found");
    await supabaseAdmin.from("payments").insert({
      invoice_id: found.invoice.id,
      amount: data.amount,
      method: "transfer",
      kind: "deposit",
      reference: `tr_${found.invoice.invoice_number}_${Date.now()}`,
      status: "pending",
    });
    return { ok: true };
  });

// ================= ADMIN =================

export const adminListBilling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [quotes, invoices, payments, receipts, messages] = await Promise.all([
      supabaseAdmin.from("quotes").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("invoices").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("receipts").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin
        .from("outbound_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      quotes: quotes.data ?? [],
      invoices: invoices.data ?? [],
      payments: payments.data ?? [],
      receipts: receipts.data ?? [],
      messages: messages.data ?? [],
    };
  });

export const adminQuoteItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ quoteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items } = await supabaseAdmin
      .from("quote_items")
      .select("*")
      .eq("quote_id", data.quoteId)
      .order("created_at");
    return items ?? [];
  });

export const adminUpdateQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        quoteId: z.string().uuid(),
        status: z.enum(["new", "discussing", "converted", "declined"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("quotes")
      .update({ status: data.status })
      .eq("id", data.quoteId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminConvertQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        quoteId: z.string().uuid(),
        payment_terms: z.enum(["deposit", "full"]).default("deposit"),
        origin: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff, invoiceFromQuote, getBillingSettings, queueMessage, invoiceEmailBody } =
      await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const invoice = await invoiceFromQuote(data.quoteId, { payment_terms: data.payment_terms });
    const { data: items } = await supabaseAdmin
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id);
    const settings = await getBillingSettings();
    const { data: quote } = await supabaseAdmin
      .from("quotes")
      .select("preferred_contact")
      .eq("id", data.quoteId)
      .maybeSingle();
    await queueMessage({
      channel: "email",
      template: "invoice",
      to_address: invoice.email,
      subject: `Your invoice ${invoice.invoice_number} from C Imperium Branding`,
      body: invoiceEmailBody({
        invoice,
        items: items ?? [],
        origin: data.origin,
        settings,
        preferred_contact: quote?.preferred_contact ?? "email",
      }),
      related_type: "invoice",
      related_id: invoice.id,
    });
    return { invoiceNumber: invoice.invoice_number, token: invoice.public_token };
  });

export const adminUpdateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        invoiceId: z.string().uuid(),
        discount: z.number().int().min(0).optional(),
        deposit_percent: z.number().int().min(0).max(100).optional(),
        due_date: z.string().max(20).optional(),
        status: z.enum(["draft", "sent", "partially_paid", "paid", "void"]).optional(),
        fulfilment_status: z
          .enum(["awaiting_payment", "in_production", "ready", "delivered"])
          .optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", data.invoiceId)
      .single();
    if (!inv) throw new Error("Invoice not found");

    const discount = data.discount ?? inv.discount;
    const total = Math.max(0, inv.subtotal - discount);
    const depositPercent = data.deposit_percent ?? inv.deposit_percent;

    const { error } = await supabaseAdmin
      .from("invoices")
      .update({
        discount,
        total,
        deposit_percent: depositPercent,
        deposit_amount: Math.round((total * depositPercent) / 100),
        ...(data.due_date ? { due_date: data.due_date } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.fulfilment_status ? { fulfilment_status: data.fulfilment_status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      })
      .eq("id", data.invoiceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRecordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        invoiceId: z.string().uuid(),
        amount: z.number().int().positive().max(500_000_000),
        method: z.enum(["transfer", "cash", "pos", "paystack"]),
        kind: z.enum(["deposit", "balance", "full"]).default("deposit"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff, settlePayment } = await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        invoice_id: data.invoiceId,
        amount: data.amount,
        method: data.method,
        kind: data.kind,
        reference: `man_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        recorded_by: context.userId,
      })
      .select("id")
      .single();
    if (error || !payment) throw new Error(error?.message ?? "Could not record the payment");
    const settled = await settlePayment(payment.id);
    return { receiptNumber: settled?.receipt?.receipt_number ?? null, balance: settled?.balance ?? 0 };
  });

export const adminConfirmPendingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertStaff, settlePayment } = await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("payments")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString(), recorded_by: context.userId })
      .eq("id", data.paymentId);
    const settled = await settlePayment(data.paymentId);
    return { receiptNumber: settled?.receipt?.receipt_number ?? null, balance: settled?.balance ?? 0 };
  });

export const adminResendDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ messageId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff, queueMessage } = await import("./billing.server");
    await assertStaff(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: msg } = await supabaseAdmin
      .from("outbound_messages")
      .select("*")
      .eq("id", data.messageId)
      .single();
    if (!msg) throw new Error("Message not found");
    const sent = await queueMessage({
      channel: "email",
      template: msg.template,
      to_address: msg.to_address,
      subject: msg.subject ?? undefined,
      body: msg.body,
      related_type: msg.related_type ?? undefined,
      related_id: msg.related_id ?? undefined,
    });
    return { sent: sent.ok, error: sent.ok ? null : sent.error };
  });
