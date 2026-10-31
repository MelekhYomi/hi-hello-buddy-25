import { ArrowUpRight, Check, Lightbulb, Truck, type LucideIcon } from "lucide-react";

type Promotion = {
  tag: string;
  title: string;
  blurb: string;
  benefits: string[];
  href: string;
  cta: string;
  Icon: LucideIcon;
};

// Each promotion opens its own page (public/<folder>/index.html). Add a promotion here and it appears in the row.
const PROMOTIONS: Promotion[] = [
  {
    tag: "Masterclass · 2027",
    title: "Idea to Brand 2027",
    blurb: "One practical day in Jos to take your business idea to a clear, credible, market-ready brand.",
    benefits: [
      "Business Idea Canvas, pricing and break-even worked out in naira",
      "Brand foundation and a seven-day content plan",
      "A 30-day roadmap with one committed first action",
      "Printed workbook included",
    ],
    href: "/itb2027/",
    cta: "See the masterclass",
    Icon: Lightbulb,
  },
  {
    tag: "Launching soon",
    title: "Logistics Delivery",
    blurb: "Describe what needs to move. A rider is matched, you pay securely and follow it to the door.",
    benefits: [
      "Order in plain words, no long forms",
      "Your fare shown before you pay",
      "Bike, car or bus riders matched to the job",
      "Follow the delivery from pickup to drop-off",
    ],
    href: "/logistics/",
    cta: "Get early access",
    Icon: Truck,
  },
];

export function PromotionsSection() {
  return (
    <section id="promotions" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[1.4rem] uppercase tracking-[0.3em] text-imperium">Promotions</div>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            What's new at C Imperium: programmes and services built to help you start, brand and move.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {PROMOTIONS.map(({ tag, title, blurb, benefits, href, cta, Icon }) => (
            // Plain anchor: these are standalone pages, not routes of the app.
            <a
              key={href}
              href={href}
              className="group relative flex flex-col border border-border/60 bg-card p-8 transition-all hover:-translate-y-1 hover:border-imperium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-imperium"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 border border-imperium/50 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-imperium">
                  <span className="h-1.5 w-1.5 rounded-full bg-imperium" aria-hidden="true" />
                  {tag}
                </span>
                <Icon className="h-7 w-7 text-imperium/70 transition-colors group-hover:text-imperium" aria-hidden="true" />
              </div>

              <h3 className="mt-8 font-display text-3xl tracking-tight md:text-4xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{blurb}</p>

              <ul className="mb-8 mt-6 space-y-3 border-t border-border/60 pt-6">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm leading-snug">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-imperium" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <span className="mt-auto inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-imperium">
                {cta}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
