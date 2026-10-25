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
  if (filter === "print")
    return s.includes("print") || s.includes("packag") || s.includes("apparel");
  if (filter === "digital") return s.includes("web") || s.includes("digital") || s.includes("tech");
  if (filter === "social") return s.includes("social") || s.includes("media");
  return true;
}

const SERVICES = [
  { id: "branding", label: "Branding" },
  { id: "print", label: "Print" },
  { id: "apparel", label: "Apparel" },
  { id: "digital", label: "Digital" },
  { id: "social", label: "Social Media" },
  { id: "event", label: "Event Design" },
  { id: "campaign", label: "Campaign Design" },
];

function serviceLabel(id: string) {
  const found = SERVICES.find((s) => s.id === id);
  return found ? found.label : id;
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
            <div className="ci-section-label" style={{ fontSize: "1.4rem" }}>
              Our Work
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
              Brands we’ve worked with — each card is a real client job, showing the work we
              delivered, the services we provided, and the items produced.
            </p>
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
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading && (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <ClientCardSkeleton key={i} />
              ))}
            </>
          )}
          {visible.map((c) => (
            <ClientWorkCard key={c.id} c={c} onSelect={() => setOpen(c)} />
          ))}
          {visible.length === 0 && !isLoading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <span className="text-2xl opacity-20 mb-3">◆</span>
              <p className="text-muted-foreground text-sm">
                No work matches that filter yet.
              </p>
            </div>
          )}
        </div>

        <CaseStudyModal study={open} onClose={() => setOpen(null)} />
      </div>
    </section>
  );
}

function ClientWorkCard({
  c,
  onSelect,
}: {
  c: CaseStudy;
  onSelect: () => void;
}) {
  const gallery = (c.gallery_images ?? []).filter(Boolean);
  const services = (((c as any).services_delivered ?? []) as string[]).filter(Boolean);
  const items = (((c as any).items_delivered ?? []) as string[]).filter(Boolean);
  const primary = c.cover_image ?? gallery[0] ?? null;
  const thumbs = gallery.slice(1, 3);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative block overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-imperium hover:shadow-[0_0_40px_-12px_var(--imperium)]"
    >
      {/* Image preview area */}
      <div className="relative aspect-[4/3] bg-card/40 overflow-hidden">
        {primary ? (
          <img
            src={primary}
            alt={`${c.client} — ${c.title}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl opacity-10">◆</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {c.title}
            </span>
          </div>
        )}
        {/* Thumb stack (up to 2 extra images) */}
        {thumbs.length > 0 && (
          <div className="absolute -bottom-4 -right-4 flex gap-[-6px]">
            {thumbs.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="h-12 w-16 rounded-md border border-imperium/20 bg-card object-cover shadow-md ring-2 ring-background"
              />
            ))}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end justify-between p-4">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-imperium font-mono">
              View case study
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-imperium" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5 pt-4">
        {/* Service tags */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {services.slice(0, 4).map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded border border-imperium/30 bg-imperium/5 text-[9px] font-mono uppercase tracking-[0.15em] text-imperium"
              >
                {serviceLabel(s)}
              </span>
            ))}
          </div>
        )}

        {/* Client name */}
        <div className="font-display text-lg leading-tight">{c.client}</div>

        {/* Items delivered */}
        {items.length > 0 && (
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Items: {items.slice(0, 4).join(", ")}{items.length > 4 ? " …" : ""}
          </p>
        )}

        {/* Project type / industry */}
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {c.industry}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-imperium/30 bg-imperium/5 text-imperium transition-transform group-hover:rotate-12">
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </div>
        </div>
      </div>
    </button>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-[4/3] rounded-xl bg-card/40 animate-pulse" />
      <div className="h-6 w-24 rounded bg-card/40 animate-pulse" />
      <div className="h-5 w-full rounded bg-card/40 animate-pulse" />
      <div className="h-4 w-3/4 rounded bg-card/40 animate-pulse" />
    </div>
  );
}
