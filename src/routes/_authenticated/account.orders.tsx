import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: OrdersPage,
});

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

function OrdersPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="font-mono text-xs uppercase text-muted-foreground">Loading…</div>;
  if (!data || !data.length)
    return (
      <div className="border border-dashed border-border/60 p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">No orders yet</p>
        <Link to="/shop" className="mt-4 inline-block text-imperium hover:underline">Browse the shop →</Link>
      </div>
    );

  return (
    <div className="divide-y divide-border/40 border-t border-b border-border/40">
      {data.map((o) => (
        <article key={o.id} className="grid grid-cols-1 gap-3 py-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {format(new Date(o.created_at), "MMM d, yyyy")}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/70">#{o.id.slice(0, 8)}</div>
          </div>
          <div className="md:col-span-6">
            <div className="font-display text-lg">{naira(Number(o.total ?? 0))}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {o.order_items?.length ?? 0} item{(o.order_items?.length ?? 0) === 1 ? "" : "s"}
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2 md:col-span-3 md:justify-end">
            <span className="border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {o.status}
            </span>
            <span className="border border-imperium/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">
              {o.payment_status}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
