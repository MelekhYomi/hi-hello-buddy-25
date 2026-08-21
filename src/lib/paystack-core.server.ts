// Shared Paystack credential helpers (server-only).

export async function getPaystackMode(): Promise<"test" | "live"> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "paystack")
    .maybeSingle();
  const v = (data?.value as { mode?: string } | null) ?? null;
  return v?.mode === "live" ? "live" : "test";
}

export function paystackSecret(mode: "test" | "live"): string {
  const cfEnv = typeof globalThis !== "undefined" ? (globalThis as any)._cf_env : undefined;
  const pick = (name: string) =>
    cfEnv?.[name] || (typeof process !== "undefined" ? process.env[name] : undefined);
  const key = mode === "live" ? pick("PAYSTACK_SECRET_KEY_LIVE") : pick("PAYSTACK_SECRET_KEY_TEST");
  if (!key) throw new Error(`Paystack ${mode} secret key is not configured`);
  return key as string;
}
