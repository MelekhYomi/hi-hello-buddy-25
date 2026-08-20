import studioPhoto from "@/assets/studio-photo.jpg";
import team1 from "@/assets/team/team-1.jpg";
import team2 from "@/assets/team/team-2.jpg";
import team3 from "@/assets/team/team-3.jpg";
import team4 from "@/assets/team/team-4.jpg";
import { useSiteSettings } from "@/lib/site-settings";

const TEAM = [
  { name: "Creative Director", img: team1 },
  { name: "Brand Strategist", img: team2 },
  { name: "Design Lead", img: team3 },
  { name: "Production Manager", img: team4 },
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
};

export function AboutSection() {
  const { data: settings } = useSiteSettings();
  const raw = (settings as Record<string, unknown> | undefined)?.about as Partial<typeof DEFAULT_ABOUT> | undefined;
  const about = { ...DEFAULT_ABOUT, ...(raw ?? {}) };


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
              fontFamily: "'Poppins', sans-serif",
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Est. C Imperium
          </div>
        </div>



        {/* Copy */}
        <div>
          <div className="ci-section-label">{about.eyebrow}</div>
          <h2
            className="mt-4 mb-6"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(2.5rem, 5vw, 5rem)",
              lineHeight: 1,
              letterSpacing: "0.02em",
            }}
          >
            {about.heading_line1}
            <br />
            <span className="text-imperium">{about.heading_highlight}</span>
            <br />
            {about.heading_line3}
          </h2>
          <p
            className="mb-6 text-base font-light leading-[1.9]"
            style={{
              fontFamily: "'Poppins', sans-serif",
              color: "var(--ci-light-gray)",
            }}
          >
            {about.body1}
          </p>
          <p
            className="mb-8 text-base font-light leading-[1.9]"
            style={{
              fontFamily: "'Poppins', sans-serif",
              color: "var(--ci-gray)",
            }}
          >
            {about.body2}
          </p>

          <div
            className="mb-10 rounded-[2rem] border-l-[3px] px-8 py-6"
            style={{
              background: "var(--ci-charcoal)",
              borderColor: "var(--imperium)",
            }}
          >
            <p
              className="italic"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "1.15rem",
                color: "var(--ci-gold-light)",
              }}
            >
              "{about.quote}"
            </p>
          </div>


          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            {about.values_label}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {TEAM.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <div
                  className="ci-team-circle relative aspect-square w-full overflow-hidden rounded-full border-2 transition-colors"
                  style={{ borderColor: "var(--ci-border)", background: "var(--ci-charcoal)" }}
                >
                  <img
                    src={member.img}
                    alt={`C Imperium team member — ${member.name}`}
                    loading="lazy"
                    width={768}
                    height={768}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {member.name}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
