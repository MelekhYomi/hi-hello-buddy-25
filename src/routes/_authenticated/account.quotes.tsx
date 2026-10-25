import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { myQuotes } from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/account/quotes")({
  component: QuotesPage,
});

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  new: "Received",
  discussing: "In discussion",
  priced: "Priced",
  converted: "Converted",
  declined: "Closed",
};

function QuotesPage() {
  const load = useServerFn(myQuotes);
  const { data, isLoading } = useQuery({
    queryKey: ["my-quotes"],
    queryFn: () => load(),
  });

  if (isLoading)
    return <div className="font-mono text-xs uppercase text-muted-foreground">Loading…</div>;

  if (!data || !data.length)
    return (
      <div className="border border-dashed border-border/60 p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          No quote requests yet
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          Pick a service, tell us the brief, and we'll price it and reply on WhatsApp.
        </p>
        <Link to="/" hash="services" className="btn-cta mt-6 inline-flex h-11 items-center px-5">
          Browse services <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );

  return (
    <div className="divide-y divide-border/40 border-y border-border/40">
      {data.map((q: any) => {
        const allOnRequest = (q.items ?? []).every((i: any) => i.is_on_request);
        const submitted = q.status !== "draft";
        return (
          <article key={q.id} className="grid grid-cols-1 gap-3 py-6 md:grid-cols-12">
            <div className="md:col-span-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {format(new Date(q.created_at), "MMM d, yyyy")}
              </div>
              <div className="mt-1 font-display text-lg">
                {submitted ? q.quote_number : "Unsent request"}
              </div>
            </div>
            <div className="md:col-span-5">
              <div className="text-sm">
                {(q.items ?? []).length} item{(q.items ?? []).length === 1 ? "" : "s"}
                {(q.items ?? []).length > 0 && (
                  <span className="text-muted-foreground">
                    {" — "}
                    {(q.items ?? [])
                      .slice(0, 3)
                      .map((i: any) => i.title_snapshot)
                      .join(", ")}
                    {(q.items ?? []).length > 3 ? "…" : ""}
                  </span>
                )}
              </div>
              <div className="mt-1 font-display text-lg text-imperium">
                {allOnRequest ? "Pricing on request" : naira(Number(q.total ?? 0))}
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-2 md:col-span-4 md:justify-end">
              <span className="border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {STATUS_LABEL[q.status] ?? q.status}
              </span>
              {submitted && (
                <Link
                  to="/quote/$token"
                  params={{ token: q.public_token }}
                  className="border border-imperium/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium/10"
                >
                  View →
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
