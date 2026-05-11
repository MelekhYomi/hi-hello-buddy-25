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
    <section id="testimonials" className="border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            Client voices
          </div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">
            TESTIMONIALS
          </h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Hear from the businesses we've transformed across Nigeria and beyond.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse bg-card" />
            ))}
          {items?.map((t) => (
            <figure
              key={t.id}
              className="group relative border border-border/60 bg-card p-8 transition-all duration-300 hover:border-imperium hover:shadow-[0_0_40px_-10px_var(--imperium)] hover:-translate-y-1"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-imperium/30" strokeWidth={1.5} />

              <div className="flex items-center gap-4">
                <img
                  src={t.avatar_url ?? `https://i.pravatar.cc/200?u=${encodeURIComponent(t.name)}`}
                  alt={t.name}
                  loading="lazy"
                  className="h-14 w-14 rounded-full border border-border object-cover"
                />
                <div>
                  <div className="font-display text-lg">{t.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t.role}, {t.company}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.rating
                        ? "h-4 w-4 fill-imperium text-imperium"
                        : "h-4 w-4 text-muted-foreground/40"
                    }
                  />
                ))}
              </div>

              <blockquote className="mt-5 text-base italic leading-relaxed text-foreground/90">
                "{t.quote}"
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
