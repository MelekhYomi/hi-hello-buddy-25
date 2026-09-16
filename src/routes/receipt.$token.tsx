import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Printer, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatNaira } from "@/lib/cart-context";
import { getReceipt } from "@/lib/billing.functions";

export const Route = createFileRoute("/receipt/$token")({
  head: () => ({
    meta: [
      { title: "Payment Receipt — C Imperium Branding" },
      { name: "description", content: "Your C Imperium Branding payment receipt." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiptDocPage,
});

function ReceiptDocPage() {
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
        <div className="mx-auto max-w-2xl px-6 py-24 text-center text-sm text-muted-foreground">
          Loading your receipt…
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-24">
          <h1 className="font-display text-3xl">Receipt not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">This link may be incorrect or expired.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { receipt, invoice, footer } = data;
  const amountPaidToDate = invoice?.amount_paid ?? receipt.amount;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16 print:py-6">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Payment receipt</div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs"
          >
            <Printer className="h-4 w-4" /> Print / save PDF
          </button>
        </div>

        <div className="mt-8 rounded-lg border border-border/60 bg-card/50 p-6 md:p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-imperium" />
          <h1 className="mt-4 font-display text-3xl">{receipt.receipt_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(receipt.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="mt-8 text-left">
            {invoice && (
              <Row label="Invoice" value={invoice.invoice_number} />
            )}
            {invoice?.full_name && <Row label="Received from" value={invoice.full_name} />}
            {invoice?.company && <Row label="Company" value={invoice.company} />}
            <Row label="Payment method" value={receipt.method} capitalize />
            <div className="my-4 border-t border-border/40" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Amount paid
              </span>
              <span className="font-display text-3xl text-imperium">{formatNaira(receipt.amount)}</span>
            </div>
            {invoice && (
              <>
                <Row label="Paid to date" value={formatNaira(amountPaidToDate)} />
                <Row label="Balance remaining" value={formatNaira(receipt.balance_after)} />
              </>
            )}
          </div>

          {footer && <p className="mt-8 text-xs text-muted-foreground">{footer}</p>}
        </div>

        {invoice && (
          <div className="mt-6 text-center print:hidden">
            <Link
              to="/invoice/$token"
              params={{ token: invoice.public_token }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              View full invoice <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm text-muted-foreground">
      <span>{label}</span>
      <span className={`text-foreground ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
