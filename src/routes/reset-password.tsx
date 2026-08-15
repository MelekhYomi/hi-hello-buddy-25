import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — C Imperium Branding" }, { name: "robots", content: "noindex" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  // If the URL hash contains a recovery token, Supabase auto-creates a temp session
  // and onAuthStateChange fires with event=PASSWORD_RECOVERY. We detect that to switch UI.
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => subscription.unsubscribe();
  }, []);

  const requestReset = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Reset link sent. Check your inbox.");
  };

  const updatePassword = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(6, "Password is at least 6 characters").max(128).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="grain relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-3xl">
          <span className="text-imperium">C</span> IMPERIUM
        </Link>
        <h1 className="mt-12 font-display text-4xl">
          {mode === "request" ? "RESET ACCESS." : "NEW PASSWORD."}
        </h1>

        {mode === "request" ? (
          <form onSubmit={requestReset} className="mt-10 space-y-5">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border-b border-border bg-transparent py-3 text-base outline-none focus:border-imperium"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-imperium py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="mt-10 space-y-5">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border-b border-border bg-transparent py-3 text-base outline-none focus:border-imperium"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-imperium py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/login" className="story-link hover:text-foreground">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
