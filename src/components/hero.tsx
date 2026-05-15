import { HeroMarquee } from "@/components/hero-marquee";

const CORE_VALUES = ["Character", "Competence", "Capacity"];

export function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-imperium/15 blur-[120px] drift-1" />
        <div className="absolute left-[15%] top-[20%] h-[40vw] w-[40vw] rounded-full bg-imperium/10 blur-[100px] drift-2" />
        <div className="absolute right-[10%] bottom-[10%] h-[35vw] w-[35vw] rounded-full bg-foreground/5 blur-[100px] drift-3" />
      </div>

      {/* Concentric rings */}
      <svg
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-25 spin-slow"
        width="900" height="900" viewBox="0 0 900 900"
      >
        <defs>
          <radialGradient id="ring-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.85 0.18 95)" stopOpacity="0" />
            <stop offset="60%" stopColor="oklch(0.85 0.18 95)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.85 0.18 95)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[...Array(8)].map((_, i) => (
          <circle
            key={i}
            cx="450" cy="450"
            r={80 + i * 50}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="1"
            opacity={0.8 - i * 0.08}
          />
        ))}
      </svg>

      <div className="scan-line" />
      <div className="absolute inset-0 -z-10 vignette" />

      {/* Content */}
      <div className="relative mx-auto w-full max-w-7xl px-6 pt-32 pb-20 text-center">
        <div className="mb-8 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px w-8 bg-imperium" />
          <span>Branding Agency</span>
          <span className="h-px w-8 bg-imperium" />
        </div>

        {/* Modern marquee banner — work, products, testimonials */}
        <div className="relative mx-auto mb-10 -mx-6 md:mb-12">
          <HeroMarquee />
        </div>

        <h1 className="font-display text-[clamp(3.5rem,14vw,12rem)] font-black leading-[0.85] tracking-tight">
          C <span className="text-imperium">IMPERIUM</span>
        </h1>

        <div className="mt-6 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px w-12 bg-imperium" />
          <span>Stand Out. Dominate.</span>
          <span className="h-px w-12 bg-imperium" />
        </div>

        <h2 className="mx-auto mt-8 max-w-3xl font-display text-3xl leading-tight md:text-5xl">
          We Build Brands <span className="text-imperium">People Remember.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Creative solutions for modern brands — through design, print, branding, and web
          experiences that actually connect.
        </p>

        <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          Minimal. Strategic. Impactful.
        </div>

        {/* Core values */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-5">
          {CORE_VALUES.map((v, i) => (
            <div key={v} className="flex items-center gap-3 md:gap-5">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-imperium" />}
              <span className="font-display text-base font-semibold tracking-[0.2em] text-foreground md:text-lg">
                {v.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#services" className="btn-cta h-12 px-8">
            Explore Services →
          </a>
          <a href="#portfolio" className="btn-outline-cta h-12 px-8">
            ▷ View Portfolio
          </a>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Or chat with us on WhatsApp
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Scroll</div>
        <div className="mx-auto mt-2 h-8 w-px bg-gradient-to-b from-foreground/40 to-transparent" />
      </div>
    </section>
  );
}
