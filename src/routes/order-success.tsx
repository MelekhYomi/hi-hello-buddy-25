import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order received — C Imperium" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : "",
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { id } = Route.useSearch();
  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-32 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-imperium" />
        <h1 className="mt-6 font-display text-5xl">ORDER RECEIVED.</h1>
        <p className="mt-4 text-muted-foreground">
          Thank you. We've received your order and will be in touch shortly to confirm payment and delivery.
        </p>
        {id && (
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Reference: {id.slice(0, 8)}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="btn-outline-cta h-12 px-8">Continue shopping</Link>
          <Link to="/" className="btn-cta h-12 px-8">Back home</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
