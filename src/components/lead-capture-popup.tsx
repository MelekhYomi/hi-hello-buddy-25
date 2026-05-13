import { useEffect, useState, type FormEvent } from "react";
import { X, Sparkles } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getAnonId } from "@/lib/anon-id";
import { toast } from "sonner";

const STORAGE_KEY = "ci_lead_popup_dismissed";
const DISMISS_DAYS = 7;

const schema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  interest: z.string().trim().max(200).optional().or(z.literal("")),
});

export function LeadCapturePopup() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [source, setSource] = useState<"exit_intent" | "scroll" | "timer">("timer");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    let triggered = false;
    const trigger = (s: typeof source) => {
      if (triggered) return;
      triggered = true;
      setSource(s);
      setOpen(true);
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger("exit_intent");
    };
    const onScroll = () => {
      const h = document.documentElement;
      const depth = (h.scrollTop + window.innerHeight) / h.scrollHeight;
      if (depth > 0.6) trigger("scroll");
    };
    const t = window.setTimeout(() => trigger("timer"), 30000);

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, phone, interest });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      interest: parsed.data.interest || null,
      source,
      anon_id: getAnonId(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("You're in! We'll be in touch with your 10% off.");
    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-lg border border-imperium/40 bg-card shadow-2xl shadow-imperium/20"
      >
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <div className="bg-gradient-to-br from-imperium/20 to-transparent p-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
            <Sparkles className="h-3.5 w-3.5" /> Limited offer
          </div>
          <h3 className="mt-3 font-display text-3xl leading-tight">
            Get <span className="text-imperium">10% off</span><br />your first project
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Drop your details — we'll send a code + a free brand audit checklist.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3 p-6 pt-0">
          <input
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <input
            placeholder="What are you interested in? (optional)"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <button type="submit" disabled={busy} className="btn-cta h-12 w-full disabled:opacity-50">
            {busy ? "Sending…" : "Claim my 10% off"}
          </button>
          <button type="button" onClick={close} className="w-full text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
            No thanks
          </button>
        </form>
      </div>
    </div>
  );
}
