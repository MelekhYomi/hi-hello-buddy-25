import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — C Imperium Branding" }] }),
  component: DashboardPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "border-yellow-500/40 text-yellow-400",
  confirmed: "border-emerald-500/40 text-emerald-400",
  cancelled: "border-muted-foreground/40 text-muted-foreground line-through",
  completed: "border-imperium/60 text-imperium",
};

function DashboardPage() {
  const { user, signOut, isAdmin } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
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

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
              Your account
            </div>
            <h1 className="mt-3 font-display text-5xl md:text-6xl">DASHBOARD.</h1>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {user?.email}
              {isAdmin && <span className="ml-3 border border-imperium/60 px-2 py-1 text-imperium">Admin</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              hash="book"
              className="border border-foreground px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-background"
            >
              New booking
            </Link>
            <button
              onClick={() => signOut()}
              className="border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl">YOUR BOOKINGS</h2>
          <div className="mt-6 divide-y divide-border/40 border-t border-b border-border/40">
            {isLoading && (
              <div className="py-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Loading…
              </div>
            )}
            {!isLoading && (!bookings || bookings.length === 0) && (
              <div className="py-12 text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  No bookings yet
                </p>
                <Link
                  to="/"
                  hash="book"
                  className="mt-4 inline-block text-imperium hover:underline"
                >
                  Book your first consultation →
                </Link>
              </div>
            )}
            {bookings?.map((b) => (
              <article key={b.id} className="grid grid-cols-1 gap-4 py-6 md:grid-cols-12">
                <div className="md:col-span-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {format(new Date(b.preferred_date), "MMM d, yyyy")}
                  </div>
                  <div className="font-display text-xl">{b.preferred_time}</div>
                </div>
                <div className="md:col-span-6">
                  <div className="font-display text-lg">
                    {b.services?.title ?? "General consultation"}
                  </div>
                  {b.project_details && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {b.project_details}
                    </p>
                  )}
                  {b.company && (
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {b.company}
                    </div>
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
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
