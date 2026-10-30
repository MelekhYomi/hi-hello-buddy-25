import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { homeBlogQuery } from "@/lib/queries";
import { DEFAULT_BLOG_COVER } from "@/lib/seo";
import { SafeImg } from "@/components/safe-img";

export function BlogSection() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: posts } = useQuery(homeBlogQuery);

  return (
    <section
      id="blog"
      className="relative z-[2] border-t border-border/40 px-6 py-24 md:px-16 md:py-32"
      style={{ background: "var(--ci-black)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="ci-section-label" style={{ fontSize: "1.4rem" }}>
              Branding Insights
            </div>
          </div>
          <Link to="/blog" className="font-mono text-[11px] uppercase tracking-[0.25em] text-imperium hover:underline">
            View all posts →
          </Link>
        </div>

        {(!posts || posts.length === 0) && (
          <p className="mt-12 text-sm italic" style={{ color: "var(--ci-gray)", fontFamily: "'Poppins', sans-serif" }}>
            New insights coming soon. Check back shortly.
          </p>
        )}

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((p) => {
            const tag = p.tags?.[0] ?? "Insights";
            let dateStr = "";
            try {
              const dateVal = p.published_at ?? p.created_at;
              if (isMounted && dateVal) {
                const dateObj = new Date(dateVal);
                if (!isNaN(dateObj.getTime())) {
                  dateStr = format(dateObj, "MMM yyyy");
                }
              }
            } catch (err) {
              console.error("Error formatting date:", err);
            }
            return (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="ci-blog-card group overflow-hidden border transition-all"
                style={{ background: "var(--ci-dark)", borderColor: "var(--ci-border)" }}
              >
                <div className="relative flex aspect-video items-center justify-center overflow-hidden" style={{ background: "var(--ci-charcoal)" }}>
                  <SafeImg
                    src={p.cover_image}
                    fallback={DEFAULT_BLOG_COVER}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-3 left-3 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ background: "var(--imperium)", color: "var(--ci-black)" }}>
                    {tag}
                  </span>
                </div>
                <div className="p-8">
                  <div className="mb-3 text-[0.7rem] uppercase tracking-[0.12em] text-imperium">{dateStr}</div>
                  <h3 className="mb-4 transition-colors group-hover:text-imperium" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.4rem", letterSpacing: "0.03em", lineHeight: 1.2 }}>
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="text-sm leading-[1.7]" style={{ color: "var(--ci-gray)" }}>{p.excerpt}</p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-imperium transition-all group-hover:gap-3">
                    Read More →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
