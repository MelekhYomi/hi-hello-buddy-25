const REASONS = [
  { n: "01", title: "Strategy-First Thinking", body: "Design serves your business goals — not the other way around." },
  { n: "02", title: "Premium Quality Standard", body: "On every project, every time. No shortcuts." },
  { n: "03", title: "Clear, Structured Process", body: "Defined timelines, transparent steps, zero surprises." },
  { n: "04", title: "Full-Service Studio", body: "From concept to print to digital — under one roof." },
  { n: "05", title: "We Model What We Sell", body: "A brand that itself shows what great branding looks like." },
];

export function WhySection() {
  return (
    <section id="why" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Why C Imperium</div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">WHY CLIENTS CHOOSE US</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Your work speaks for itself — but here's the substance behind it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {REASONS.map(({ n, title, body }) => (
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
