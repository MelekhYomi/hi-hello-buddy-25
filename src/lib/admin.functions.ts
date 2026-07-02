import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- helpers ----------
async function assertRole(
  supabase: any,
  userId: string,
  role: "admin" | "super_admin",
) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ---------- USERS ----------
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = data.users.map((u) => u.id);
    const { data: rolesRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const rolesByUser = new Map<string, string[]>();
    for (const r of rolesRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      roles: rolesByUser.get(u.id) ?? [],
    }));
  });

const roleMut = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "staff", "customer", "super_admin"]),
});

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roleMut.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "super_admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roleMut.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "super_admin");
    if (data.role === "super_admin" && data.userId === context.userId) {
      throw new Error("You cannot revoke your own super_admin role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email(), redirectTo: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "super_admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo: data.redirectTo },
    });
    if (error) throw new Error(error.message);
    return { ok: true, actionLink: linkData?.properties?.action_link ?? null };
  });

// ---------- ORDERS ----------
export const refundOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("payment_ref, payment_provider, payment_status")
      .eq("id", data.orderId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    if (order.payment_status !== "paid" || order.payment_provider !== "paystack" || !order.payment_ref) {
      // Manual refund path — just mark as refunded.
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "refunded", status: "cancelled" })
        .eq("id", data.orderId);
      return { ok: true, mode: "manual" as const };
    }
    // Live Paystack refund
    const { data: setting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "paystack")
      .maybeSingle();
    const mode = ((setting?.value as { mode?: string } | null)?.mode === "live" ? "live" : "test") as
      | "live"
      | "test";
    const key =
      mode === "live" ? process.env.PAYSTACK_SECRET_KEY_LIVE : process.env.PAYSTACK_SECRET_KEY_TEST;
    if (!key) throw new Error(`Paystack ${mode} secret not configured`);
    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: order.payment_ref }),
    });
    const json = (await res.json()) as { status?: boolean; message?: string };
    if (!res.ok || !json.status) throw new Error(json.message ?? "Refund failed");
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "refunded", status: "cancelled" })
      .eq("id", data.orderId);
    return { ok: true, mode: "paystack" as const };
  });

// ---------- PAYMENTS PROBE ----------
export const paystackProbe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const key = process.env.PAYSTACK_SECRET_KEY_TEST;
    if (!key) throw new Error("PAYSTACK_SECRET_KEY_TEST is not set");
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, amount: 100 * 100, currency: "NGN" }),
    });
    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!res.ok || !json.status || !json.data) throw new Error(json.message ?? "Probe failed");
    return { authorizationUrl: json.data.authorization_url, reference: json.data.reference };
  });
