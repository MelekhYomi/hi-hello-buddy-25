import { ChevronDown } from "lucide-react";

// Questions people ask before hiring a branding agency in Jos. The same list feeds the page and the
// FAQPage structured data in the home route (src/routes/index.tsx), so both always say the same thing.
export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: "What does a branding agency in Jos like C Imperium do?",
    a: "We design and produce everything that makes a business recognisable: brand identity and logo design, print and packaging, social media branding, web design and large-scale campaigns. We also print and supply branded products such as business cards, apparel and stationery.",
  },
  {
    q: "Where is C Imperium located and when are you open?",
    a: "We are at No. 4 Boulevard Road, Shop 2, Jolex Plaza, Jos, Plateau State, Nigeria. We are open Monday to Friday, 9am to 5pm. You can also reach us on WhatsApp or by email at info@cimperiumbrand.com.",
  },
  {
    q: "How much does branding or logo design cost?",
    a: "Every project is priced to its brief, so there is no fixed price list. Choose the services you need on this page, tell us the details, and we send you a priced quote. You can also book a consultation first and talk it through with the team.",
  },
  {
    q: "Do you only work with businesses in Jos?",
    a: "We are based in Jos, but we work with businesses, churches, ministries, organisations and campaigns across Nigeria. Our portfolio shows the kind of work we have delivered.",
  },
  {
    q: "How do I get started?",
    a: "Request a quote from the services section, or book a consultation and we will call you back. Once the scope is clear, we send a quote, you approve it, and we begin.",
  },
  {
    q: "Can I order branded products online?",
    a: "Yes. The shop has branded stationery, apparel and accessories. Add items to your cart, choose your delivery option at checkout and we handle the rest.",
  },
];

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function FaqSection() {
  return (
    <section id="faq" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="font-mono text-[1.4rem] uppercase tracking-[0.3em] text-imperium">Questions</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Straight answers about working with a branding agency in Jos.
          </p>
        </div>

        <div className="mt-12 border-t border-border/60">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="group border-b border-border/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-display text-lg tracking-tight marker:hidden [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-lg tracking-tight">{f.q}</h3>
                <ChevronDown className="h-5 w-5 shrink-0 text-imperium transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-6 pr-8 text-sm leading-relaxed text-muted-foreground md:text-base">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
