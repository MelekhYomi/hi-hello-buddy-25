import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowRight, FileText, Minus, Plus, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQuoteBuilder } from "@/lib/quote-context";
import { formatNaira } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { submitQuote } from "@/lib/billing.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Build Your Quote — C Imperium Branding" },
      {
        name: "description",
        content:
          "Select the branding services and products you need and see your quote total instantly, then request a formal invoice from C Imperium Branding.",
      },
      { property: "og:title", content: "Build Your Quote — C Imperium Branding" },
      {
        property: "og:description",
        content: "Pick your services, see the total, and get an invoice by email or WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
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
  const { lines, estimate, hasOnRequest, remove, setQty, clear } = useQuoteBuilder();
  const { user } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(submitQuote);

  const [fullName, setFullName] = useState(user?.user_metadata?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState<"call" | "whatsapp" | "email">("whatsapp");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lines.length) {
      toast.error("Add at least one service or product first");
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
          user_id: user?.id ?? null,
        },
      });
      clear();
      navigate({ to: "/quote/$token", params: { token: res.token } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate your quote");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          Step 1 of 3 · Quote
        </div>
        <h1 className="mt-4 font-display text-5xl leading-[0.9] md:text-6xl">YOUR QUOTE</h1>
        <div className="mt-6 h-px w-24 bg-imperium" />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Review the services and products you selected. Add or remove anything and the total updates
          straight away. When you're happy, send it through and we'll issue a formal invoice with your
          downpayment details.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <section className="lg:col-span-7">
            {!lines.length ? (
              <div className="rounded-lg border border-border/60 bg-card/40 p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-imperium" strokeWidth={1.5} />
                <p className="mt-4 text-sm text-muted-foreground">
                  Your quote is empty. Browse our services or the shop and use “Add to quote”.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to="/" hash="services" className="btn-cta inline-flex h-11 items-center px-5">
                    Browse services
                  </Link>
                  <Link
                    to="/shop"
                    className="inline-flex h-11 items-center rounded-md border border-border px-5 text-sm"
                  >
                    Visit shop
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
                          {l.type} · {l.onRequest ? "priced on request" : formatNaira(l.unitPrice)} each
                        </div>
                      </div>
                      <button type="button" onClick={() => remove(l.id)} aria-label={`Remove ${l.title}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="inline-flex items-center gap-3 rounded-md border border-border">
                        <button type="button" className="px-3 py-2" onClick={() => setQty(l.id, l.quantity - 1)} aria-label="Decrease quantity">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-6 text-center text-sm">{l.quantity}</span>
                        <button type="button" className="px-3 py-2" onClick={() => setQty(l.id, l.quantity + 1)} aria-label="Increase quantity">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="font-display text-lg text-imperium">
                        {l.onRequest ? "On request" : formatNaira(l.unitPrice * l.quantity)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!!lines.length && (
              <div className="mt-6 rounded-lg border border-imperium/40 bg-imperium/5 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated total</span>
                  <span className="font-display text-3xl text-imperium">{formatNaira(estimate)}</span>
                </div>
                {hasOnRequest && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Items marked “on request” are scoped after our consultation and confirmed on your
                    invoice.
                  </p>
                )}
              </div>
            )}
          </section>

          <form onSubmit={submit} className="lg:col-span-5 space-y-5">
            <h2 className="font-display text-2xl">WHERE SHOULD WE SEND IT?</h2>
            <label className="block">
              <span className={labelClass}>Full name *</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block">
              <span className={labelClass}>Email *</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block">
              <span className={labelClass}>WhatsApp / phone</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block">
              <span className={labelClass}>Company</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block">
              <span className={labelClass}>Project details</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Anything we should know before pricing this?"
                className={`mt-2 ${inputClass} resize-none`}
              />
            </label>
            <fieldset>
              <span className={labelClass}>How should we continue the discussion? *</span>
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
            <button type="submit" disabled={busy || !lines.length} className="btn-cta h-14 w-full px-6 disabled:opacity-50">
              {busy ? "Generating…" : "Submit and see my quote"} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted-foreground">
              You'll see your formal quote next. Nothing is charged at this step.
            </p>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
