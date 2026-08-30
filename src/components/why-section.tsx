import { useSiteSettings } from "@/lib/site-settings";

type Reason = { n: string; title: string; body: string };

const DEFAULTS: Reason[] = [
  { n: "01", title: "Strategy-First Thinking", body: "Design serves your business goals — not the other way around." },
  { n: "02", title: "Premium Quality Standard", body: "On every project, every time. No shortcuts." },
  { n: "03", title: "Clear, Structured Process", body: "Defined timelines, transparent steps, zero surprises." },
  { n: "04", title: "Full-Service Studio", body: "From concept to print to digital — under one roof." },
  { n: "05", title: "We Model What We Sell", body: "A brand that itself shows what great branding looks like." },
];

export function WhySection() {
  const { data: settings } = useSiteSettings();
  const raw = (settings as Record<string, unknown> | undefined)?.why;
  const reasons: Reason[] = Array.isArray(raw) && raw.length ? (raw as Reason[]) : DEFAULTS;

  return (
    <section id="why" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[1.4rem] uppercase tracking-[0.3em] text-imperium">Why C Imperium</div>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Your work speaks for itself — but here's the substance behind it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {reasons.map(({ n, title, body }) => (
            <article key={n} className="group border border-border/60 bg-card p-6 transition-all hover:border-imperium hover:-translate-y-1">
              <div className="font-display text-4xl text-imperium/30 leading-none">{n}</div>
              <h3 className="mt-5 font-display text-lg tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
