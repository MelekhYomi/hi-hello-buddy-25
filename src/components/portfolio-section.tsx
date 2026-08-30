import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { CaseStudyModal } from "@/components/case-study-modal";

type CaseStudy = Database["public"]["Tables"]["case_studies"]["Row"];

const FILTERS = [
  { id: "all", label: "All Work" },
  { id: "brand", label: "Brand Identity" },
  { id: "print", label: "Print & Packaging" },
  { id: "digital", label: "Digital" },
  { id: "social", label: "Social Media" },
];

function matchFilter(industry: string | null, filter: string) {
  if (filter === "all") return true;
  const s = (industry ?? "").toLowerCase();
  if (filter === "brand") return s.includes("brand") || s.includes("identity");
  if (filter === "print") return s.includes("print") || s.includes("packag") || s.includes("merch");
  if (filter === "digital") return s.includes("web") || s.includes("digital") || s.includes("tech");
  if (filter === "social") return s.includes("social") || s.includes("media");
  return true;
}

export function PortfolioSection() {
  const [open, setOpen] = useState<CaseStudy | null>(null);
  const [filter, setFilter] = useState("all");

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

  const visible = (cases ?? []).filter((c) => matchFilter(c.industry, filter));

  return (
    <section
      id="portfolio"
      className="relative z-[2] overflow-hidden border-t border-border/40 px-6 py-24 md:px-16 md:py-32"
      style={{ background: "var(--ci-black)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="ci-section-label" style={{ fontSize: "1.4rem" }}>Our Work</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-wrap gap-3">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className="cursor-target px-5 py-2 text-[0.72rem] font-medium uppercase tracking-[0.1em] transition-all"
                style={{
                  background: active ? "var(--imperium)" : "transparent",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: active ? "var(--imperium)" : "var(--ci-border)",
                  color: active ? "var(--ci-black)" : "var(--ci-gray)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse bg-card" />
            ))}
          {visible.map((c, idx) => {
            const featured = idx === 0 || idx === 4;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpen(c)}
                className={`group relative block cursor-pointer overflow-hidden text-left transition-all ${
                  featured ? "md:col-span-2 md:aspect-[16/7]" : "aspect-[4/3]"
                }`}
                style={{ background: "var(--ci-charcoal)" }}
              >
                {c.cover_image ? (
                  <img
                    src={c.cover_image}
                    alt={`${c.title} — ${c.client}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--ci-charcoal), var(--ci-card))",
                      color: "var(--ci-gray)",
                    }}
                  >
                    <span className="text-2xl opacity-20">◆</span>
                    <span
                      className="italic"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {c.title}
                    </span>
                  </div>
                )}

                {/* Overlay */}
                <div
                  className="absolute inset-0 flex flex-col justify-end p-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,10,10,0.95) 0%, transparent 60%)",
                  }}
                >
                  <span className="mb-1 text-[0.65rem] uppercase tracking-[0.2em] text-imperium">
                    {c.industry}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: "1.4rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {c.title}
                  </span>
                </div>

                {/* Arrow */}
                <div
                  className="absolute top-5 right-5 flex h-9 w-9 scale-0 items-center justify-center transition-transform duration-300 group-hover:scale-100"
                  style={{ background: "var(--imperium)" }}
                >
                  <ArrowUpRight className="h-4 w-4 text-charleston" strokeWidth={2.5} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <CaseStudyModal study={open} onClose={() => setOpen(null)} />
    </section>
  );
}
