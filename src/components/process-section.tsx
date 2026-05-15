const STEPS = [
  { n: "01", title: "Discover", body: "We understand your brand, audience, and goals." },
  { n: "02", title: "Create", body: "We design, refine, and build with strategy and creativity." },
  { n: "03", title: "Deliver", body: "Polished results ready to help your brand stand out." },
];

export function ProcessSection() {
  return (
    <section id="process" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">How we work</div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">OUR PROCESS</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className="relative border border-border/60 bg-card p-8 transition-all hover:border-imperium">
              <div className="font-display text-6xl text-imperium/30 leading-none">{s.n}</div>
              <h3 className="mt-6 font-display text-2xl tracking-tight">{s.title.toUpperCase()}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
