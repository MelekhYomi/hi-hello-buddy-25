import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);

  const { data: items, isLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_published", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  if (!items || items.length === 0) return null;

  const list = items;
  const total = list.length;
  const go = (i: number) => setIndex(((i % total) + total) % total);

  return (
    <section
      id="testimonials"
      className="relative z-[2] overflow-hidden border-t border-border/40 px-6 py-24 md:px-16 md:py-32"
      style={{ background: "var(--ci-dark)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="ci-section-label">Client Stories</div>
            <h2
              className="mt-4"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.5rem, 5vw, 5rem)",
                lineHeight: 1,
                letterSpacing: "0.02em",
              }}
            >
              What Clients Say
            </h2>
          </div>
        </div>

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
                    fontFamily: "'Cormorant Garamond', serif",
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
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    color: "var(--ci-light-gray)",
                  }}
                >
                  "{t.quote}"
                </blockquote>
                <figcaption
                  className="mt-8 flex items-center gap-4 border-t pt-6"
                  style={{ borderColor: "var(--ci-border)" }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full border"
                    style={{
                      background: "var(--ci-gold-dim)",
                      borderColor: "var(--ci-border)",
                      color: "var(--imperium)",
                      fontFamily: "'Bebas Neue', sans-serif",
                    }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-imperium">
                      {t.company ? `${t.company}` : ""}
                      {t.role ? ` — ${t.role}` : ""}
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
      </div>
    </section>
  );
}
