import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Termii OTP — https://developers.termii.com/token
// Reads channel toggles from site_settings.termii = {enabled, whatsapp, sms, sender_id}

const cleanPhone = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
};

async function getTermiiConfig() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "termii")
    .maybeSingle();
  const v = (data?.value as { enabled?: boolean; whatsapp?: boolean; sms?: boolean; sender_id?: string } | null) ?? {};
  const apiKey = process.env.TERMII_API_KEY;
  return {
    enabled: !!v.enabled && !!apiKey,
    channel: v.whatsapp ? "whatsapp" : v.sms ? "generic" : "generic",
    sender: v.sender_id || "CImperium",
    apiKey,
  };
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ phone: z.string().min(6).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const cfg = await getTermiiConfig();
    if (!cfg.enabled || !cfg.apiKey) {
      return { ok: false as const, reason: "termii_disabled" as const };
    }
    const to = cleanPhone(data.phone);
    const res = await fetch("https://api.ng.termii.com/api/sms/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: cfg.apiKey,
        message_type: "NUMERIC",
        to,
        from: cfg.sender,
        channel: cfg.channel,
        pin_attempts: 5,
        pin_time_to_live: 10,
        pin_length: 6,
        pin_placeholder: "< 1234 >",
        message_text: "Your C Imperium verification code is < 1234 >. Valid for 10 minutes.",
        pin_type: "NUMERIC",
      }),
    });
    const json = (await res.json()) as { pinId?: string; message?: string };
    if (!res.ok || !json.pinId) {
      return { ok: false as const, reason: (json.message ?? "termii_error") as string };
    }
    return { ok: true as const, pinId: json.pinId };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ pinId: z.string().min(4), pin: z.string().regex(/^\d{4,8}$/), phone: z.string().min(6).max(20) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const cfg = await getTermiiConfig();
    if (!cfg.enabled || !cfg.apiKey) return { ok: false as const, reason: "termii_disabled" as const };
    const res = await fetch("https://api.ng.termii.com/api/sms/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: cfg.apiKey, pin_id: data.pinId, pin: data.pin }),
    });
    const json = (await res.json()) as { verified?: boolean | string; msisdn?: string };
    const ok = json.verified === true || json.verified === "True";
    if (!ok) return { ok: false as const, reason: "invalid_pin" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ phone: cleanPhone(data.phone), phone_verified: true })
      .eq("id", context.userId);
    return { ok: true as const };
  });

// Public verify — for guest checkout / signup flows (no auth required, no profile write)
export const verifyPhoneOtpPublic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ pinId: z.string().min(4), pin: z.string().regex(/^\d{4,8}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const cfg = await getTermiiConfig();
    if (!cfg.enabled || !cfg.apiKey) return { ok: false as const, reason: "termii_disabled" as const };
    const res = await fetch("https://api.ng.termii.com/api/sms/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: cfg.apiKey, pin_id: data.pinId, pin: data.pin }),
    });
    const json = (await res.json()) as { verified?: boolean | string };
    const ok = json.verified === true || json.verified === "True";
    return ok ? { ok: true as const } : { ok: false as const, reason: "invalid_pin" as const };
  });

// Public helper — is Termii enabled? So UI can hide the verify step.
export const termiiStatus = createServerFn({ method: "GET" }).handler(async () => {
  const cfg = await getTermiiConfig();
  return { enabled: cfg.enabled, channel: cfg.channel };
});
