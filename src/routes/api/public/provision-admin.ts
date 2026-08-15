import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY one-time provisioning endpoint. Requires the PROVISION_TOKEN
// secret in the x-provision-token header. Delete this file after use.

function env(name: string): string | undefined {
  const cfEnv = typeof globalThis !== "undefined" ? (globalThis as any)._cf_env : undefined;
  return cfEnv?.[name] || (typeof process !== "undefined" ? process.env[name] : undefined);
}

function strongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const sym = "!@#$%&*?";
  const all = upper + lower + digits + sym;
  const pick = (set: string, n: number) => {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => set[b % set.length]).join("");
  };
  const raw = (pick(upper, 3) + pick(lower, 6) + pick(digits, 3) + pick(sym, 2) + pick(all, 4)).split("");
  const order = new Uint32Array(raw.length);
  crypto.getRandomValues(order);
  return raw
    .map((c, i) => ({ c, k: order[i] }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c)
    .join("");
}

export const Route = createFileRoute("/api/public/provision-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = env("PROVISION_TOKEN");
        if (!token || request.headers.get("x-provision-token") !== token) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const results: Record<string, unknown> = {};

        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
        const byEmail = new Map(
          (list?.users ?? []).map((u) => [String(u.email ?? "").toLowerCase(), u]),
        );

        // 1. Real super admin account
        const adminEmail = "cimperium@gmail.com";
        const adminPassword = strongPassword();
        const existingAdmin = byEmail.get(adminEmail);
        let adminId = existingAdmin?.id;
        if (adminId) {
          await supabaseAdmin.auth.admin.updateUserById(adminId, {
            password: adminPassword,
            email_confirm: true,
          });
        } else {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { display_name: "C Imperium Admin" },
          });
          if (error) return Response.json({ step: "createAdmin", error: error.message }, { status: 500 });
          adminId = data.user!.id;
        }
        for (const role of ["super_admin", "admin", "customer"]) {
          await supabaseAdmin.from("user_roles").insert({ user_id: adminId!, role: role as never });
        }
        results["admin"] = { email: adminEmail, password: adminPassword };

        // 2. Rotate the owner account password
        const ownerEmail = "iyomichrist@gmail.com";
        const ownerPassword = strongPassword();
        const owner = byEmail.get(ownerEmail);
        if (owner) {
          await supabaseAdmin.auth.admin.updateUserById(owner.id, {
            password: ownerPassword,
            email_confirm: true,
          });
          results["owner"] = { email: ownerEmail, password: ownerPassword };
        }

        // 3. Delete demo/seed accounts
        const deleted: string[] = [];
        for (const email of ["staff@cimperium.ng", "demo-customer@cimperium.ng"]) {
          const u = byEmail.get(email);
          if (u) {
            await supabaseAdmin.from("user_roles").delete().eq("user_id", u.id);
            const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
            if (!error) deleted.push(email);
          }
        }
        results["deleted"] = deleted;

        return Response.json(results);
      },
    },
  },
});
