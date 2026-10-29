import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { serviceBySlugQuery, caseStudiesQuery, prefetch } from "@/lib/queries";
import { useState } from "react";
import { useQuoteBuilder } from "@/lib/quote-context";
import { useAuth } from "@/lib/auth-context";
import { QuoteSignInGate } from "@/components/quote-sign-in-gate";
import { BUSINESS_ID, seoHead, snippet } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const service = await queryClient.ensureQueryData(serviceBySlugQuery(params.slug));
    if (!service) throw notFound();
    await prefetch(queryClient, caseStudiesQuery);
    return service;
  },
  headers: () => ({ "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" }),
  head: ({ loaderData: service, params }) => {
    if (!service) return {};
    const path = `/services/${params.slug}`;
    const description = snippet(`${service.description} Based in Jos, Plateau State, Nigeria.`);
    return seoHead({
      title: `${service.title} in Jos, Nigeria | C Imperium Branding`,
      description,
      path,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.title,
        description: service.description,
        url: `${SITE_URL}${path}`,
        serviceType: service.title,
        provider: { "@id": BUSINESS_ID },
        areaServed: { "@type": "Country", name: "Nigeria" },
      },
    });
  },
  component: ServicePage,
});

function ServicePage() {
  const service = Route.useLoaderData();
  const { add, has, setOpen, count } = useQuoteBuilder();
  const { user } = useAuth();
  const [gate, setGate] = useState(false);
  const { data: cases } = useQuery(caseStudiesQuery);
  const features = service.features ?? [];

  const requestQuote = () => {
    if (has(service.id)) {
      if (user) setOpen(true);
      else setGate(true);
      return;
    }
    add(
      { id: service.id, type: "service", slug: service.slug, title: service.title, unitPrice: 0, onRequest: true },
      1,
      { open: !!user },
    );
    if (!user) setGate(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-24">
        <Link
          to="/"
          hash="services"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-imperium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All services
        </Link>

        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Our services</div>
        <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">{service.title}</h1>
        <div className="mt-6 h-px w-24 bg-imperium" />
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">{service.description}</p>

        {features.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">What is included</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 border border-border/60 bg-card p-4 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-imperium" />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={requestQuote}
            className="btn-cta inline-flex h-12 px-8"
          >
            {has(service.id) ? "In your request" : "Get a quote"} <FileText className="h-4 w-4" />
          </button>
          <a
            href="/#book"
            className="inline-flex h-12 items-center gap-2 border border-border px-8 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-imperium hover:text-imperium"
          >
            Book a consultation <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {cases && cases.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl">Recent work</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {cases.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/work/$slug"
                    params={{ slug: c.slug }}
                    className="block border border-border/60 bg-card p-4 transition-colors hover:border-imperium"
                  >
                    <div className="font-display text-lg">{c.client}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {c.industry}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
      <QuoteSignInGate open={gate} count={count} onClose={() => setGate(false)} />
    </div>
  );
}
