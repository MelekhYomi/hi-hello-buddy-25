import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Printer, Globe, Share2, Megaphone, Sparkles, ArrowRight, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  printer: Printer,
  globe: Globe,
  share2: Share2,
  megaphone: Megaphone,
};

const formatNaira = (n: number | null) =>
  n == null ? "" : `₦${n.toLocaleString("en-NG")}`;

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
    <section id="services" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            What we do
          </div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">
            OUR SERVICES
          </h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            From concept to execution, we deliver comprehensive branding solutions that transform
            businesses into market leaders.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse bg-card" />
            ))}
          {services?.map((s) => {
            const Icon = ICONS[s.icon] ?? Sparkles;
            const isMonthly = s.slug === "social-media";
            return (
              <article
                key={s.id}
                className="group relative flex flex-col border border-border/60 bg-card p-8 transition-all duration-300 hover:border-imperium hover:shadow-[0_0_40px_-10px_var(--imperium)] hover:-translate-y-1"
              >
                <Icon className="h-8 w-8 text-imperium transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />

                <h3 className="mt-8 font-display text-2xl tracking-tight">
                  {s.title.toUpperCase()}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>

                {s.price_min != null && (
                  <div className="mt-5 font-mono text-xs tracking-wider text-imperium">
                    {formatNaira(s.price_min)} - {formatNaira(s.price_max)}{isMonthly ? "/month" : ""}
                  </div>
                )}

                <ul className="mt-5 flex-1 space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-imperium" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={`#book?service=${s.slug}`}
                  className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium transition-all hover:gap-4"
                >
                  Book now <ArrowRight className="h-3.5 w-3.5" />
                </a>

                <div className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-imperium transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
