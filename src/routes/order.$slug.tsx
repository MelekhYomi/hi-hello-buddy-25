import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { initPaystackTransaction, verifyPaystackTransaction } from "@/lib/paystack.functions";
import { useSiteSettings, cleanWaNumber } from "@/lib/site-settings";
import { orderCatalogFor, type OrderCatalog, type OrderPackage } from "@/lib/order-catalog";
import { ServiceBriefForm } from "@/components/service-brief-form";

export const Route = createFileRoute("/order/$slug")({
  head: ({ params }) => {
    const catalog = orderCatalogFor(params.slug);
    return {
      meta: [
        { title: catalog ? `Place your order — ${catalog.title} | C Imperium` : "Order — C Imperium" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  // `pkg` rides along in the Paystack callback so the post-payment brief can
  // record which package was bought.
  validateSearch: (s: Record<string, unknown>): { reference?: string; trxref?: string; pkg?: string } => ({
    reference: typeof s.reference === "string" ? s.reference : undefined,
    trxref: typeof s.trxref === "string" ? s.trxref : undefined,
    pkg: typeof s.pkg === "string" ? s.pkg : undefined,
  }),
  component: OrderPage,
});

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const inputClass =
  "w-full rounded-md border border-border bg-card/60 px-4 py-3 text-base outline-none focus:border-imperium md:text-sm";

function useWaLink() {
  const { data: settings } = useSiteSettings();
  const number = cleanWaNumber(settings?.whatsapp_number) || "2348038577654";
  return (message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function OrderPage() {
  const { slug } = Route.useParams();
  const { reference, trxref, pkg } = Route.useSearch();
  const catalog = orderCatalogFor(slug);
  const ref = reference || trxref;

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      {ref && catalog ? (
        <OrderPaid catalog={catalog} reference={ref} pkgId={pkg} />
      ) : catalog ? (
        <OrderFlow catalog={catalog} />
      ) : (
        <main className="mx-auto max-w-2xl px-6 pb-24 pt-32 text-center">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="mt-6 font-display text-4xl">Nothing to order here</h1>
          <p className="mt-3 text-muted-foreground">
            That service doesn't take online orders — yet. Have a look at everything we do instead.
          </p>
          <Link to="/" className="btn-cta mt-8 inline-flex h-12 px-8">
            Back home
          </Link>
        </main>
      )}
      <SiteFooter />
    </div>
  );
}

/** Package grid: each package is an image with a Pay overlay button. */
function OrderFlow({ catalog }: { catalog: OrderCatalog }) {
  const [selected, setSelected] = useState<OrderPackage | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

  if (catalog.packages.length === 0) return <ItemsComingSoon catalog={catalog} />;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <Link
        to="/services/$slug"
        params={{ slug: catalog.slug }}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-imperium"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {catalog.title}
      </Link>

      <h1 className="mt-6 font-display text-4xl md:text-5xl">PLACE YOUR ORDER.</h1>
      <div className="mt-2 h-px w-24 bg-imperium" />
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Pick a package, pay securely with Paystack, then complete your brief — we start work as soon
        as both are in.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {catalog.packages.map((p) => (
          <PackageCard
            key={p.id}
            pkg={p}
            active={selected?.id === p.id}
            onPick={() => setSelected(p)}
          />
        ))}
      </div>

      <div ref={formRef}>
        {selected && <ContactStep catalog={catalog} pkg={selected} onClear={() => setSelected(null)} />}
      </div>
    </main>
  );
}

function PackageCard({
  pkg,
  active,
  onPick,
}: {
  pkg: OrderPackage;
  active: boolean;
  onPick: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // The prerendered <img> can 404 before React attaches onError (the error
  // never reaches us), so also check the element on mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setImgOk(false);
  }, []);

  return (
    <article
      className={`group overflow-hidden border bg-card transition-colors ${
        active ? "border-imperium" : "border-border/60 hover:border-imperium/60"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-charleston">
        {imgOk ? (
          <img
            ref={imgRef}
            src={pkg.image}
            alt={`${pkg.name} package — what's included`}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,var(--charleston),#16161a)] p-6 text-center">
            <span className="font-display text-3xl uppercase tracking-tight text-imperium">{pkg.name}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {naira(pkg.price)}
            </span>
          </div>
        )}

        {/* Pay overlay */}
        <button
          type="button"
          onClick={onPick}
          aria-label={`Pay ${naira(pkg.price)} for the ${pkg.name} package`}
          className="btn-cta absolute inset-x-4 bottom-4 h-12 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)]"
        >
          Pay {naira(pkg.price)} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl uppercase tracking-tight">{pkg.name}</h2>
          <span className="font-mono text-sm text-imperium">{naira(pkg.price)}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pkg.blurb}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {pkg.includes.map((f) => (
            <li
              key={f}
              className="border border-border/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
            >
              {f}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** Contact details → order rows → Paystack hosted checkout. */
function ContactStep({
  catalog,
  pkg,
  onClear,
}: {
  catalog: OrderCatalog;
  pkg: OrderPackage;
  onClear: () => void;
}) {
  const init = useServerFn(initPaystackTransaction);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const orderId =
        (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const summary = `${catalog.title} — ${pkg.name} package`;
      const { error: orderErr } = await supabase.from("orders").insert({
        id: orderId,
        status: "pending",
        payment_status: "unpaid",
        payment_provider: null,
        subtotal: pkg.price,
        shipping_fee: 0,
        total: pkg.price,
        currency: "NGN",
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        delivery_address: summary,
        country: "Nigeria",
        notes: summary,
      });
      if (orderErr) throw new Error(orderErr.message);

      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: orderId,
        product_id: null,
        title_snapshot: summary,
        price_snapshot: pkg.price,
        quantity: 1,
      });
      if (itemErr) throw new Error(itemErr.message);

      const res = await init({
        data: {
          orderId,
          email: email.trim(),
          amountNaira: pkg.price,
          callbackUrl: `${window.location.origin}/order/${catalog.slug}?pkg=${pkg.id}`,
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
    <div className="mt-10 rounded-lg border border-imperium/40 bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
            Your package
          </span>
          <h2 className="mt-2 font-display text-2xl">
            {catalog.title} — {pkg.name}
          </h2>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-imperium">{naira(pkg.price)}</div>
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            Choose another package
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Full name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <input
          className={inputClass}
          type="email"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          required
        />
        <input
          className={inputClass}
          type="tel"
          placeholder="Phone *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          required
        />
        <button type="submit" disabled={busy} className="btn-cta h-14 sm:col-span-3 disabled:opacity-50">
          {busy ? "Opening secure checkout…" : <>Pay {naira(pkg.price)} with Paystack</>}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Card, bank transfer and USSD supported — secured by Paystack. After payment you'll complete
        your project brief on the next step.
      </p>
    </div>
  );
}

/** Print & Packaging has no priced items yet — collect the brief on the spot. */
function ItemsComingSoon({ catalog }: { catalog: OrderCatalog }) {
  const wa = useWaLink();
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <div className="text-center">
        <PackageOpen className="mx-auto h-12 w-12 text-imperium" strokeWidth={1.5} />
        <h1 className="mt-6 font-display text-4xl">{catalog.title.toUpperCase()}.</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Our {catalog.title.toLowerCase()} items are being added to the shop. In the meantime, tell us
          what you need below and we'll price it for you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={wa(`Hi C Imperium, I'd like to place a ${catalog.title} order.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta h-12 px-8"
          >
            Message us on WhatsApp
          </a>
          <Link
            to="/services/$slug"
            params={{ slug: catalog.slug }}
            className="inline-flex h-12 items-center border border-border px-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-imperium hover:text-imperium"
          >
            ← Back to {catalog.title}
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <ServiceBriefForm serviceSlug={catalog.slug} />
      </div>
    </main>
  );
}

/** Paystack returns here with ?reference= — verify, then collect the brief on the spot. */
function OrderPaid({
  catalog,
  reference,
  pkgId,
}: {
  catalog: OrderCatalog;
  reference: string;
  pkgId?: string;
}) {
  const verify = useServerFn(verifyPaystackTransaction);
  const wa = useWaLink();
  const [state, setState] = useState<"checking" | "ok" | "failed">("checking");
  const [attempt, setAttempt] = useState(0);
  const pkgName = catalog.packages.find((p) => p.id === pkgId)?.name;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await verify({ data: { reference } });
        if (alive) setState(res?.ok ? "ok" : "failed");
      } catch {
        if (alive) setState("failed");
      }
    })();
    return () => {
      alive = false;
    };
  }, [verify, reference, attempt]);

  if (state === "ok") {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-imperium" />
          <h1 className="mt-6 font-display text-4xl md:text-5xl">PAYMENT CONFIRMED.</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Thank you — your payment for the <b>{catalog.title}</b> is confirmed. Check your email for
            the receipt. One last step: tell us about your project so we can begin.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Order reference: <span className="font-mono">{reference.slice(0, 12)}</span>
          </p>
        </div>

        <div className="mt-10">
          <ServiceBriefForm
            serviceSlug={catalog.slug}
            packageName={pkgName}
            orderReference={reference}
          />
        </div>

        <Link
          to="/services/$slug"
          params={{ slug: catalog.slug }}
          className="mt-8 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to {catalog.title}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-32 text-center">
      {state === "checking" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-imperium" />
          <h1 className="mt-6 font-display text-4xl">CONFIRMING PAYMENT…</h1>
          <p className="mt-3 text-muted-foreground">Hold tight — verifying with Paystack.</p>
        </>
      )}

      {state === "failed" && (
        <>
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
          <h1 className="mt-6 font-display text-4xl">WE COULDN'T CONFIRM THAT PAYMENT</h1>
          <p className="mt-4 text-muted-foreground">
            If you were charged, please don't pay again — send us your reference and we'll sort it out.
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Reference: {reference}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setState("checking");
                setAttempt((a) => a + 1);
              }}
              className="btn-cta h-12 px-8"
            >
              Check again
            </button>
            <a
              href={wa(`Hi C Imperium, I paid for a ${catalog.title} order but the site didn't confirm it. Reference: ${reference}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center border border-border px-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-imperium hover:text-imperium"
            >
              Message us on WhatsApp
            </a>
          </div>
        </>
      )}

      <Link
        to="/services/$slug"
        params={{ slug: catalog.slug }}
        className="mt-8 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ← Back to {catalog.title}
      </Link>
    </main>
  );
}
