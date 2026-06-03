import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
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
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function PayPage() {
  const { id, amount } = Route.useSearch();
  const navigate = useNavigate();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter the name on card");
    setBusy(true);
    // Simulated processing — pretend we're talking to Stripe
    await new Promise((r) => setTimeout(r, 1400));
    await supabase
      .from("orders")
      .update({ payment_status: "paid", payment_provider: "stripe_demo", payment_ref: `demo_${Date.now()}` })
      .eq("id", id);
    setBusy(false);
    toast.success("Payment successful");
    navigate({ to: "/order-success", search: { id } });
  };

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 pb-24 pt-32">
        <div className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          <Lock className="h-3 w-3" /> Secure checkout · Demo
        </div>
        <h1 className="font-display text-4xl">PAY {amount ? naira(amount) : ""}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a sandbox payment page (Stripe integration pending live keys). Use the test card already filled in
          and click Pay to complete your order.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-lg border border-border/60 bg-card p-6">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Name on card</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background/40 px-4 py-3 text-sm outline-none focus:border-imperium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Card number</label>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background/40 px-4">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent py-3 font-mono text-sm outline-none"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Expiry</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background/40 px-4 py-3 font-mono text-sm outline-none focus:border-imperium"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">CVC</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background/40 px-4 py-3 font-mono text-sm outline-none focus:border-imperium"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn-cta mt-4 h-14 w-full disabled:opacity-50">
            {busy ? "Processing…" : `Pay ${amount ? naira(amount) : "now"}`}
          </button>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-imperium" />
            Demo mode — no real charge will be made. Order #{id.slice(0, 8)}.
          </p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
