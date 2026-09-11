import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Printer, MessageCircle, Landmark, CreditCard, FileDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatNaira } from "@/lib/cart-context";
import { getInvoice, payInvoice, verifyInvoicePayment, declareTransfer } from "@/lib/billing.functions";
import { useSiteSettings, cleanWaNumber } from "@/lib/site-settings";
import { PaymentScheduleCard, DeliveryCard } from "@/components/invoice-extras";
import { toast } from "sonner";

export const Route = createFileRoute("/invoice/$token")({
  head: () => ({
    meta: [
      { title: "Your Invoice — C Imperium Branding" },
      { name: "description", content: "View and pay your C Imperium Branding invoice." },
      { property: "og:title", content: "Your Invoice — C Imperium Branding" },
      { property: "og:description", content: "View and pay your invoice securely." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvoicePage,
});

const FULFILMENT_LABEL: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  in_production: "In production",
  ready: "Ready — we'll contact you for delivery",
  delivered: "Delivered",
};

function InvoicePage() {
  const { token } = Route.useParams();
  const fetchInvoice = useServerFn(getInvoice);
  const startPayment = useServerFn(payInvoice);
  const verify = useServerFn(verifyInvoicePayment);
  const declare = useServerFn(declareTransfer);
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();
  const [busy, setBusy] = useState<string | null>(null);
  const verified = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invoice", token],
    queryFn: () => fetchInvoice({ data: { token } }),
  });

  // Returning from Paystack: ?ref=... — confirm and issue the receipt.
  useEffect(() => {
    if (verified.current) return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) return;
    verified.current = true;
    (async () => {
      const res = await verify({ data: { reference: ref } });
      if (res.ok) {
        toast.success(
          res.receiptNumber ? `Payment confirmed — receipt ${res.receiptNumber}` : "Payment confirmed",
        );
        queryClient.invalidateQueries({ queryKey: ["invoice", token] });
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        toast.error("We couldn't confirm that payment yet. Please try again or contact us.");
      }
    })();
  }, [queryClient, token, verify]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-muted-foreground">Loading your invoice…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="font-display text-3xl">Invoice not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">This link may have expired.</p>
          <Link to="/quote" className="btn-cta mt-6 inline-flex h-11 items-center px-5">
            Build a new quote
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { invoice, items, payments, receipts, settings: billing } = data;
  const balance = Math.max(0, invoice.total - invoice.amount_paid);
  const depositDue = Math.max(0, invoice.deposit_amount - invoice.amount_paid);
  const pending = payments.filter((p: any) => p.status === "pending" && p.method !== "paystack");

  const pay = async (kind: "deposit" | "balance") => {
    setBusy(kind);
    try {
      const res = await startPayment({ data: { token, kind, origin: window.location.origin } });
      window.location.href = res.authorizationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the payment");
      setBusy(null);
    }
  };

  const markTransfer = async (amount: number) => {
    setBusy("transfer");
    try {
      await declare({ data: { token, amount } });
      toast.success("Thanks — we'll confirm your transfer and send your receipt.");
      queryClient.invalidateQueries({ queryKey: ["invoice", token] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record that");
    } finally {
      setBusy(null);
    }
  };

  const waNumber = cleanWaNumber(settings?.whatsapp_number) || "2348038577654";
  const waText = encodeURIComponent(
    `Hello C Imperium, I'm following up on invoice ${invoice.invoice_number} (balance ${formatNaira(balance)}).`,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          Step 3 of 3 · Invoice & payment
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-none md:text-5xl">{invoice.invoice_number}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
              {invoice.status === "paid" ? "Paid in full" : invoice.status === "partially_paid" ? "Part payment received" : "Awaiting payment"}
              <span className="text-muted-foreground">·</span>
              {FULFILMENT_LABEL[invoice.fulfilment_status] ?? invoice.fulfilment_status}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/public/pdf/invoice/${token}`}
              className="inline-flex items-center gap-2 rounded-md border border-imperium px-4 py-2 text-xs text-imperium"
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-border/60 bg-card/50 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Billed to
              </div>
              <div className="mt-2 font-display text-lg">{invoice.full_name}</div>
              {invoice.company && <div className="text-sm text-muted-foreground">{invoice.company}</div>}
              <div className="text-sm text-muted-foreground">{invoice.email}</div>
              {invoice.phone && <div className="text-sm text-muted-foreground">{invoice.phone}</div>}
            </div>
            <div className="sm:text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Due date
              </div>
              <div className="mt-2 font-display text-lg">{invoice.due_date ?? "—"}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Downpayment: {invoice.deposit_percent}% ({formatNaira(invoice.deposit_amount)})
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
                  <td className="py-3 font-medium">{l.title_snapshot}</td>
                  <td className="py-3 text-center">{l.quantity}</td>
                  <td className="py-3 text-right">
                    {l.is_on_request ? "On request" : formatNaira(l.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-6 space-y-2 text-sm">
            <Row label="Subtotal" value={formatNaira(invoice.subtotal)} />
            {invoice.discount > 0 && <Row label="Discount" value={`- ${formatNaira(invoice.discount)}`} />}
            <Row label="Total" value={formatNaira(invoice.total)} strong />
            <Row label="Paid" value={formatNaira(invoice.amount_paid)} />
            <Row label="Balance" value={formatNaira(balance)} strong />
          </dl>
        </div>

        {balance > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-imperium/40 bg-imperium/5 p-6">
              <CreditCard className="h-6 w-6 text-imperium" strokeWidth={1.5} />
              <h2 className="mt-4 font-display text-xl">PAY ONLINE</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Card, bank, or USSD via our secure payment partner. Your receipt is issued immediately.
              </p>
              <div className="mt-5 space-y-3">
                {depositDue > 0 && (
                  <button
                    onClick={() => pay("deposit")}
                    disabled={busy !== null}
                    className="btn-cta h-12 w-full px-5 disabled:opacity-50"
                  >
                    {busy === "deposit" ? "Redirecting…" : `Pay downpayment ${formatNaira(depositDue)}`}
                  </button>
                )}
                <button
                  onClick={() => pay("balance")}
                  disabled={busy !== null}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-imperium px-5 text-sm text-imperium disabled:opacity-50"
                >
                  {busy === "balance" ? "Redirecting…" : `Pay full balance ${formatNaira(balance)}`}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-6">
              <Landmark className="h-6 w-6 text-imperium" strokeWidth={1.5} />
              <h2 className="mt-4 font-display text-xl">BANK TRANSFER</h2>
              <dl className="mt-4 space-y-1 text-sm">
                <Row label="Account name" value={billing.account_name || "C Imperium Branding"} />
                <Row label="Bank" value={billing.bank_name || "Contact us"} />
                <Row label="Account number" value={billing.account_number || "Contact us"} />
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Use <strong>{invoice.invoice_number}</strong> as your transfer reference, then tell us
                below. We'll confirm and email your receipt.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {depositDue > 0 && (
                  <button
                    onClick={() => markTransfer(depositDue)}
                    disabled={busy !== null}
                    className="rounded-md border border-border px-4 py-2 text-xs disabled:opacity-50"
                  >
                    I transferred the downpayment
                  </button>
                )}
                <button
                  onClick={() => markTransfer(balance)}
                  disabled={busy !== null}
                  className="rounded-md border border-border px-4 py-2 text-xs disabled:opacity-50"
                >
                  I transferred the full balance
                </button>
              </div>
              {!!pending.length && (
                <p className="mt-4 text-xs text-imperium">
                  {pending.length} transfer{pending.length > 1 ? "s" : ""} awaiting confirmation by our team.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-imperium/40 bg-imperium/5 p-6">
            <h2 className="font-display text-xl">PAYMENT COMPLETE</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you. Your job is with our production team and we'll contact you for delivery or
              pickup as soon as it's ready.
            </p>
          </div>
        )}

        {!!receipts.length && (
          <div className="mt-8">
            <h2 className="font-display text-xl">RECEIPTS</h2>
            <ul className="mt-4 space-y-2">
              {receipts.map((r: any) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-xs">{r.receipt_number}</span>
                  <span>{formatNaira(r.amount)}</span>
                  <Link
                    to="/receipt/$token"
                    params={{ token: r.public_token }}
                    className="text-xs text-imperium hover:underline"
                  >
                    View receipt
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 rounded-lg border border-border/60 bg-card/30 p-6 text-sm text-muted-foreground">
          <h3 className="font-display text-base text-foreground">NEED US?</h3>
          <p className="mt-2">
            C Imperium Branding · Jos, Plateau State, Nigeria. A representative will reach out to
            continue the discussion — or contact us any time.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${waNumber}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs text-foreground"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
            <Link to="/" hash="contact" className="inline-flex items-center rounded-md border border-border px-4 py-2 text-xs text-foreground">
              Contact the studio
            </Link>
          </div>
          {billing.terms && <p className="mt-5 text-xs">{billing.terms}</p>}
          {billing.invoice_footer && <p className="mt-2 text-xs">{billing.invoice_footer}</p>}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-display text-lg text-imperium" : ""}>{value}</dd>
    </div>
  );
}
