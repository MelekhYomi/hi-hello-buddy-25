import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatNaira } from "@/lib/cart-context";

export function ProductsSection() {
  const { add } = useCart();
  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,title,description,price,compare_at_price,images,stock")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("display_order")
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="products" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[1.4rem] uppercase tracking-[0.3em] text-imperium">Our Collection</div>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Branded apparel, stationery, and print collateral — designed and produced in-house.
            Add to cart, choose your delivery, and we'll handle the rest.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products?.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-imperium hover:shadow-[0_0_40px_-10px_var(--imperium)]"
            >
              <Link
                to="/shop/$slug"
                params={{ slug: p.slug }}
                data-track={`product-card:${p.slug}`}
                className="aspect-square overflow-hidden bg-muted"
              >
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <Link to="/shop/$slug" params={{ slug: p.slug }} className="font-display text-lg leading-tight hover:text-imperium">
                  {p.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="font-display text-xl text-imperium">{formatNaira(p.price)}</span>
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="ml-2 text-xs text-muted-foreground line-through">
                        {formatNaira(p.compare_at_price)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      add({
                        id: p.id,
                        slug: p.slug,
                        title: p.title,
                        price: p.price,
                        image: p.images?.[0],
                        stock: p.stock,
                      })
                    }
                    data-track={`add-to-cart:${p.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-imperium/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium transition-colors hover:bg-imperium hover:text-charleston"
                  >
                    <ShoppingBag className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/shop" className="btn-outline-cta inline-flex h-12 px-8" data-track="view-all-products">
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
