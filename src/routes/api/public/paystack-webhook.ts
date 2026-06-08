import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Paystack signs webhook payloads with HMAC-SHA512 using your secret key.
// We accept both the dedicated webhook secret and the live/test secret keys.

function verify(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const candidates = [
    process.env.PAYSTACK_WEBHOOK_SECRET,
    process.env.PAYSTACK_SECRET_KEY_LIVE,
    process.env.PAYSTACK_SECRET_KEY_TEST,
  ].filter((v): v is string => !!v);

  const sig = Buffer.from(signature, "hex");
  for (const key of candidates) {
    const expected = Buffer.from(
      createHmac("sha512", key).update(rawBody).digest("hex"),
      "hex",
    );
    if (sig.length === expected.length && timingSafeEqual(sig, expected)) {
      return true;
    }
  }
  return false;
}

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const sig = request.headers.get("x-paystack-signature");
        if (!verify(raw, sig)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: {
          event?: string;
          data?: {
            reference?: string;
            status?: string;
            metadata?: { order_id?: string };
          };
        };
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        if (payload.event === "charge.success" && payload.data?.status === "success") {
          const orderId = payload.data.metadata?.order_id;
          const reference = payload.data.reference;
          if (orderId && reference) {
            const { supabaseAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            await supabaseAdmin
              .from("orders")
              .update({
                payment_status: "paid",
                payment_provider: "paystack",
                payment_ref: reference,
                status: "confirmed",
              })
              .eq("id", orderId);
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
