import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/account/bookings")({
  component: BookingsPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "border-yellow-500/40 text-yellow-400",
  confirmed: "border-emerald-500/40 text-emerald-400",
  cancelled: "border-muted-foreground/40 text-muted-foreground line-through",
  completed: "border-imperium/60 text-imperium",
};

function BookingsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-account-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="font-mono text-xs uppercase text-muted-foreground">Loading…</div>;
  if (!data || !data.length)
    return (
      <div className="border border-dashed border-border/60 p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">No bookings yet</p>
        <Link to="/" hash="book" className="mt-4 inline-block text-imperium hover:underline">
          Book a consultation →
        </Link>
      </div>
    );

  return (
    <div className="divide-y divide-border/40 border-t border-b border-border/40">
      {data.map((b) => (
        <article key={b.id} className="grid grid-cols-1 gap-4 py-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {format(new Date(b.preferred_date), "MMM d, yyyy")}
            </div>
            <div className="font-display text-xl">{b.preferred_time}</div>
          </div>
          <div className="md:col-span-6">
            <div className="font-display text-lg">{b.services?.title ?? "General consultation"}</div>
            {b.project_details && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.project_details}</p>
            )}
          </div>
          <div className="md:col-span-3 md:text-right">
            <span
              className={`inline-block border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                STATUS_COLORS[b.status] ?? "border-border text-muted-foreground"
              }`}
            >
              {b.status}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
