import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Printer, Globe, Share2, Megaphone, Sparkles, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  printer: Printer,
  globe: Globe,
  share2: Share2,
  megaphone: Megaphone,
};

const formatNaira = (n: number | null) =>
  n == null ? "" : `₦${(n / 1000).toLocaleString("en-NG", { maximumFractionDigits: 0 })}k`;

export function ServicesSection() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="services" className="relative border-t border-border/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
              [01] What we do
            </div>
            <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">
              SERVICES<br />THAT<br />SCALE.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              From a single logo to a national rollout — we treat every brief as an
              empire-in-the-making. Pricing in Naira, delivery in weeks not months.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse bg-card" />
                ))}
              {services?.map((s, idx) => {
                const Icon = ICONS[s.icon] ?? Sparkles;
                return (
                  <article
                    key={s.id}
                    className="group relative bg-card p-8 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between">
                      <Icon className="h-7 w-7 text-imperium" strokeWidth={1.5} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="mt-8 font-display text-2xl tracking-tight">
                      {s.title.toUpperCase()}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {s.description}
                    </p>
                    <div className="mt-6 flex items-end justify-between gap-3">
                      <ul className="space-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {s.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <span className="h-px w-3 bg-imperium" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {s.price_min != null && (
                        <div className="text-right">
                          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                            From
                          </div>
                          <div className="font-display text-xl text-foreground">
                            {formatNaira(s.price_min)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-imperium transition-transform duration-500 group-hover:scale-x-100" />
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
