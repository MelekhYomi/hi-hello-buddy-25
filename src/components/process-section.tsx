import { useSiteSettings } from "@/lib/site-settings";

type Step = { n: string; title: string; body: string };

const DEFAULTS: Step[] = [
  { n: "01", title: "Discovery", body: "We learn your brand, goals & audience." },
  { n: "02", title: "Proposal", body: "Scope, pricing & timeline presented." },
  { n: "03", title: "Agreement", body: "Contract signed & deposit secured." },
  { n: "04", title: "Execution", body: "Creative work begins with regular updates." },
  { n: "05", title: "Delivery", body: "Premium packaged final files delivered." },
];

export function ProcessSection() {
  const { data: settings } = useSiteSettings();
  const raw = (settings as Record<string, unknown> | undefined)?.process;
  const steps: Step[] = Array.isArray(raw) && raw.length ? (raw as Step[]) : DEFAULTS;

  return (
    <section id="process" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[1.4rem] uppercase tracking-[0.3em] text-imperium">How we work</div>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <article key={s.n} className="relative border border-border/60 bg-card p-6 transition-all hover:border-imperium">
              <div className="font-display text-5xl text-imperium/30 leading-none">{s.n}</div>
              <h3 className="mt-5 font-display text-xl tracking-tight">{s.title.toUpperCase()}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
