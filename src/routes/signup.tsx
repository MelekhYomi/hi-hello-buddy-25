import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { sendPhoneOtp, verifyPhoneOtpPublic, termiiStatus } from "@/lib/termii.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — C Imperium Branding" },
      { name: "description", content: "Create an account to book consultations with C Imperium Branding." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: SignupPage,
});

const schema = z.object({
  displayName: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password is at least 6 characters").max(128),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

function SignupPage() {
  const navigate = useNavigate();
  const send = useServerFn(sendPhoneOtp);
  const verify = useServerFn(verifyPhoneOtpPublic);
  const status = useServerFn(termiiStatus);
  const otp = useQuery({ queryKey: ["termii-status"], queryFn: () => status(), staleTime: 60_000 });

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  // OTP step state
  const [pinId, setPinId] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  const finish = () => {
    toast.success("Account created. Welcome to the empire.");
    navigate({ to: "/dashboard" });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ displayName, email, password, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: parsed.data.displayName, phone: parsed.data.phone || null },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    // If Termii is enabled and phone provided, send OTP; otherwise skip.
    if (otp.data?.enabled && parsed.data.phone) {
      const r = await send({ data: { phone: parsed.data.phone } });
      setBusy(false);
      if (!r.ok) {
        toast.message("Phone verification unavailable — continuing.");
        finish();
      } else {
        setPinId(r.pinId);
        toast.success("Code sent — verify to finish");
      }
      return;
    }
    setBusy(false);
    finish();
  };

  const confirmOtp = async () => {
    if (!pinId) return;
    setBusy(true);
    const r = await verify({ data: { pinId, pin } });
    setBusy(false);
    if (!r.ok) return toast.error("Invalid code");
    // Mark verified on the profile
    const { data: sess } = await supabase.auth.getUser();
    if (sess.user) {
      await supabase.from("profiles").update({ phone, phone_verified: true }).eq("id", sess.user.id);
    }
    finish();
  };


  return (
    <div className="grain relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-3xl">
          <span className="text-imperium">C</span> IMPERIUM
        </Link>
        <h1 className="mt-12 font-display text-4xl">JOIN THE EMPIRE.</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Create your account
        </p>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <Field label="Full name" type="text" value={displayName} onChange={setDisplayName} autoComplete="name" />
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full bg-imperium py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={async () => {
            const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
            if (r.error) toast.error(r.error.message ?? "Google sign-up failed");
          }}
          className="flex w-full items-center justify-center gap-2 border border-border bg-card py-3 font-mono text-[11px] uppercase tracking-[0.25em] transition-colors hover:border-imperium"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12.5 24 12.5c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.4-5.1l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4-4.1 5.2l6.2 5.2C41.3 35.6 43.5 30.2 43.5 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
          Continue with Google
        </button>

        <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Already a client?{" "}
          <Link to="/login" className="story-link text-foreground">
            Sign in
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
