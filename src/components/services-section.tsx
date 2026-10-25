import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Palette,
  Printer,
  Globe,
  Share2,
  Megaphone,
  Sparkles,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useQuoteBuilder } from "@/lib/quote-context";
import { useAuth } from "@/lib/auth-context";
import { QuoteSignInGate } from "@/components/quote-sign-in-gate";

const ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  printer: Printer,
  globe: Globe,
  share2: Share2,
  megaphone: Megaphone,
};

export function ServicesSection() {
  const { add, has, setOpen, count } = useQuoteBuilder();
  const { user } = useAuth();
  const [gate, setGate] = useState(false);

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

  const requestQuote = (service: {
    id: string;
    slug: string;
    title: string;
  }) => {
    if (has(service.id)) {
      // Already chosen — just show the request.
      if (user) setOpen(true);
      else setGate(true);
      return;
    }
    add(
      {
        id: service.id,
        type: "service",
        slug: service.slug,
        title: service.title,
        // Services are never pre-priced. The team quotes each line by hand.
        unitPrice: 0,
        onRequest: true,
      },
      1,
      // Signed-out visitors get the sign-in gate instead of the drawer.
      { open: !!user },
    );
    if (!user) setGate(true);
  };

  const goToConsultation = () => {
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", "#book");
  };

  return (
    <section id="services" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[1.4rem] uppercase tracking-[0.3em] text-imperium">
            What we do
          </div>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Pick what you need. Tell us the brief. We price it and come back to you — no guesswork,
            no haggling with a price list.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse bg-card" />
            ))}
          {services?.map((s) => {
            const Icon = ICONS[s.icon] ?? Sparkles;
            const chosen = has(s.id);
            return (
              <article
                key={s.id}
                className="group relative flex flex-col border border-border/60 bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-imperium hover:shadow-[0_0_40px_-10px_var(--imperium)]"
              >
                <Icon
                  className="h-8 w-8 text-imperium transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.5}
                />

                <h3 className="mt-8 font-display text-2xl tracking-tight">
                  {s.title.toUpperCase()}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.description}</p>

                <ul className="mt-5 flex-1 space-y-2">
                  {(s.features ?? []).map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-imperium" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => requestQuote(s)}
                  aria-pressed={chosen}
                  className={
                    chosen
                      ? "mt-8 inline-flex h-11 w-full items-center justify-center gap-2 border border-imperium/60 bg-imperium/10 px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-imperium transition-colors hover:bg-imperium/15"
                      : "btn-cta mt-8 inline-flex h-11 w-full items-center justify-center gap-2 px-6"
                  }
                >
                  {chosen ? (
                    <>
                      <Check className="h-4 w-4" /> In your request
                    </>
                  ) : (
                    <>
                      Get a Quote <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-imperium transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            );
          })}
        </div>

        {/* One calm escape hatch instead of a button on every card. */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Not sure what you need?{" "}
            <button
              type="button"
              onClick={goToConsultation}
              className="story-link font-medium text-foreground underline decoration-imperium decoration-2 underline-offset-4 hover:text-imperium"
            >
              Talk it through with the team
            </button>{" "}
            instead of building a quote.
          </p>
        </div>
      </div>

      <QuoteSignInGate open={gate} count={count} onClose={() => setGate(false)} />
    </section>
  );
}
