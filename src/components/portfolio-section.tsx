import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight } from "lucide-react";

export function PortfolioSection() {
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
    <section id="portfolio" className="relative overflow-hidden border-t border-border/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
              [02] Selected work
            </div>
            <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">
              EVIDENCE.<br />NOT PROMISES.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Brands we've launched, rebranded, and scaled across Nigeria — from Jos
            innovation hubs to Kano hospitality and Lagos fintech.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px bg-border/40 md:grid-cols-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse bg-card" />
            ))}
          {cases?.map((c, idx) => (
            <article
              key={c.id}
              className="group relative overflow-hidden bg-card p-8 md:p-10"
            >
              <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <span>{c.industry}</span>
                <span>0{idx + 1} / 0{cases.length}</span>
              </div>

              {/* Visual block — generated cinematic gradient since no cover image yet */}
              <div className="relative mt-8 aspect-[4/3] w-full overflow-hidden bg-background">
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    background: `radial-gradient(circle at ${30 + idx * 12}% ${40 + idx * 8}%, oklch(0.58 0.24 27 / 0.55), transparent 55%), radial-gradient(circle at 70% 70%, oklch(0.2 0 0), oklch(0.04 0 0))`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-6xl tracking-tighter text-foreground/15 md:text-8xl">
                    {c.client.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent" />
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {c.client}
                  </div>
                  <h3 className="mt-2 font-display text-2xl leading-tight md:text-3xl">
                    {c.title.toUpperCase()}
                  </h3>
                  {c.results && (
                    <p className="mt-3 max-w-md text-sm text-muted-foreground">
                      {c.results}
                    </p>
                  )}
                </div>
                <ArrowUpRight
                  className="h-6 w-6 shrink-0 text-imperium transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </div>

              {c.is_featured && (
                <span className="absolute right-4 top-4 border border-imperium/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-imperium">
                  Featured
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
