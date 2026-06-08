import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { initPaystackTransaction } from "@/lib/paystack.functions";
import { toast } from "sonner";

const searchSchema = z.object({
  id: z.string(),
  amount: z.coerce.number().optional(),
});

export const Route = createFileRoute("/checkout-pay")({
  head: () => ({ meta: [{ title: "Secure Payment — C Imperium" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: PayPage,
});

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

function PayPage() {
  const { id, amount } = Route.useSearch();
  const init = useServerFn(initPaystackTransaction);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const start = async (customerEmail: string) => {
    if (!amount) {
      setError("Missing order amount.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { authorizationUrl } = await init({
        data: {
          orderId: id,
          email: customerEmail,
          amountNaira: Math.round(amount),
          callbackUrl: `${window.location.origin}/order-success?id=${id}`,
        },
      });
      window.location.href = authorizationUrl;
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : "Could not start payment";
      setError(msg);
      toast.error(msg);
    }
  };

  // Auto-start when email comes through localStorage from checkout (optional convenience)
  useEffect(() => {
    if (started.current) return;
    try {
      const cached = localStorage.getItem("ci_checkout_email");
      if (cached && cached.includes("@")) {
        setEmail(cached);
        started.current = true;
        void start(cached);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 pb-24 pt-32">
        <div className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          <Lock className="h-3 w-3" /> Secure checkout · Paystack
        </div>
        <h1 className="font-display text-4xl">PAY {amount ? naira(amount) : ""}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You'll be redirected to Paystack's secure page to complete your payment. Cards,
          bank transfer, and USSD all supported.
        </p>

        <div className="mt-8 space-y-4 rounded-lg border border-border/60 bg-card p-6">
          {busy ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting you to Paystack…
            </div>
          ) : (
            <>
              <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Email for receipt
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-border bg-background/40 px-4 py-3 text-sm outline-none focus:border-imperium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <button
                type="button"
                onClick={() => email.includes("@") && start(email)}
                disabled={!email.includes("@")}
                className="btn-cta h-14 w-full disabled:opacity-50"
              >
                Continue to Paystack
              </button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          )}
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-imperium" />
            Order #{id.slice(0, 8)} · We never see your card details.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
