import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowRight, FileText, Minus, Plus, Trash2, Sparkles, Clock } from "lucide-react";
import {
  readAdvisorHandoff,
  clearAdvisorHandoff,
  handoffNotes,
  type AdvisorHandoff,
} from "@/lib/advisor-handoff";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQuoteBuilder } from "@/lib/quote-context";
import { useAuth } from "@/lib/auth-context";
import { submitQuote, claimQuoteDraft } from "@/lib/billing.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/quote/")({
  head: () => ({
    meta: [
      { title: "Request a Quote — C Imperium Branding" },
      {
        name: "description",
        content:
          "Tell us what you need. We price each service by hand and send itemised prices back on WhatsApp.",
      },
      { property: "og:title", content: "Request a Quote — C Imperium Branding" },
      {
        property: "og:description",
        content: "Pick your services, send the brief, and get itemised prices back.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  // Quotes are tied to an account so they can be recorded and answered.
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: QuotePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  preferred_contact: z.enum(["call", "whatsapp", "email"]),
});

const inputClass =
  "w-full rounded-md border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-imperium";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground";

function QuotePage() {
  const { lines, draftKey, replace, remove, setQty, reset } = useQuoteBuilder();
  const { user } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(submitQuote);
  const claim = useServerFn(claimQuoteDraft);

  const [fullName, setFullName] = useState(user?.user_metadata?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone ?? "");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState<"call" | "whatsapp" | "email">("whatsapp");
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState<AdvisorHandoff | null>(null);
  const [restored, setRestored] = useState(false);
  const [alreadySent, setAlreadySent] = useState<string | null>(null);
  const claimed = useRef(false);

  useEffect(() => {
    const h = readAdvisorHandoff();
    if (!h) return;
    setHandoff(h);
    setNotes((prev) => prev || handoffNotes(h));
  }, []);

  // The request built before signing in lives on the server under the draft
  // key. Pull it back so it is on screen immediately, even on another device.
  useEffect(() => {
    if (!draftKey || claimed.current) return;
    claimed.current = true;
    claim({ data: { draft_key: draftKey } })
      .then((res) => {
        if (!res.found) return;
        if (res.status !== "draft") {
          setAlreadySent(res.token);
          return;
        }
        if (!res.items.length) return;
        if (!lines.length) {
          replace(
            res.items.map((i: any) => ({
              id: i.ref_id as string,
              type: i.item_type as "service" | "product",
              slug: "",
              title: i.title_snapshot as string,
              unitPrice: i.unit_price as number,
              onRequest: !!i.is_on_request,
              quantity: i.quantity as number,
            })),
          );
        }
        setRestored(true);
      })
      .catch(() => {});
  }, [draftKey, claim, lines.length, replace]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lines.length) {
      toast.error("Add at least one service first");
      return;
    }
    const parsed = schema.safeParse({
      full_name: fullName,
      email,
      phone,
      company,
      notes,
      preferred_contact: contact,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const res = await send({
        data: {
          items: lines.map((l) => ({ type: l.type, id: l.id, quantity: l.quantity })),
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          company: parsed.data.company,
          notes: parsed.data.notes,
          preferred_contact: parsed.data.preferred_contact,
          advisor_session_id: handoff?.sessionId ?? null,
          draft_key: draftKey || undefined,
          origin: window.location.origin,
        },
      });
      clearAdvisorHandoff();
      reset();
      toast.success("Request received — we'll price it and reply shortly.");
      navigate({ to: "/quote/$token", params: { token: res.token } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          Quote request
        </div>
        <h1 className="mt-4 font-display text-5xl leading-[0.9] md:text-6xl">
          TELL US WHAT YOU NEED
        </h1>
        <div className="mt-6 h-px w-24 bg-imperium" />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Adjust quantities, add your brief, and send. Every line is priced by hand — we reply on
          WhatsApp with itemised prices, usually within one business day.
        </p>

        {restored && (
          <div className="mt-6 inline-flex items-center gap-2 border border-imperium/40 bg-imperium/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">
            <Clock className="h-3.5 w-3.5" /> Your saved request was restored
          </div>
        )}

        {alreadySent && (
          <div className="mt-8 rounded-lg border border-imperium/40 bg-imperium/5 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-imperium">
              You already sent this request
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              We have it and will reply shortly. You can follow it here.
            </p>
            <Link
              to="/quote/$token"
              params={{ token: alreadySent }}
              className="btn-cta mt-4 inline-flex h-11 items-center px-5"
            >
              View my request <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {handoff && (
          <div className="mt-8 rounded-lg border border-imperium/40 bg-imperium/5 p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-imperium">
              <Sparkles className="h-3.5 w-3.5" /> Brought over from your recommendations
            </div>
            {handoff.summary && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{handoff.summary}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Your brief has been added below — edit it freely.
            </p>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <section className="lg:col-span-7">
            {!lines.length ? (
              <div className="rounded-lg border border-border/60 bg-card/40 p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-imperium" strokeWidth={1.5} />
                <p className="mt-4 text-sm text-muted-foreground">
                  Nothing here yet. Pick a service and we'll price it for you.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to="/" hash="services" className="btn-cta inline-flex h-11 items-center px-5">
                    Browse services
                  </Link>
                  <Link
                    to="/"
                    hash="book"
                    className="inline-flex h-11 items-center rounded-md border border-border px-5 text-sm"
                  >
                    Book a consultation
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {lines.map((l) => (
                  <li key={l.id} className="rounded-lg border border-border/60 bg-card/50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-display text-lg">{l.title}</div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {l.type} · pricing on request
                        </div>
                      </div>
                      <button type="button" onClick={() => remove(l.id)} aria-label={`Remove ${l.title}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="inline-flex items-center gap-3 rounded-md border border-border">
                        <button
                          type="button"
                          className="px-3 py-2"
                          onClick={() => setQty(l.id, l.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-6 text-center text-sm">{l.quantity}</span>
                        <button
                          type="button"
                          className="px-3 py-2"
                          onClick={() => setQty(l.id, l.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Priced by hand
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!!lines.length && (
              <div className="mt-6 rounded-lg border border-border/60 bg-card/30 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-xl text-imperium">Pricing on request</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  No automatic figures. We read your brief, price each line, and send the breakdown
                  back to you.
                </p>
              </div>
            )}
          </section>

          <form onSubmit={submit} className="lg:col-span-5 space-y-5">
            <h2 className="font-display text-2xl">WHERE SHOULD WE SEND IT?</h2>
            <label className="block">
              <span className={labelClass}>Full name *</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Email *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className={labelClass}>WhatsApp / phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234…"
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Company</span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Your brief</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="What are you making, for who, and by when?"
                className={`mt-2 ${inputClass} resize-none`}
              />
            </label>
            <fieldset>
              <span className={labelClass}>How should we reply? *</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["whatsapp", "call", "email"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setContact(c)}
                    className={`rounded-md border px-3 py-2 text-xs capitalize transition ${
                      contact === c ? "border-imperium bg-imperium/10 text-imperium" : "border-border"
                    }`}
                  >
                    {c === "call" ? "Phone call" : c}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={busy || !lines.length}
              className="btn-cta h-14 w-full px-6 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send my request"} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted-foreground">
              Nothing is charged. We'll reply on {contact === "call" ? "a call" : contact} with the
              itemised prices.
            </p>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
