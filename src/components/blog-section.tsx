const POSTS = [
  {
    tag: "Branding",
    date: "May 2026",
    read: "5 min read",
    title: "Why Your Logo Is Not Your Brand",
    excerpt:
      "Most businesses mistake their logo for their brand identity. Here's what true brand transformation actually means — and why it matters for your growth.",
  },
  {
    tag: "Strategy",
    date: "April 2026",
    read: "7 min read",
    title: "The Psychology of Colour in Brand Identity",
    excerpt:
      "Colour is one of the most powerful tools in a brand's arsenal. Discover how the right palette can shape perception, build trust, and drive buying decisions.",
  },
  {
    tag: "Growth",
    date: "March 2026",
    read: "6 min read",
    title: "5 Signs It's Time to Rebrand Your Business",
    excerpt:
      "Is your brand still working for you? These five indicators will tell you when a strategic rebrand isn't just an option — it's a necessity.",
  },
];

export function BlogSection() {
  return (
    <section
      id="blog"
      className="relative z-[2] border-t border-border/40 px-6 py-24 md:px-16 md:py-32"
      style={{ background: "var(--ci-black)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="ci-section-label">Branding Insights</div>
            <h2
              className="mt-4"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.5rem, 5vw, 5rem)",
                lineHeight: 1,
                letterSpacing: "0.02em",
              }}
            >
              From The Studio
            </h2>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <article
              key={p.title}
              className="ci-blog-card group cursor-pointer overflow-hidden border transition-all"
              style={{
                background: "var(--ci-dark)",
                borderColor: "var(--ci-border)",
              }}
            >
              <div
                className="relative flex aspect-video items-center justify-center overflow-hidden"
                style={{ background: "var(--ci-charcoal)" }}
              >
                <span
                  className="px-4 text-center text-sm italic"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "var(--ci-gray)",
                  }}
                >
                  Insert article cover image
                </span>
                <span
                  className="absolute bottom-3 left-3 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em]"
                  style={{
                    background: "var(--imperium)",
                    color: "var(--ci-black)",
                  }}
                >
                  {p.tag}
                </span>
              </div>
              <div className="p-8">
                <div className="mb-3 text-[0.7rem] uppercase tracking-[0.12em] text-imperium">
                  {p.date} · {p.read}
                </div>
                <h3
                  className="mb-4 transition-colors group-hover:text-imperium"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    letterSpacing: "0.03em",
                    lineHeight: 1.2,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-sm leading-[1.7]"
                  style={{ color: "var(--ci-gray)" }}
                >
                  {p.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-imperium transition-all group-hover:gap-3">
                  Read More →
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
