import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag, Minus, Plus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatNaira } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/shop/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Shop` }] }),
  component: ProductPage,
  errorComponent: ({ error }) => <div className="p-12 text-center">{error.message}</div>,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link to="/shop" className="btn-cta mt-6 h-10 px-6">Back to shop</Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-background"><span className="font-mono text-xs">Loading…</span></div>;
  if (!product) return null;

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <Link to="/shop" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to shop
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              {product.images?.[imgIdx] && (
                <img src={product.images[imgIdx]} alt={product.title} className="h-full w-full object-cover" />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.images.map((src, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`aspect-square overflow-hidden rounded-md border-2 ${i === imgIdx ? "border-imperium" : "border-transparent"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">{product.title}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl text-imperium">{formatNaira(product.price)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-base text-muted-foreground line-through">{formatNaira(product.compare_at_price)}</span>
              )}
            </div>
            <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-8 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Qty</span>
              <div className="flex items-center rounded-md border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 hover:text-imperium"><Minus className="h-4 w-4" /></button>
                <span className="px-4 font-mono text-sm">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="p-2 hover:text-imperium"><Plus className="h-4 w-4" /></button>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{product.stock} in stock</span>
            </div>

            <button
              onClick={() => add({ id: product.id, slug: product.slug, title: product.title, price: product.price, image: product.images?.[0], stock: product.stock }, qty)}
              className="btn-cta mt-6 h-14 w-full"
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>

            <div className="mt-8 space-y-2 border-t border-border/40 pt-6 text-xs text-muted-foreground">
              <p>✓ Pickup in Jos available (free)</p>
              <p>✓ Free delivery on orders over ₦50,000 within Jos</p>
              <p>✓ Pay before delivery or on delivery (within Plateau)</p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
