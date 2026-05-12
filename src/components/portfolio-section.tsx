import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { CaseStudyModal } from "@/components/case-study-modal";

type CaseStudy = Database["public"]["Tables"]["case_studies"]["Row"];

export function PortfolioSection() {
  const [open, setOpen] = useState<CaseStudy | null>(null);

  const { data: cases, isLoading } = useQuery({
    queryKey: ["case_studies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_studies")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="portfolio" className="relative overflow-hidden border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            Selected work
          </div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">
            PORTFOLIO
          </h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            A curated selection of our most impactful branding projects across hospitality,
            technology, fashion, and beyond.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse bg-card" />
            ))}
          {cases?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setOpen(c)}
              className="group relative block aspect-[4/5] cursor-pointer overflow-hidden border border-border/60 bg-card text-left transition-all duration-300 hover:border-imperium hover:shadow-[0_0_40px_-10px_var(--imperium)]"
            >
              {c.cover_image ? (
                <img
                  src={c.cover_image}
                  alt={`${c.title} — ${c.client}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 30% 40%, oklch(0.85 0.18 95 / 0.5), transparent 55%), oklch(0.08 0 0)`,
                  }}
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

              {c.is_featured && (
                <span className="absolute right-4 top-4 z-10 border border-imperium bg-background/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-imperium backdrop-blur">
                  Featured
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-imperium">
                  {c.industry}
                </div>
                <h3 className="mt-2 font-display text-2xl leading-tight md:text-3xl">
                  {c.title}
                </h3>
                <div className="mt-2 text-sm text-foreground/80">{c.client}</div>
                <div className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium transition-all group-hover:gap-4 group-hover:text-foreground">
                  View case study
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <CaseStudyModal study={open} onClose={() => setOpen(null)} />
    </section>
  );
}
