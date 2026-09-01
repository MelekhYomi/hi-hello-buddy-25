import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Printer } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatNaira } from "@/lib/cart-context";
import { getReceipt } from "@/lib/billing.functions";

export const Route = createFileRoute("/receipt/$token")({
  head: () => ({
    meta: [
      { title: "Your Receipt — C Imperium Branding" },
      { name: "description", content: "Official payment receipt from C Imperium Branding." },
      { property: "og:title", content: "Your Receipt — C Imperium Branding" },
      { property: "og:description", content: "Official payment receipt from C Imperium Branding." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { token } = Route.useParams();
  const fetchReceipt = useServerFn(getReceipt);
  const { data, isLoading } = useQuery({
    queryKey: ["receipt", token],
    queryFn: () => fetchReceipt({ data: { token } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-muted-foreground">Loading receipt…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="font-display text-3xl">Receipt not found</h1>
          <Link to="/" className="btn-cta mt-6 inline-flex h-11 items-center px-5">
            Back home
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { receipt, invoice, footer } = data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg border border-imperium/40 bg-card/50 p-8">
          <CheckCircle2 className="h-9 w-9 text-imperium" strokeWidth={1.5} />
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            Payment received
          </div>
          <h1 className="mt-3 font-display text-4xl leading-none">{receipt.receipt_number}</h1>

          <dl className="mt-8 space-y-3 text-sm">
            <Row label="Amount paid" value={formatNaira(receipt.amount)} strong />
            <Row label="Payment method" value={receipt.method} />
            <Row label="Invoice" value={invoice?.invoice_number ?? "—"} />
            <Row label="Billed to" value={invoice?.full_name ?? "—"} />
            <Row label="Outstanding balance" value={formatNaira(receipt.balance_after)} />
            <Row label="Date" value={new Date(receipt.created_at).toLocaleString("en-NG")} />
          </dl>

          <p className="mt-8 text-sm text-muted-foreground">
            {receipt.balance_after === 0
              ? "Your payment is complete. We're on your job and will contact you for delivery or pickup once it's ready."
              : "Your job is now in production. The remaining balance is due on delivery."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs"
            >
              <Printer className="h-4 w-4" /> Print / save PDF
            </button>
            {invoice?.public_token && (
              <Link
                to="/invoice/$token"
                params={{ token: invoice.public_token }}
                className="inline-flex items-center rounded-md border border-border px-4 py-2 text-xs"
              >
                View invoice
              </Link>
            )}
          </div>

          {footer && <p className="mt-8 text-xs text-muted-foreground">{footer}</p>}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-display text-xl text-imperium" : ""}>{value}</dd>
    </div>
  );
}
