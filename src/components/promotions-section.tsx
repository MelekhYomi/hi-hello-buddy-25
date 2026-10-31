import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Calendar, Check, Gift, GraduationCap, Lightbulb, Megaphone, Rocket, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { promotionsQuery } from "@/lib/queries";

// Admin picks an icon name per promotion (Admin > Promotions).
const ICONS: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  truck: Truck,
  sparkles: Sparkles,
  megaphone: Megaphone,
  gift: Gift,
  calendar: Calendar,
  "graduation-cap": GraduationCap,
  rocket: Rocket,
};

export function PromotionsSection() {
  const { data } = useQuery(promotionsQuery);
  const promotions = data ?? [];
  if (promotions.length === 0) return null;
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
          {promotions.map(({ slug, tag, title, blurb, benefits, card_cta: cta, icon }) => {
            const Icon = ICONS[icon] ?? Sparkles;
            return (
            // Opens in a new tab so the visitor keeps their place on the home page.
            <a
              key={slug}
              href={`/promo/${slug}`}
              target="_blank"
              rel="noopener"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
