import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatNaira } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — C Imperium Branding" },
      { name: "description", content: "Branded apparel, stationery and print collateral by C Imperium Branding." },
      { property: "og:title", content: "Shop — C Imperium Branding" },
      { property: "og:description", content: "Branded apparel, stationery and print collateral by C Imperium Branding." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hi-hello-buddy-25.lovable.app/shop" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://hi-hello-buddy-25.lovable.app/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [cat, setCat] = useState<string | null>(null);
  const { add } = useCart();

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("product_categories").select("*").order("display_order");
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products", cat],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("is_active", true).order("display_order");
      if (cat) q = q.eq("category_id", cat);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Our collection</div>
          <h1 className="mt-3 font-display text-5xl md:text-7xl">SHOP.</h1>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
              cat === null ? "border-imperium bg-imperium text-charleston" : "border-border text-muted-foreground hover:border-imperium hover:text-foreground"
            }`}
          >
            All
          </button>
          {cats?.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                cat === c.id ? "border-imperium bg-imperium text-charleston" : "border-border text-muted-foreground hover:border-imperium hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products?.map((p) => (
            <article key={p.id} className="group flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-imperium hover:shadow-[0_0_40px_-10px_var(--imperium)]">
              <Link to="/shop/$slug" params={{ slug: p.slug }} className="aspect-square overflow-hidden bg-muted">
                {p.images?.[0] && (
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <Link to="/shop/$slug" params={{ slug: p.slug }} className="font-display text-lg hover:text-imperium">{p.title}</Link>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-xl text-imperium">{formatNaira(p.price)}</span>
                  <button
                    onClick={() => add({ id: p.id, slug: p.slug, title: p.title, price: p.price, image: p.images?.[0], stock: p.stock })}
                    className="inline-flex items-center gap-1.5 rounded-md border border-imperium/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston"
                  >
                    <ShoppingBag className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {products?.length === 0 && (
          <p className="mt-16 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            No products in this category yet.
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
