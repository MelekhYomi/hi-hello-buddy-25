import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { testimonialsQuery } from "@/lib/queries";
import { useSiteSettings } from "@/lib/site-settings";

type GoogleSummary = {
  rating?: number | null;
  total?: number | null;
  maps_url?: string | null;
  review_url?: string | null;
};

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const { data: settings } = useSiteSettings();
  const google = (settings as Record<string, unknown> | undefined)?.google_reviews as GoogleSummary | undefined;

  const { data: items, isLoading } = useQuery(testimonialsQuery);

  // Sample copy is only shown until a real (Google or hand-entered) review exists.
  const real = (items ?? []).filter((t) => t.source !== "placeholder");
  const list = real.length ? real : (items ?? []);
  const total = list.length;
  const go = (i: number) => {
    if (total === 0) return;
    setIndex(((i % total) + total) % total);
  };

  return (
    <section
      id="testimonials"
      className="relative z-[2] overflow-hidden border-t border-border/40 px-6 py-24 md:px-16 md:py-32"
      style={{ background: "var(--ci-dark)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="ci-section-label" style={{ fontSize: "1.4rem" }}>Client Stories</div>
            {google?.rating ? (
              <a
                href={google.maps_url || google.review_url || undefined}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <span className="text-imperium">{"★".repeat(Math.round(google.rating))}</span>
                <span>
                  {google.rating.toFixed(1)}
                  {google.total ? ` · ${google.total} Google review${google.total === 1 ? "" : "s"}` : " on Google"}
                </span>
              </a>
            ) : null}
          </div>
          {google?.review_url ? (
            <a
              href={google.review_url}
              target="_blank"
              rel="noreferrer"
              className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-imperium hover:text-imperium"
            >
              Review us on Google
            </a>
          ) : null}
        </div>

        {isLoading ? (
          <div
            className="h-64 animate-pulse rounded-lg border border-border/40 bg-card p-10"
            style={{ borderColor: "var(--ci-border)", background: "var(--ci-card)" }}
          />
        ) : total === 0 ? (
          <p
            className="text-sm italic"
            style={{ color: "var(--ci-gray)", fontFamily: "'Poppins', sans-serif" }}
          >
            New client stories coming soon. Check back shortly.
          </p>
        ) : (
          <>
            <div className="overflow-hidden">
              <div
                className="flex gap-8 transition-transform duration-700"
                style={{ transform: `translateX(calc(${-index} * (min(500px, 100%) + 2rem)))` }}
              >
                {list.map((t) => (
                  <figure
                    key={t.id}
                    className="relative w-full flex-shrink-0 border p-10 md:w-[500px]"
                    style={{
                      borderColor: "var(--ci-border)",
                      background: "var(--ci-card)",
                      minWidth: "min(500px, 100%)",
                    }}
                  >
                    <span
                      className="absolute top-4 left-8 opacity-40"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "5rem",
                        color: "var(--imperium)",
                        lineHeight: 1,
                      }}
                    >
                      &ldquo;
                    </span>
                    <blockquote
                      className="mt-6 italic leading-[1.8]"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "1.1rem",
                        fontWeight: 300,
                        color: "var(--ci-light-gray)",
                      }}
                    >
                      <span className="line-clamp-9">"{t.quote}"</span>
                    </blockquote>
                    <figcaption
                      className="mt-8 flex items-center gap-4 border-t pt-6"
                      style={{ borderColor: "var(--ci-border)" }}
                    >
                      {t.avatar_url && t.source !== "placeholder" ? (
                        <img
                          src={t.avatar_url}
                          alt=""
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-11 w-11 rounded-full border object-cover"
                          style={{ borderColor: "var(--ci-border)" }}
                        />
                      ) : (
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full border"
                          style={{
                            background: "var(--ci-gold-dim)",
                            borderColor: "var(--ci-border)",
                            color: "var(--imperium)",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          {(t.name || "").charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold">
                          {t.review_url ? (
                            <a href={t.review_url} target="_blank" rel="noreferrer" className="hover:text-imperium">
                              {t.name}
                            </a>
                          ) : (
                            t.name
                          )}
                        </div>
                        <div className="text-xs text-imperium">
                          {t.company ? `${t.company}` : ""}
                          {t.role ? ` — ${t.role}` : ""}
                        </div>
                        <div className="mt-0.5 text-xs text-imperium" aria-label={`${t.rating} out of 5 stars`}>
                          {"★".repeat(Math.min(5, Math.max(0, t.rating ?? 5)))}
                        </div>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="mt-12 flex items-center gap-4">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous"
                className="ci-t-nav flex h-11 w-11 items-center justify-center border text-lg transition-all"
                style={{ borderColor: "var(--ci-border)" }}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next"
                className="ci-t-nav flex h-11 w-11 items-center justify-center border text-lg transition-all"
                style={{ borderColor: "var(--ci-border)" }}
              >
                →
              </button>
              <div className="ml-4 flex gap-2">
                {list.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to testimonial ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className="h-0.5 cursor-pointer transition-all"
                    style={{
                      width: i === index ? 40 : 20,
                      background: i === index ? "var(--imperium)" : "var(--ci-border)",
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
