import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { initPaystackTransaction, verifyPaystackTransaction } from "@/lib/paystack.functions";
import type { Promotion } from "@/lib/promotions-defaults";

/** Seat pricing for Idea to Brand 2027. One order = one seat booking (a team pays as a single contact). */
const TIERS = [
  { id: "individual", label: "Individual", note: "1 participant", price: 50_000 },
  { id: "team5", label: "Team of 5", note: "5 participants · save ₦50,000", price: 200_000 },
  { id: "team10", label: "Team of 10", note: "10 participants · save ₦100,000", price: 400_000 },
] as const;

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

/**
 * Seat picker + contact details. Creates the order the Paystack flow needs, then hands the
 * browser to Paystack's hosted checkout. Payment returns to /idea2brand, which verifies the
 * reference and shows the join-cohort screen.
 */
export function Idea2BrandPay() {
  const init = useServerFn(initPaystackTransaction);
  const [tierId, setTierId] = useState<string>(TIERS[0].id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[0];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const orderId = (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { error: orderErr } = await supabase.from("orders").insert({
        id: orderId,
        status: "pending",
        payment_status: "unpaid",
        payment_provider: null,
        subtotal: tier.price,
        shipping_fee: 0,
        total: tier.price,
        currency: "NGN",
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        delivery_address: "Idea to Brand 2027 seat",
        country: "Nigeria",
        notes: `Idea to Brand 2027 — ${tier.label} (${tier.note})`,
      });
      if (orderErr) throw new Error(orderErr.message);

      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: orderId,
        product_id: null,
        title_snapshot: `Idea to Brand 2027 — ${tier.label}`,
        price_snapshot: tier.price,
        quantity: 1,
      });
      if (itemErr) throw new Error(itemErr.message);

      const res = await init({
        data: {
          orderId,
          email: email.trim(),
          amountNaira: tier.price,
          callbackUrl: `${window.location.origin}/idea2brand`,
        },
      });
      const url = res?.authorizationUrl;
      if (!url) throw new Error("Payment could not be started. Please try again.");
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form className="pay" onSubmit={submit}>
      <fieldset>
        <legend className="pay-title">Choose your seat</legend>
        <div className="tiers">
          {TIERS.map((t) => (
            <label className="tier" key={t.id}>
              <input
                type="radio"
                name="itb-tier"
                value={t.id}
                checked={tierId === t.id}
                onChange={() => setTierId(t.id)}
              />
              <span className="t-text">
                <span className="t-name">{t.label}</span>
                <span className="t-note">{t.note}</span>
              </span>
              <span className="t-price">{naira(t.price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="fields">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          required
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          autoComplete="tel"
          inputMode="tel"
          required
        />
      </div>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Opening secure checkout…" : <>Pay {naira(tier.price)} <span aria-hidden="true">→</span></>}
      </button>

      {error && <p className="err" role="alert">{error}</p>}

      <p className="fine">
        Secure payment by Paystack (card or transfer). Your seat is confirmed the moment payment succeeds —
        you will then join the cohort.
      </p>
    </form>
  );
}

/**
 * Post-payment screen: verifies the Paystack reference, then takes the participant into the
 * WhatsApp cohort group.
 */
export function Idea2BrandJoin({ promo, reference }: { promo: Promotion; reference: string }) {
  const verify = useServerFn(verifyPaystackTransaction);
  const [state, setState] = useState<"checking" | "ok" | "failed">("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const res = await verify({ data: { reference } });
        if (alive) setState(res?.ok ? "ok" : "failed");
      } catch {
        if (alive) setState("failed");
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [verify, reference, attempt]);

  const p = promo.page;
  const group = (p.whatsapp_group ?? "").trim();
  const hasGroup = /^https:\/\/(chat\.whatsapp\.com|wa\.me)\//i.test(group);
  const wa = `https://wa.me/${p.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(p.whatsapp_message)}`;

  return (
    <section className="join">
      <div className="wrap">
        <div className="join-card">
          {state === "checking" && (
            <>
              <Loader2 className="join-icon spin" aria-hidden="true" />
              <h1>Confirming your payment…</h1>
              <p>This only takes a few seconds.</p>
            </>
          )}

          {state === "ok" && (
            <>
              <CheckCircle2 className="join-icon ok" aria-hidden="true" />
              <h1>Payment confirmed</h1>
              <p>
                Your seat for <b>Idea to Brand 2027</b> is secured — 5 January 2027, 10am–1pm. Check your
                email for the receipt.
              </p>
              {hasGroup ? (
                <a className="btn" href={group} target="_blank" rel="noopener noreferrer">
                  Join the cohort <span aria-hidden="true">→</span>
                </a>
              ) : (
                <>
                  <p className="join-note">
                    The cohort group link is being finalised — you will get it on WhatsApp at the number you
                    paid with.
                  </p>
                  <a className="btn line" href={wa} target="_blank" rel="noopener noreferrer">
                    Chat with us on WhatsApp
                  </a>
                </>
              )}
            </>
          )}

          {state === "failed" && (
            <>
              <AlertTriangle className="join-icon warn" aria-hidden="true" />
              <h1>We couldn't confirm that payment</h1>
              <p>
                If you were charged, please don't pay again — send us your reference and we will sort it out.
              </p>
              <p className="join-ref">Reference: {reference}</p>
              <div className="join-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setState("checking");
                    setAttempt((a) => a + 1);
                  }}
                >
                  Check again
                </button>
                <a className="btn line" href={wa} target="_blank" rel="noopener noreferrer">
                  Message us on WhatsApp
                </a>
              </div>
            </>
          )}

          <Link to="/idea2brand" className="join-back">← Back to Idea to Brand 2027</Link>
        </div>
      </div>
    </section>
  );
}
