import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Quote, Sparkles } from "lucide-react";

type Card = {
  key: string;
  kind: "work" | "product" | "quote" | "about";
  title: string;
  subtitle?: string;
  image?: string | null;
  tag?: string;
  href?: string;
};

const FALLBACK: Card[] = [
  { key: "f1", kind: "about", title: "Brand Identity", subtitle: "Logos that command attention", tag: "About", href: "/#services" },
  { key: "f2", kind: "about", title: "Print & Packaging", subtitle: "Tactile, premium, unforgettable", tag: "About", href: "/#services" },
  { key: "f3", kind: "about", title: "Web Experiences", subtitle: "Sites that actually convert", tag: "About", href: "/#services" },
  { key: "f4", kind: "quote", title: "“They turned our brand into a presence.”", subtitle: "— Adaeze, Lagos", tag: "Client", href: "/#testimonials" },
  { key: "f5", kind: "about", title: "Campaigns", subtitle: "Visuals built to dominate", tag: "About", href: "/#portfolio" },
  { key: "f6", kind: "quote", title: "“Fast, sharp, strategic.”", subtitle: "— Tunde, Abuja", tag: "Client", href: "/#testimonials" },
];

function CardTile({ c }: { c: Card }) {
  const inner = (
    <>
      {c.image ? (
        <img
          src={c.image}
          alt={c.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-imperium/15 via-background to-foreground/5" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-imperium/40 bg-background/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-imperium backdrop-blur">
        {c.kind === "quote" ? <Quote className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
        {c.tag ?? c.kind}
      </div>
      <div className="absolute inset-x-4 bottom-4">
        <div className="line-clamp-2 font-display text-base leading-tight md:text-lg">{c.title}</div>
        {c.subtitle && (
          <div className="mt-1 line-clamp-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {c.subtitle}
          </div>
        )}
      </div>
    </>
  );
  const cls = "group relative block h-44 w-72 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-imperium md:h-52 md:w-80";
  return c.href ? (
    <a href={c.href} className={cls}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Row({ items, reverse, duration }: { items: Card[]; reverse?: boolean; duration: number }) {
  const doubled = [...items, ...items];
  return (
    <div className="group relative overflow-hidden">
      <div
        className="flex gap-5 will-change-transform"
        style={{
          animation: `marquee-x ${duration}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((c, i) => (
          <CardTile key={`${c.key}-${i}`} c={c} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

export function HeroMarquee() {
  const { data: cases } = useQuery({
    queryKey: ["hero-cases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("case_studies")
        .select("id,slug,title,client,cover_image")
        .order("display_order")
        .limit(8);
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["hero-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,slug,title,description,images,is_active")
        .eq("is_active", true)
        .limit(8);
      return data ?? [];
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["hero-testimonials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id,quote,name,company")
        .limit(6);
      return data ?? [];
    },
  });

  const cards: Card[] = [
    ...(cases ?? []).map((c) => ({
      key: `c-${c.id}`,
      kind: "work" as const,
      title: c.title,
      subtitle: c.client,
      image: c.cover_image,
      tag: "Work",
    })),
    ...(products ?? []).map((p) => ({
      key: `p-${p.id}`,
      kind: "product" as const,
      title: p.title,
      subtitle: p.description ?? undefined,
      image: p.images?.[0] ?? null,
      tag: "Product",
    })),
    ...(testimonials ?? []).map((t) => ({
      key: `t-${t.id}`,
      kind: "quote" as const,
      title: `“${t.quote}”`,
      subtitle: t.company ? `— ${t.name}, ${t.company}` : `— ${t.name}`,
      tag: "Client",
    })),
  ];

  const all = cards.length >= 4 ? cards : [...cards, ...FALLBACK];
  const half = Math.ceil(all.length / 2);
  const rowA = all.slice(0, half);
  const rowB = all.slice(half).concat(all.slice(0, Math.max(0, 4 - (all.length - half))));

  return (
    <div className="relative w-full space-y-4">
      <Row items={rowA} duration={45} />
      <Row items={rowB.length ? rowB : rowA} reverse duration={55} />
    </div>
  );
}
