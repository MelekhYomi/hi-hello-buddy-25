import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Paystack integration. Secrets stay server-side; the publishable key
// can live in site_settings so the admin can rotate without a deploy.

const initInput = z.object({
  orderId: z.string().uuid(),
  email: z.string().email(),
  amountNaira: z.number().int().positive().max(50_000_000),
  callbackUrl: z.string().url(),
});

const verifyInput = z.object({
  reference: z.string().min(4).max(200),
});

async function getMode(): Promise<"test" | "live"> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "paystack")
    .maybeSingle();
  const v = (data?.value as { mode?: string } | null) ?? null;
  return v?.mode === "live" ? "live" : "test";
}

function secretFor(mode: "test" | "live"): string {
  const key =
    mode === "live"
      ? process.env.PAYSTACK_SECRET_KEY_LIVE
      : process.env.PAYSTACK_SECRET_KEY_TEST;
  if (!key) throw new Error(`Paystack ${mode} secret key is not configured`);
  return key;
}

export const initPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => initInput.parse(d))
  .handler(async ({ data }) => {
    const mode = await getMode();
    const secret = secretFor(mode);

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amountNaira * 100, // kobo
        currency: "NGN",
        reference: `ci_${data.orderId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`,
        callback_url: data.callbackUrl,
        metadata: { order_id: data.orderId },
      }),
    });
    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!res.ok || !json.status || !json.data) {
      throw new Error(json.message ?? "Paystack init failed");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({
        payment_provider: "paystack",
        payment_ref: json.data.reference,
        payment_status: "awaiting_payment",
      })
      .eq("id", data.orderId);

    return {
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
      mode,
    };
  });

export const verifyPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => verifyInput.parse(d))
  .handler(async ({ data }) => {
    const mode = await getMode();
    const secret = secretFor(mode);

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const json = (await res.json()) as {
      status?: boolean;
      data?: {
        status: string;
        amount: number;
        currency: string;
        metadata?: { order_id?: string };
      };
    };
    if (!res.ok || !json.status || !json.data) {
      return { ok: false as const, status: "error" as const };
    }

    const paid = json.data.status === "success";
    const orderId = json.data.metadata?.order_id;

    if (paid && orderId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          payment_provider: "paystack",
          payment_ref: data.reference,
          status: "confirmed",
        })
        .eq("id", orderId);
    }

    return { ok: paid, status: json.data.status, orderId };
  });
