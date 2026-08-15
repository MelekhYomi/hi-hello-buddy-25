import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Branding Insights — C Imperium" },
      { name: "description", content: "Branding insights, strategy, and creative direction from the C Imperium studio." },
      { property: "og:title", content: "Branding Insights — C Imperium" },
      { property: "og:description", content: "Branding insights, strategy, and creative direction from the C Imperium studio." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hi-hello-buddy-25.lovable.app/blog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://hi-hello-buddy-25.lovable.app/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image, tags, published_at, created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Branding Insights</div>
        <h1 className="mt-4 font-display text-5xl md:text-7xl">FROM THE STUDIO.</h1>
        <div className="mt-4 h-px w-24 bg-imperium" />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Strategy, design thinking, and creative direction notes from the C Imperium studio.
        </p>

        {isLoading && <p className="mt-12 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (!posts || posts.length === 0) && (
          <p className="mt-12 text-sm italic text-muted-foreground">No posts published yet. Check back soon.</p>
        )}

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((p) => {
            const tag = p.tags?.[0] ?? "Insights";
            let dateStr = "";
            try {
              const dateVal = p.published_at ?? p.created_at;
              if (dateVal) {
                const dateObj = new Date(dateVal);
                if (!isNaN(dateObj.getTime())) {
                  dateStr = format(dateObj, "MMM d, yyyy");
                }
              }
            } catch (err) {
              console.error("Error formatting date:", err);
            }
            return (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group overflow-hidden border border-border/60 bg-card transition-all hover:border-imperium hover:-translate-y-1"
              >
                <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-muted/20">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-4 text-center font-display text-2xl text-muted-foreground/40">{p.title}</span>
                  )}
                  <span className="absolute bottom-3 left-3 bg-imperium px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-charleston">{tag}</span>
                </div>
                <div className="p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">{dateStr}</div>
                  <h3 className="mt-3 font-display text-xl tracking-tight transition-colors group-hover:text-imperium">{p.title}</h3>
                  {p.excerpt && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
