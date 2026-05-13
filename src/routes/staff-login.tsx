import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/staff-login")({
  head: () => ({
    meta: [
      { title: "Staff access — C Imperium" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      const isStaff = roles?.some((r) => r.role === "admin" || r.role === "staff");
      if (isStaff) throw redirect({ to: "/admin" });
    }
  },
  component: StaffLogin,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6).max(128),
});

function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      setBusy(false);
      return toast.error(error?.message ?? "Sign in failed");
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isStaff = roles?.some((r) => r.role === "admin" || r.role === "staff");
    setBusy(false);
    if (!isStaff) {
      await supabase.auth.signOut();
      return toast.error("This account does not have staff access.");
    }
    toast.success("Welcome back.");
    navigate({ to: "/admin" });
  };

  return (
    <div className="grain relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card/40 p-8">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
          <Lock className="h-3 w-3" /> Staff access
        </div>
        <h1 className="mt-3 font-display text-3xl">RESTRICTED.</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          For C Imperium administrators and staff only.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <button type="submit" disabled={busy} className="btn-cta h-12 w-full disabled:opacity-50">
            {busy ? "Signing in…" : "Enter command center"}
          </button>
        </form>
      </div>
    </div>
  );
}
