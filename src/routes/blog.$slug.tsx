import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({ meta: [{ title: "Article — C Imperium" }] }),
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-40 text-center">
        <h1 className="font-display text-5xl">POST NOT FOUND.</h1>
        <p className="mt-4 text-muted-foreground">That article doesn't exist or has been unpublished.</p>
        <Link to="/blog" className="btn-cta mt-8 inline-flex h-12 px-8">Back to blog</Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <Link to="/blog" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All articles
        </Link>

        {isLoading && <p className="mt-12 text-muted-foreground">Loading…</p>}

        {post && (
          <article className="mt-8">
            {post.tags?.[0] && (
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">{post.tags[0]}</div>
            )}
            <h1 className="mt-4 font-display text-4xl leading-[1.05] md:text-6xl">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>{(() => {
                try {
                  const val = post.published_at ?? post.created_at;
                  if (val) {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) return format(d, "MMM d, yyyy");
                  }
                } catch (e) {
                  console.error(e);
                }
                return "";
              })()}</span>
              {post.author && <><span>·</span><span>{post.author}</span></>}
            </div>
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="mt-10 aspect-video w-full rounded-md object-cover"
              />
            )}
            {post.excerpt && (
              <p className="mt-10 border-l-2 border-imperium pl-6 text-lg italic text-foreground/90">{post.excerpt}</p>
            )}
            <div
              className="prose prose-invert mt-10 max-w-none whitespace-pre-wrap text-base leading-[1.85] text-foreground/85"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {post.body}
            </div>
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
