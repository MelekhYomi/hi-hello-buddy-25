import studioPhoto from "@/assets/studio-photo.jpg";
import { useSiteSettings } from "@/lib/site-settings";

const DEFAULT_VALUES = [
  "Excellence",
  "Creativity",
  "Professionalism",
  "Innovation",
  "Reliability",
  "Strategic Thinking",
  "Premium Presentation",
];

const DEFAULT_ABOUT = {
  eyebrow: "Who We Are",
  heading_line1: "We Don't Just",
  heading_highlight: "Design.",
  heading_line3: "We Transform.",
  body1:
    "C Imperium is a brand transformation company focused on helping businesses, ministries, organizations, and individuals build premium visual identities and impactful brand experiences.",
  body2:
    "We believe every brand has the potential to be impossible to ignore. Our job is to unlock that potential — through strategy, design, and flawless execution.",
  quote: "We help brands become impossible to ignore.",
  values_label: "Character · Competence · Capacity",
  values: DEFAULT_VALUES,
};

export function AboutSection() {
  const { data: settings } = useSiteSettings();
  const raw = (settings as Record<string, unknown> | undefined)?.about as Partial<typeof DEFAULT_ABOUT> | undefined;
  const about = { ...DEFAULT_ABOUT, ...(raw ?? {}) };
  const values = Array.isArray(about.values) && about.values.length ? about.values : DEFAULT_VALUES;

  return (
    <section
      id="about"
      className="relative z-[2] border-t border-border/40 px-6 py-24 md:px-16 md:py-32"
      style={{ background: "var(--ci-dark)" }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-32">
        {/* Visual */}
        <div className="relative">
          <div
            className="relative aspect-[3/4] w-full overflow-hidden border"
            style={{
              background: "var(--ci-charcoal)",
              borderColor: "var(--ci-border)",
            }}
          >
            <img
              src={studioPhoto}
              alt="C Imperium branding and printing studio in Nigeria"
              loading="lazy"
              width={896}
              height={1184}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Accent square */}
          <div
            className="absolute -right-6 -bottom-6 -z-10 h-48 w-48 border-2"
            style={{ borderColor: "var(--imperium)" }}
          />
          {/* Vertical tag */}
          <div
            className="absolute -left-6 top-8 flex items-center justify-center px-4 py-2 text-base tracking-[0.1em]"
            style={{
              background: "var(--imperium)",
              color: "var(--ci-black)",
              fontFamily: "'Bebas Neue', sans-serif",
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Est. C Imperium
          </div>
        </div>

        {/* Copy */}
        <div>
          <div className="ci-section-label">Who We Are</div>
          <h2
            className="mt-4 mb-6"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.5rem, 5vw, 5rem)",
              lineHeight: 1,
              letterSpacing: "0.02em",
            }}
          >
            We Don't Just
            <br />
            <span className="text-imperium">Design.</span>
            <br />
            We Transform.
          </h2>
          <p
            className="mb-6 text-base font-light leading-[1.9]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "var(--ci-light-gray)",
            }}
          >
            C Imperium is a brand transformation company focused on helping
            businesses, ministries, organizations, and individuals build premium
            visual identities and impactful brand experiences.
          </p>
          <p
            className="mb-8 text-base font-light leading-[1.9]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "var(--ci-gray)",
            }}
          >
            We believe every brand has the potential to be impossible to ignore.
            Our job is to unlock that potential — through strategy, design, and
            flawless execution.
          </p>

          <div
            className="mb-10 border-l-[3px] px-8 py-6"
            style={{
              background: "var(--ci-charcoal)",
              borderColor: "var(--imperium)",
            }}
          >
            <p
              className="italic"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.15rem",
                color: "var(--ci-gold-light)",
              }}
            >
              "We help brands become impossible to ignore."
            </p>
          </div>

          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            {about.values_label}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

            {values.map((v: string, i: number) => (
              <div
                key={v}
                className="ci-value-item relative overflow-hidden border px-5 py-4 transition-colors"
                style={{ borderColor: "var(--ci-border)" }}
              >
                <span
                  className="absolute top-2 right-3"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.8rem",
                    color: "var(--ci-gold-dim)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
