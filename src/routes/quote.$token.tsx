import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Printer, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatNaira } from "@/lib/cart-context";
import { getQuote, proceedWithQuote } from "@/lib/billing.functions";
import { useSiteSettings, cleanWaNumber } from "@/lib/site-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/quote/$token")({
  head: () => ({
    meta: [
      { title: "Your Quote — C Imperium Branding" },
      { name: "description", content: "View your C Imperium Branding quote and proceed to an invoice." },
      { property: "og:title", content: "Your Quote — C Imperium Branding" },
      { property: "og:description", content: "View your quote and proceed to an invoice." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuoteDocPage,
});

function QuoteDocPage() {
  const { token } = Route.useParams();
  const fetchQuote = useServerFn(getQuote);
  const proceed = useServerFn(proceedWithQuote);
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const [terms, setTerms] = useState<"deposit" | "full">("deposit");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["quote", token],
    queryFn: () => fetchQuote({ data: { token } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-muted-foreground">Loading your quote…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="font-display text-3xl">Quote not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This link may have expired. Build a new quote and we'll price it again.
          </p>
          <Link to="/quote" className="btn-cta mt-6 inline-flex h-11 items-center px-5">
            Build a new quote
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { quote, items, invoice } = data;

  const onProceed = async () => {
    setBusy(true);
    try {
      const res = await proceed({
        data: {
          token,
          payment_terms: terms,
          preferred_contact: quote.preferred_contact as "call" | "whatsapp" | "email",
          origin: window.location.origin,
        },
      });
      toast.success(`Invoice ${res.invoiceNumber} created`);
      navigate({ to: "/invoice/$token", params: { token: res.token } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create your invoice");
    } finally {
      setBusy(false);
    }
  };

  const waNumber = cleanWaNumber(settings?.whatsapp_number) || "2348038577654";
  const waText = encodeURIComponent(
    `Hello C Imperium, I'd like to discuss my quote ${quote.quote_number} (total ${formatNaira(quote.total)}).`,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          Step 2 of 3 · Your quote
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl leading-none md:text-5xl">{quote.quote_number}</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs"
          >
            <Printer className="h-4 w-4" /> Print / save PDF
          </button>
        </div>

        <div className="mt-8 rounded-lg border border-border/60 bg-card/50 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Prepared for
              </div>
              <div className="mt-2 font-display text-lg">{quote.full_name}</div>
              {quote.company && <div className="text-sm text-muted-foreground">{quote.company}</div>}
              <div className="text-sm text-muted-foreground">{quote.email}</div>
              {quote.phone && <div className="text-sm text-muted-foreground">{quote.phone}</div>}
            </div>
            <div className="sm:text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Valid until
              </div>
              <div className="mt-2 font-display text-lg">{quote.valid_until ?? "—"}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Preferred contact: {quote.preferred_contact}
              </div>
            </div>
          </div>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="pb-3">Item</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l: any) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="py-3">
                    <div className="font-medium">{l.title_snapshot}</div>
                    {l.description_snapshot && (
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {l.description_snapshot}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-center">{l.quantity}</td>
                  <td className="py-3 text-right">
                    {l.is_on_request ? "On request" : formatNaira(l.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Quote total
            </span>
            <span className="font-display text-3xl text-imperium">{formatNaira(quote.total)}</span>
          </div>
          {quote.has_custom_items && (
            <p className="mt-3 text-xs text-muted-foreground">
              Items priced on request are confirmed after your consultation and reflected on the invoice.
            </p>
          )}
        </div>

        {invoice ? (
          <div className="mt-8 rounded-lg border border-imperium/40 bg-imperium/5 p-6">
            <p className="text-sm">
              Invoice <strong>{invoice.invoice_number}</strong> has already been issued for this quote.
            </p>
            <Link
              to="/invoice/$token"
              params={{ token: invoice.public_token }}
              className="btn-cta mt-4 inline-flex h-11 items-center px-5"
            >
              View invoice <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-border/60 bg-card/40 p-6">
            <h2 className="font-display text-xl">READY TO PROCEED?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll email your invoice with payment details, and a representative will reach out via{" "}
              {quote.preferred_contact === "call" ? "a phone call" : quote.preferred_contact} to discuss
              the finer details.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { key: "deposit" as const, label: "Pay a downpayment", hint: "Start with a part payment" },
                  { key: "full" as const, label: "Pay in full", hint: "Settle the whole amount now" },
                ]
              ).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setTerms(o.key)}
                  className={`rounded-md border p-4 text-left transition ${
                    terms === o.key ? "border-imperium bg-imperium/10" : "border-border hover:border-imperium/60"
                  }`}
                >
                  <div className="text-sm font-semibold">{o.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{o.hint}</div>
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={onProceed} disabled={busy} className="btn-cta h-12 px-6 disabled:opacity-50">
                {busy ? "Preparing invoice…" : "Proceed to discuss & get invoice"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={`https://wa.me/${waNumber}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-border px-6 text-sm"
              >
                <MessageCircle className="h-4 w-4" /> Discuss on WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
