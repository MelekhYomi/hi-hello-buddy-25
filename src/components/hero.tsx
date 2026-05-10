export function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-imperium/20 blur-[120px] drift-1" />
        <div className="absolute left-[15%] top-[20%] h-[40vw] w-[40vw] rounded-full bg-imperium/10 blur-[100px] drift-2" />
        <div className="absolute right-[10%] bottom-[10%] h-[35vw] w-[35vw] rounded-full bg-foreground/5 blur-[100px] drift-3" />
      </div>

      {/* Concentric SVG rings — liquid metal feel */}
      <svg
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-30"
        width="900" height="900" viewBox="0 0 900 900"
      >
        <defs>
          <radialGradient id="ring-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.58 0.24 27)" stopOpacity="0" />
            <stop offset="60%" stopColor="oklch(0.58 0.24 27)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.58 0.24 27)" stopOpacity="0" />
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
            style={{
              transformOrigin: "center",
              animation: `drift-${(i % 3) + 1} ${20 + i * 2}s ease-in-out infinite`,
            }}
          />
        ))}
      </svg>

      {/* Scanning line */}
      <div className="scan-line" />

      {/* Vignette */}
      <div className="absolute inset-0 -z-10 vignette" />

      {/* Content */}
      <div className="relative mx-auto w-full max-w-7xl px-6 pt-32 pb-20 text-center">
        <div className="mb-6 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px w-8 bg-imperium" />
          <span>Branding Agency · Jos, Nigeria</span>
          <span className="h-px w-8 bg-imperium" />
        </div>

        <h1 className="font-display text-[clamp(4rem,18vw,16rem)] font-black leading-[0.85] tracking-tight">
          IMPE<span className="text-imperium">R</span>IUM
        </h1>

        <div className="mt-6 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px w-12 bg-imperium" />
          <span>From Jos to the World</span>
          <span className="h-px w-12 bg-imperium" />
        </div>

        <p className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          We build brands that command attention. Graphic design, printing, web development,
          and large-scale campaigns for businesses ready to dominate their market.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#services"
            className="inline-flex h-12 items-center bg-imperium px-8 font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Explore Services →
          </a>
          <a
            href="#portfolio"
            className="inline-flex h-12 items-center border border-foreground/40 px-8 font-mono text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-foreground"
          >
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

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Scroll</div>
        <div className="mx-auto mt-2 h-8 w-px bg-gradient-to-b from-foreground/40 to-transparent" />
      </div>
    </section>
  );
}
