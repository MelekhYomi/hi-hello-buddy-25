import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg.asset.json";

export function Hero() {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100vh] items-center overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg.url})` }}
      />
      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(2,2,5,0.88) 0%, rgba(8,8,12,0.75) 50%, rgba(2,2,5,0.92) 100%)",
        }}
      />
      {/* Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-[55%] -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.18 95 / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-[2] mx-auto w-full max-w-7xl px-6 md:px-16">
        <p
          className="mb-6 text-[0.75rem] font-medium uppercase text-imperium opacity-0"
          style={{ letterSpacing: "0.25em", animation: "ci-fadeUp 0.8s 0.3s forwards" }}
        >
          Brand Transformation Agency · Abuja, Nigeria
        </p>

        <h1
          className="mb-8 opacity-0"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "clamp(2.75rem, 7vw, 6.5rem)",
            lineHeight: 0.95,
            letterSpacing: "0.02em",
            animation: "ci-fadeUp 0.8s 0.5s forwards",
          }}
        >
          <span className="text-imperium">STAND</span>
          <br />
          <span>OUT.</span>
          <br />
          <span
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.3)",
              color: "transparent",
            }}
          >
            DOMINATE.
          </span>
        </h1>

        <p
          className="mb-12 max-w-[480px] text-base font-light leading-[1.7] text-[color:var(--ci-light-gray)] opacity-0 md:text-lg"
          style={{
            fontFamily: "'Poppins', sans-serif",
            animation: "ci-fadeUp 0.8s 0.7s forwards",
          }}
        >
          We help businesses, ministries, and organizations build premium visual
          identities and brand experiences that are impossible to ignore.
        </p>

        <div
          className="flex flex-wrap gap-6 opacity-0"
          style={{ animation: "ci-fadeUp 0.8s 0.9s forwards" }}
        >
          <a
            href="#portfolio"
            onClick={scrollTo("portfolio")}
            className="ci-btn-primary"
          >
            View Our Work
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#book"
            onClick={scrollTo("book")}
            className="ci-btn-outline"
          >
            Book Free Consultation
          </a>
        </div>
      </div>

      {/* Stats */}
      <div
        className="absolute right-6 bottom-12 z-[2] hidden gap-12 opacity-0 md:right-16 md:flex"
        style={{ animation: "ci-fadeUp 0.8s 1.1s forwards" }}
      >
        {[
          { n: "100+", l: "Projects Delivered" },
          { n: "5+", l: "Years Experience" },
          { n: "98%", l: "Client Satisfaction" },
        ].map((s) => (
          <div key={s.l} className="text-right">
            <div
              className="text-imperium"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "2.8rem",
                lineHeight: 1,
              }}
            >
              {s.n}
            </div>
            <div className="mt-1 text-[0.7rem] uppercase tracking-[0.15em] text-[color:var(--ci-gray)]">
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-10 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-2">
        <div
          className="h-12 w-px"
          style={{
            background: "linear-gradient(to bottom, var(--imperium), transparent)",
            animation: "ci-scrollPulse 2s infinite",
          }}
        />
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[color:var(--ci-gray)]">
          Scroll
        </span>
      </div>
    </section>
  );
}
