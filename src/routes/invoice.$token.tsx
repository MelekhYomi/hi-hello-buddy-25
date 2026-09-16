import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ArrowRight, Printer, CheckCircle2, Landmark, CreditCard, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatNaira } from "@/lib/cart-context";
import { getInvoice, payInvoice, verifyInvoicePayment, declareTransfer } from "@/lib/billing.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/invoice/$token")({
  head: () => ({
    meta: [
      { title: "Your Invoice — C Imperium Branding" },
      { name: "description", content: "View and pay your C Imperium Branding invoice." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { ref?: string } => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
  }),
  component: InvoiceDocPage,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Awaiting payment",
  partially_paid: "Partially paid",
  paid: "Paid in full",
  void: "Void",
};

const FULFILMENT_LABEL: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  in_production: "In production",
  ready: "Ready",
  delivered: "Delivered",
};

function InvoiceDocPage() {
  const { token } = Route.useParams();
  const { ref } = Route.useSearch();
  const fetchInvoice = useServerFn(getInvoice);
  const startPayment = useServerFn(payInvoice);
  const verify = useServerFn(verifyInvoicePayment);
  const sendTransfer = useServerFn(declareTransfer);
  const qc = useQueryClient();

  const [payBusy, setPayBusy] = useState<"deposit" | "balance" | "full" | null>(null);
  const [verifyState, setVerifyState] = useState<"idle" | "verifying" | "done">(ref ? "verifying" : "idle");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number | "">("");
  const [transferBusy, setTransferBusy] = useState(false);
  const verifiedRef = useRef<string | null>(null);

  const queryKey = ["invoice", token];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchInvoice({ data: { token } }),
  });

  useEffect(() => {
    if (!ref || verifiedRef.current === ref) return;
    verifiedRef.current = ref;
    (async () => {
      try {
        const res = await verify({ data: { reference: ref } });
        if (res.ok) {
          toast.success(res.receiptNumber ? `Payment confirmed — receipt ${res.receiptNumber}` : "Payment confirmed");
        } else {
          toast.error("We couldn't confirm that payment yet. It may still be processing.");
        }
        await qc.invalidateQueries({ queryKey });
      } finally {
        setVerifyState("done");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  if (isLoading || verifyState === "verifying") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
          {verifyState === "verifying" ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…
            </span>
          ) : (
            "Loading your invoice…"
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="font-display text-3xl">Invoice not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">This link may be incorrect or expired.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { invoice, items, payments, receipts, settings } = data;
  const balance = Math.max(0, invoice.total - invoice.amount_paid);
  const depositOutstanding = Math.max(0, invoice.deposit_amount - invoice.amount_paid);
  const isFullTerms = invoice.deposit_amount >= invoice.total;
  const isPaid = balance <= 0;

  const pay = async (kind: "deposit" | "balance" | "full") => {
    setPayBusy(kind);
    try {
      const res = await startPayment({ data: { token, kind, origin: window.location.origin } });
      window.location.href = res.authorizationUrl;
    } catch (e) {
      setPayBusy(null);
      toast.error(e instanceof Error ? e.message : "Could not start payment");
    }
  };

  const submitTransfer = async () => {
    const amount = typeof transferAmount === "number" ? transferAmount : depositOutstanding || balance;
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    setTransferBusy(true);
    try {
      await sendTransfer({ data: { token, amount: Math.round(amount) } });
      toast.success("Thanks — we'll confirm once we see the transfer and email your receipt.");
      setShowTransfer(false);
      await qc.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record that");
    } finally {
      setTransferBusy(false);
    }
  };

  const pendingTransfer = payments.find((p: any) => p.method === "transfer" && p.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 print:py-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium print:hidden">
          Step 3 of 3 · Your invoice
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl leading-none md:text-5xl">{invoice.invoice_number}</h1>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                isPaid ? "border-imperium text-imperium" : "border-border text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[invoice.status] ?? invoice.status}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs print:hidden"
            >
              <Printer className="h-4 w-4" /> Print / save PDF
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-border/60 bg-card/50 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Billed to</div>
              <div className="mt-2 font-display text-lg">{invoice.full_name}</div>
              {invoice.company && <div className="text-sm text-muted-foreground">{invoice.company}</div>}
              <div className="text-sm text-muted-foreground">{invoice.email}</div>
              {invoice.phone && <div className="text-sm text-muted-foreground">{invoice.phone}</div>}
            </div>
            <div className="sm:text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Due date</div>
              <div className="mt-2 font-display text-lg">{invoice.due_date ?? "—"}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Fulfilment: {FULFILMENT_LABEL[invoice.fulfilment_status] ?? invoice.fulfilment_status}
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
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.description_snapshot}</div>
                    )}
                  </td>
                  <td className="py-3 text-center">{l.quantity}</td>
                  <td className="py-3 text-right">{l.is_on_request ? "On request" : formatNaira(l.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 space-y-2 text-sm">
            <Row label="Subtotal" value={formatNaira(invoice.subtotal)} />
            {invoice.discount > 0 && <Row label="Discount" value={`− ${formatNaira(invoice.discount)}`} />}
            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Total</span>
              <span className="font-display text-2xl text-imperium">{formatNaira(invoice.total)}</span>
            </div>
            <Row label="Amount paid" value={formatNaira(invoice.amount_paid)} />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Balance due</span>
              <span className="font-display text-xl">{formatNaira(balance)}</span>
            </div>
          </div>
        </div>

        {isPaid ? (
          <div className="mt-8 flex items-start gap-3 rounded-lg border border-imperium/40 bg-imperium/5 p-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-imperium" />
            <div>
              <p className="text-sm font-medium">This invoice is paid in full.</p>
              {receipts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {receipts.map((r: any) => (
                    <Link
                      key={r.id}
                      to="/receipt/$token"
                      params={{ token: r.public_token }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:border-imperium/60"
                    >
                      Receipt {r.receipt_number} <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-border/60 bg-card/40 p-6 print:hidden">
            <h2 className="font-display text-xl">PAY THIS INVOICE</h2>

            {pendingTransfer && (
              <p className="mt-3 rounded-md border border-imperium/40 bg-imperium/5 px-4 py-3 text-sm">
                A bank transfer of {formatNaira(pendingTransfer.amount)} is awaiting confirmation. We'll email your
                receipt once it clears.
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => pay(isFullTerms ? "full" : "deposit")}
                disabled={payBusy !== null}
                className="flex items-start gap-3 rounded-md border border-border p-4 text-left transition hover:border-imperium/60 disabled:opacity-50"
              >
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-imperium" />
                <div>
                  <div className="text-sm font-semibold">
                    {payBusy === "deposit" || payBusy === "full" ? "Starting…" : isFullTerms ? "Pay in full" : "Pay downpayment"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {isFullTerms ? formatNaira(balance) : formatNaira(depositOutstanding || balance)} via Paystack
                  </div>
                </div>
              </button>
              {!isFullTerms && (
                <button
                  type="button"
                  onClick={() => pay("balance")}
                  disabled={payBusy !== null}
                  className="flex items-start gap-3 rounded-md border border-border p-4 text-left transition hover:border-imperium/60 disabled:opacity-50"
                >
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-imperium" />
                  <div>
                    <div className="text-sm font-semibold">{payBusy === "balance" ? "Starting…" : "Pay full balance"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatNaira(balance)} via Paystack</div>
                  </div>
                </button>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowTransfer((v) => !v)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Landmark className="h-4 w-4" /> Or pay by bank transfer
              </button>
              {showTransfer && (
                <div className="mt-4 rounded-md border border-border p-4">
                  <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Bank</div>
                      <div>{settings.bank_name || "Contact us"}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Account name
                      </div>
                      <div>{settings.account_name}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Account number
                      </div>
                      <div>{settings.account_number || "Contact us"}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                        Amount transferred
                      </span>
                      <input
                        type="number"
                        min={1}
                        placeholder={String(depositOutstanding || balance)}
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value ? Number(e.target.value) : "")}
                        className="mt-1 w-48 rounded-md border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-imperium"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={submitTransfer}
                      disabled={transferBusy}
                      className="btn-cta h-10 px-5 text-xs disabled:opacity-50"
                    >
                      {transferBusy ? "Sending…" : "I've sent the transfer"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    We'll confirm manually once the transfer clears and email your receipt.
                  </p>
                </div>
              )}
            </div>

            {settings.terms && <p className="mt-5 text-xs text-muted-foreground">{settings.terms}</p>}
          </div>
        )}

        {payments.length > 0 && (
          <div className="mt-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Payment history
            </div>
            <div className="mt-3 space-y-2">
              {payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border/50 px-4 py-2.5 text-sm"
                >
                  <span className="capitalize text-muted-foreground">
                    {p.method} · {p.kind} · {p.status}
                  </span>
                  <span className="font-medium">{formatNaira(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
