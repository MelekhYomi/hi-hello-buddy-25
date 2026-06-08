import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { verifyPaystackTransaction } from "@/lib/paystack.functions";

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order received — C Imperium" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : "",
    reference: typeof s.reference === "string" ? s.reference : "",
    trxref: typeof s.trxref === "string" ? s.trxref : "",
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { id, reference, trxref } = Route.useSearch();
  const verify = useServerFn(verifyPaystackTransaction);
  const ref = reference || trxref;
  const [state, setState] = useState<"idle" | "verifying" | "paid" | "pending" | "failed">(
    ref ? "verifying" : "idle",
  );

  useEffect(() => {
    if (!ref) return;
    (async () => {
      try {
        const res = await verify({ data: { reference: ref } });
        setState(res.ok ? "paid" : res.status === "abandoned" ? "failed" : "pending");
      } catch {
        setState("failed");
      }
    })();
  }, [ref, verify]);

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-32 text-center">
        {state === "verifying" ? (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-imperium" />
            <h1 className="mt-6 font-display text-4xl">CONFIRMING PAYMENT…</h1>
            <p className="mt-3 text-muted-foreground">Hold tight — verifying with Paystack.</p>
          </>
        ) : state === "failed" ? (
          <>
            <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-6 font-display text-4xl">PAYMENT NOT COMPLETED</h1>
            <p className="mt-3 text-muted-foreground">
              Your payment didn't go through. You can try again or contact us for help.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-imperium" />
            <h1 className="mt-6 font-display text-5xl">
              {state === "paid" ? "PAYMENT CONFIRMED." : "ORDER RECEIVED."}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {state === "paid"
                ? "Thank you. Your payment is confirmed and we're processing your order."
                : "Thank you. We've received your order and will be in touch shortly."}
            </p>
          </>
        )}
        {id && (
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Reference: {id.slice(0, 8)}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="btn-outline-cta h-12 px-8">
            Continue shopping
          </Link>
          <Link to="/" className="btn-cta h-12 px-8">
            Back home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
