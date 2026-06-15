import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";


export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — C Imperium Branding" },
      { name: "description", content: "Sign in to manage your bookings with C Imperium Branding." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.redirect || "/dashboard" });
  },
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password is at least 6 characters").max(128),
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back.");
    navigate({ to: search.redirect || "/dashboard" });
  };

  return (
    <div className="grain relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-3xl">
          <span className="text-imperium">C</span> IMPERIUM
        </Link>
        <h1 className="mt-12 font-display text-4xl">SIGN IN.</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Access your bookings
        </p>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full bg-imperium py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Enter"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={async () => {
            const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
            if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
          }}
          className="flex w-full items-center justify-center gap-2 border border-border bg-card py-3 font-mono text-[11px] uppercase tracking-[0.25em] transition-colors hover:border-imperium"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12.5 24 12.5c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.4-5.1l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4-4.1 5.2l6.2 5.2C41.3 35.6 43.5 30.2 43.5 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
          Continue with Google
        </button>

        <div className="mt-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/reset-password" className="story-link hover:text-foreground">
            Forgot password
          </Link>
          <Link to="/signup" className="story-link hover:text-foreground">
            Create account
          </Link>
        </div>

      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-b border-border bg-transparent py-3 text-base text-foreground outline-none transition-colors focus:border-imperium"
        required
      />
    </label>
  );
}
