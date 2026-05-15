import { Compass, Sparkles, Zap, Layers } from "lucide-react";

const REASONS = [
  { icon: Compass, title: "Clean Creative Direction", body: "Every detail is designed with purpose." },
  { icon: Sparkles, title: "Modern Brand Thinking", body: "We create work that feels current, timeless, and relevant." },
  { icon: Zap, title: "Fast & Reliable Delivery", body: "Quality work. Clear communication. No unnecessary delays." },
  { icon: Layers, title: "Tailored Solutions", body: "Every brand is different. Your solutions should be too." },
];

export function WhySection() {
  return (
    <section id="why" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">The difference</div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">WHY C IMPERIUM?</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="group border border-border/60 bg-card p-7 transition-all hover:border-imperium hover:-translate-y-1">
              <Icon className="h-7 w-7 text-imperium" strokeWidth={1.5} />
              <h3 className="mt-6 font-display text-xl tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
