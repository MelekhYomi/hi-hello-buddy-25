import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCart, formatNaira } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useSiteSettings, cleanWaNumber } from "@/lib/site-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — C Imperium Branding" }] }),
  component: CheckoutPage,
});

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(7).max(30),
  delivery_address: z.string().trim().min(5).max(500),
  city: z.string().trim().max(100),
  state: z.string().trim().max(100),
  delivery_zone_id: z.string().uuid(),
  payment_method: z.enum(["online", "on_delivery", "whatsapp"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const inputClass = "w-full rounded-md border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-imperium";

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [name, setName] = useState(user?.user_metadata?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Plateau");
  const [zoneId, setZoneId] = useState("");
  const [payMethod, setPayMethod] = useState<"online" | "on_delivery" | "whatsapp">("online");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: zones } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data } = await supabase.from("delivery_zones").select("*").eq("is_active", true).order("display_order");
      return data ?? [];
    },
  });

  const zone = useMemo(() => zones?.find((z) => z.id === zoneId), [zones, zoneId]);
  const shipping = useMemo(() => {
    if (!zone) return 0;
    if (zone.free_above_amount && subtotal >= zone.free_above_amount) return 0;
    return zone.fee;
  }, [zone, subtotal]);
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="grain relative min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 pb-24 pt-32 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="mt-6 font-display text-4xl">Your cart is empty</h1>
          <p className="mt-3 text-muted-foreground">Browse the shop and add some items first.</p>
          <Link to="/shop" className="btn-cta mt-8 inline-flex h-12 px-8">Go to shop</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      customer_name: name, customer_email: email, customer_phone: phone,
      delivery_address: address, city, state: stateName, delivery_zone_id: zoneId,
      payment_method: payMethod, notes,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setBusy(true);
    const orderId = (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      user_id: user?.id ?? null,
      status: "pending",
      payment_status: payMethod === "on_delivery" ? "pay_on_delivery" : payMethod === "whatsapp" ? "whatsapp_pending" : "unpaid",
      payment_provider: payMethod === "whatsapp" ? "whatsapp" : payMethod === "online" ? "manual" : null,
      subtotal, shipping_fee: shipping, total,
      currency: "NGN",
      delivery_method: zone?.fee === 0 ? "pickup" : "standard",
      delivery_zone_id: zoneId,
      customer_name: name, customer_email: email, customer_phone: phone,
      delivery_address: address, city, state: stateName, country: "Nigeria",
      notes: notes || null,
    });

    if (error) {
      setBusy(false);
      return toast.error(error.message ?? "Couldn't place order");
    }

    const orderItems = items.map((i) => ({
      order_id: orderId,
      product_id: i.id,
      title_snapshot: i.title,
      price_snapshot: i.price,
      quantity: i.quantity,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    setBusy(false);
    if (itemsErr) return toast.error(itemsErr.message);

    if (payMethod === "whatsapp") {
      const lines = [
        `*New order from ${name}*`,
        `Order #${orderId.slice(0, 8)}`,
        ``,
        `*Items:*`,
        ...items.map((i) => `• ${i.title} × ${i.quantity} — ${formatNaira(i.price * i.quantity)}`),
        ``,
        `Subtotal: ${formatNaira(subtotal)}`,
        `Shipping: ${shipping === 0 ? "FREE" : formatNaira(shipping)}`,
        `*Total: ${formatNaira(total)}*`,
        ``,
        `*Delivery to:*`,
        `${address}`,
        `${city}, ${stateName}`,
        `Phone: ${phone}`,
        `Email: ${email}`,
        notes ? `\nNotes: ${notes}` : "",
      ].filter(Boolean).join("\n");
      const waNumber = cleanWaNumber(settings?.whatsapp_number) || "2348038577654";
      const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines)}`;
      clear();
      window.open(url, "_blank");
      navigate({ to: "/order-success", search: { id: orderId } });
      return;
    }

    if (payMethod === "online") {
      try { localStorage.setItem("ci_checkout_email", email); } catch { /* ignore */ }
      clear();
      navigate({ to: "/checkout-pay", search: { id: orderId, amount: total } });
      return;
    }


    toast.success("Order received! We'll be in touch shortly.");
    clear();
    navigate({ to: "/order-success", search: { id: orderId } });
  };

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <h1 className="font-display text-4xl md:text-5xl">CHECKOUT.</h1>
        <div className="mt-2 h-px w-24 bg-imperium" />

        <form onSubmit={submit} className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <Section title="Contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <input className={inputClass} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className={inputClass} type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className={inputClass} type="tel" placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </Section>

            <Section title="Delivery">
              <input className={inputClass} placeholder="Street address *" value={address} onChange={(e) => setAddress(e.target.value)} required />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input className={inputClass} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <input className={inputClass} placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} />
              </div>
              <div className="mt-4 space-y-2">
                {zones?.map((z) => (
                  <label key={z.id} className={`flex cursor-pointer items-start justify-between gap-3 rounded-md border p-4 transition ${zoneId === z.id ? "border-imperium bg-imperium/5" : "border-border hover:border-imperium/60"}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="zone" value={z.id} checked={zoneId === z.id} onChange={() => setZoneId(z.id)} className="mt-1 accent-[var(--imperium)]" required />
                      <div>
                        <div className="text-sm font-medium">{z.name}</div>
                        <div className="text-xs text-muted-foreground">{z.eta_days}{z.free_above_amount ? ` · Free over ${formatNaira(z.free_above_amount)}` : ""}</div>
                      </div>
                    </div>
                    <div className="font-display text-sm text-imperium">{z.fee === 0 ? "FREE" : formatNaira(z.fee)}</div>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Payment">
              <div className="space-y-2">
                <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${payMethod === "online" ? "border-imperium bg-imperium/5" : "border-border hover:border-imperium/60"}`}>
                  <input type="radio" checked={payMethod === "online"} onChange={() => setPayMethod("online")} className="mt-1 accent-[var(--imperium)]" />
                  <div>
                    <div className="text-sm font-medium">Pay online with Paystack</div>
                    <div className="text-xs text-muted-foreground">Card, bank transfer, or USSD — secured by Paystack.</div>
                  </div>

                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${payMethod === "on_delivery" ? "border-imperium bg-imperium/5" : "border-border hover:border-imperium/60"}`}>
                  <input type="radio" checked={payMethod === "on_delivery"} onChange={() => setPayMethod("on_delivery")} className="mt-1 accent-[var(--imperium)]" />
                  <div>
                    <div className="text-sm font-medium">Pay on delivery</div>
                    <div className="text-xs text-muted-foreground">Pay the dispatch rider in cash or transfer. Available within Plateau State.</div>
                  </div>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${payMethod === "whatsapp" ? "border-imperium bg-imperium/5" : "border-border hover:border-imperium/60"}`}>
                  <input type="radio" checked={payMethod === "whatsapp"} onChange={() => setPayMethod("whatsapp")} className="mt-1 accent-[var(--imperium)]" />
                  <div>
                    <div className="text-sm font-medium">Send order via WhatsApp</div>
                    <div className="text-xs text-muted-foreground">We'll open WhatsApp with your full order &amp; address. Pay manually after we confirm stock.</div>
                  </div>
                </label>
              </div>
            </Section>

            <Section title="Order notes">
              <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Anything we should know?" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Section>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 rounded-lg border border-border/60 bg-card p-6">
              <h3 className="font-display text-lg uppercase tracking-wider">Order summary</h3>
              <ul className="mt-4 space-y-3 border-y border-border/30 py-4">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 text-sm">
                    <span className="flex-1">{i.title} <span className="text-muted-foreground">× {i.quantity}</span></span>
                    <span className="font-mono">{formatNaira(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Subtotal" value={formatNaira(subtotal)} />
                <Row label="Shipping" value={shipping === 0 ? (zone ? "FREE" : "—") : formatNaira(shipping)} />
                <div className="border-t border-border/30 pt-3 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Total</span>
                  <span className="font-display text-2xl text-imperium">{formatNaira(total)}</span>
                </div>
              </div>
              <button type="submit" disabled={busy || !zoneId} className="btn-cta mt-6 h-14 w-full disabled:opacity-50">
                {busy ? "Placing order…" : "Place order"}
              </button>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-imperium" /> Secure checkout. We never share your data.</p>
            </div>
          </aside>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border/60 bg-card p-6">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
