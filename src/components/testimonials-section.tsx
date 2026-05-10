import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Quote, Star } from "lucide-react";

export function TestimonialsSection() {
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

  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <section id="testimonials" className="border-t border-border/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
          [03] Client voices
        </div>
        <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">
          THEY TRUSTED US<br />WITH THEIR EMPIRE.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-px bg-border/40 md:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse bg-card" />
            ))}
          {items?.map((t) => (
            <figure key={t.id} className="relative bg-card p-8">
              <Quote className="h-6 w-6 text-imperium" strokeWidth={1.5} />
              <div className="mt-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-imperium text-imperium" />
                ))}
              </div>
              <blockquote className="mt-6 text-base leading-relaxed text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-8 border-t border-border/40 pt-4">
                <div className="font-display text-lg">{t.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t.role} · {t.company}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
