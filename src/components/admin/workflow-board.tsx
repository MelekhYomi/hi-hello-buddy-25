import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, MessageCircle, ArrowRight, Check, BadgeCheck } from "lucide-react";
import { formatNaira } from "@/lib/cart-context";
import { cleanWaNumber } from "@/lib/site-settings";
import {
  adminWorkflow,
  adminConvertQuote,
  adminUpdateInvoice,
  adminRecordPayment,
  adminConfirmPendingPayment,
  adminMarkMessageSent,
} from "@/lib/billing.functions";

const STAGES = [
  { key: "awaiting_payment", label: "Awaiting payment" },
  { key: "in_production", label: "In production" },
  { key: "ready", label: "Ready for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

const NEXT_STAGE: Record<string, string> = {
  awaiting_payment: "in_production",
  in_production: "ready",
  ready: "delivered",
};

export function WorkflowBoard() {
  const qc = useQueryClient();
  const load = useServerFn(adminWorkflow);
  const convert = useServerFn(adminConvertQuote);
  const updateInvoice = useServerFn(adminUpdateInvoice);
  const recordPayment = useServerFn(adminRecordPayment);
  const confirmPayment = useServerFn(adminConfirmPendingPayment);
  const markSent = useServerFn(adminMarkMessageSent);
  const [busy, setBusy] = useState<string | null>(null);

  const wf = useQuery({ queryKey: ["admin-workflow"], queryFn: () => load({}) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-workflow"] });

  const quotes = wf.data?.quotes ?? [];
  const invoices = wf.data?.invoices ?? [];
  const payments = wf.data?.payments ?? [];
  const messages = wf.data?.messages ?? [];

  const openQuotes = quotes.filter((q: any) => q.status === "new" || q.status === "discussing");
  const pendingPayments = payments.filter((p: any) => p.status === "pending" && p.method !== "paystack");
  const queuedWhatsApp = messages.filter((m: any) => m.channel === "whatsapp" && m.status === "queued");

  const act = async (key: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(done);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That didn't work");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-8 space-y-10">
      {wf.isLoading && (
        <div className="bg-card p-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Loading workflow…
        </div>
      )}

      {/* Stage counters */}
      <div className="grid grid-cols-2 gap-px bg-border/40 md:grid-cols-5">
        <Counter label="Open quotes" value={openQuotes.length} accent={openQuotes.length > 0} />
        {STAGES.map((s) => (
          <Counter
            key={s.key}
            label={s.label}
            value={invoices.filter((i: any) => i.fulfilment_status === s.key).length}
          />
        ))}
      </div>

      {/* Transfers awaiting confirmation */}
      {!!pendingPayments.length && (
        <section>
          <h3 className="font-display text-xl">PAYMENTS AWAITING CONFIRMATION</h3>
          <div className="mt-4 space-y-px bg-border/40">
            {pendingPayments.map((p: any) => {
              const inv = invoices.find((i: any) => i.id === p.invoice_id);
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 text-sm">
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">{inv?.invoice_number}</span>{" "}
                    · {inv?.full_name} · {p.method}
                  </span>
                  <span className="font-display text-lg text-imperium">{formatNaira(p.amount)}</span>
                  <button
                    disabled={busy !== null}
                    onClick={() =>
                      act(p.id, () => confirmPayment({ data: { paymentId: p.id } }), "Payment confirmed — receipt issued")
                    }
                    className="inline-flex items-center gap-2 border border-imperium px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium disabled:opacity-50"
                  >
                    <BadgeCheck className="h-3 w-3" /> Confirm & issue receipt
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Receipts ready to send on WhatsApp */}
      {!!queuedWhatsApp.length && (
        <section>
          <h3 className="font-display text-xl">RECEIPTS TO SEND ON WHATSAPP</h3>
          <div className="mt-4 space-y-px bg-border/40">
            {queuedWhatsApp.map((m: any) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 text-sm">
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{m.subject}</span> · {m.to_address}
                </span>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${cleanWaNumber(m.to_address)}?text=${encodeURIComponent(m.body)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-imperium px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium"
                  >
                    <MessageCircle className="h-3 w-3" /> Open WhatsApp
                  </a>
                  <button
                    disabled={busy !== null}
                    onClick={() => act(m.id, () => markSent({ data: { messageId: m.id } }), "Marked as sent")}
                    className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" /> Mark sent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open quotes */}
      <section>
        <h3 className="font-display text-xl">QUOTE REQUESTS</h3>
        <div className="mt-4 space-y-px bg-border/40">
          {!openQuotes.length && (
            <div className="bg-card p-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              No open quote requests
            </div>
          )}
          {openQuotes.map((q: any) => (
            <div key={q.id} className="bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {q.quote_number} · prefers {q.preferred_contact}
                  </div>
                  <div className="mt-1 font-display text-lg">{q.full_name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{q.email}</div>
                  {q.phone && <div className="font-mono text-[10px] text-muted-foreground">{q.phone}</div>}
                  {q.notes && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{q.notes}</p>}
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <div className="font-display text-2xl text-imperium">{formatNaira(q.total)}</div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/public/pdf/quote/${q.public_token}`}
                      className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                    >
                      <FileDown className="h-3 w-3" /> PDF
                    </a>
                    {q.phone && (
                      <a
                        href={`https://wa.me/${cleanWaNumber(q.phone)}?text=${encodeURIComponent(
                          `Hello ${q.full_name}, this is C Imperium Branding about your quote ${q.quote_number} (${formatNaira(q.total)}).`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                    <button
                      disabled={busy !== null}
                      onClick={() =>
                        act(
                          q.id,
                          async () => {
                            const res = await convert({
                              data: {
                                quoteId: q.id,
                                payment_terms: "deposit",
                                origin: window.location.origin,
                              },
                            });
                            return res;
                          },
                          "Invoice created and emailed",
                        )
                      }
                      className="inline-flex items-center gap-2 border border-imperium px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium disabled:opacity-50"
                    >
                      Convert to invoice <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      {STAGES.map((stage) => {
        const rows = invoices.filter((i: any) => i.fulfilment_status === stage.key);
        if (!rows.length) return null;
        return (
          <section key={stage.key}>
            <h3 className="font-display text-xl">{stage.label.toUpperCase()}</h3>
            <div className="mt-4 space-y-px bg-border/40">
              {rows.map((inv: any) => {
                const balance = Math.max(0, inv.total - inv.amount_paid);
                return (
                  <div key={inv.id} className="bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {inv.invoice_number} · {inv.status.replace(/_/g, " ")} · due {inv.due_date ?? "—"}
                        </div>
                        <div className="mt-1 font-display text-lg">{inv.full_name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{inv.email}</div>
                        {inv.delivery_address && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {inv.delivery_choice === "pickup" ? "Pickup" : "Delivery"} — {inv.delivery_address}
                          </div>
                        )}
                        {!inv.delivery_address && (
                          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">
                            Delivery details not provided yet
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <div className="font-display text-2xl text-imperium">{formatNaira(balance)}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          paid {formatNaira(inv.amount_paid)} of {formatNaira(inv.total)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/api/public/pdf/invoice/${inv.public_token}`}
                            className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                          >
                            <FileDown className="h-3 w-3" /> PDF
                          </a>
                          {balance > 0 && (
                            <button
                              disabled={busy !== null}
                              onClick={() => {
                                const raw = prompt(
                                  `Amount received for ${inv.invoice_number} (balance ${formatNaira(balance)})`,
                                  String(Math.min(balance, Math.max(0, inv.deposit_amount - inv.amount_paid) || balance)),
                                );
                                if (!raw) return;
                                const amount = Math.round(Number(raw));
                                if (!amount || amount <= 0) return toast.error("Enter a valid amount");
                                act(
                                  inv.id,
                                  () =>
                                    recordPayment({
                                      data: {
                                        invoiceId: inv.id,
                                        amount,
                                        method: "transfer",
                                        kind: amount >= balance ? "balance" : "deposit",
                                      },
                                    }),
                                  "Payment recorded — receipt issued",
                                );
                              }}
                              className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground disabled:opacity-50"
                            >
                              Record payment
                            </button>
                          )}
                          {NEXT_STAGE[stage.key] && (
                            <button
                              disabled={busy !== null}
                              onClick={() =>
                                act(
                                  inv.id,
                                  () =>
                                    updateInvoice({
                                      data: {
                                        invoiceId: inv.id,
                                        fulfilment_status: NEXT_STAGE[stage.key] as
                                          | "awaiting_payment"
                                          | "in_production"
                                          | "ready"
                                          | "delivered",
                                      },
                                    }),
                                  `Moved to ${NEXT_STAGE[stage.key].replace(/_/g, " ")}`,
                                )
                              }
                              className="inline-flex items-center gap-2 border border-imperium px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium disabled:opacity-50"
                            >
                              Move to {NEXT_STAGE[stage.key].replace(/_/g, " ")} <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                          {inv.phone && (
                            <a
                              href={`https://wa.me/${cleanWaNumber(inv.phone)}?text=${encodeURIComponent(
                                `Hello ${inv.full_name}, this is C Imperium Branding about invoice ${inv.invoice_number}. Balance: ${formatNaira(balance)}.`,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                            >
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Counter({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl ${accent ? "text-imperium" : ""}`}>{value}</div>
    </div>
  );
}
