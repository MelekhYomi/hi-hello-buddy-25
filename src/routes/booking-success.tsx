import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { verifyBookingPayment } from "@/lib/paystack.functions";

export const Route = createFileRoute("/booking-success")({
  head: () => ({ meta: [{ title: "Booking received — C Imperium" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { reference?: string; trxref?: string } => ({
    reference: typeof s.reference === "string" ? s.reference : undefined,
    trxref: typeof s.trxref === "string" ? s.trxref : undefined,
  }),
  component: BookingSuccess,
});

function BookingSuccess() {
  const { reference, trxref } = Route.useSearch();
  const verify = useServerFn(verifyBookingPayment);
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
              Your payment didn't go through. You can try booking again or contact us for help.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-imperium" />
            <h1 className="mt-6 font-display text-5xl">
              {state === "paid" ? "CONSULTATION BOOKED." : "BOOKING RECEIVED."}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {state === "paid"
                ? "Payment confirmed — your consultation is booked. We'll email a confirmation shortly."
                : "Thank you. We've received your booking and will confirm by email shortly."}
            </p>
          </>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-cta h-12 px-8">
            Back home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
