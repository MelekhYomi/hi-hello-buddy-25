import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { blogPostBySlugQuery } from "@/lib/queries";
import { RichText } from "@/components/rich-text";
import { SafeImg } from "@/components/safe-img";
import { SITE_URL } from "@/lib/site-url";
import { BUSINESS_ID, DEFAULT_BLOG_COVER, absUrl } from "@/lib/seo";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft } from "lucide-react";

const SITE = SITE_URL;

export const Route = createFileRoute("/blog/$slug")({
  // Load the whole article on the server so the first HTML contains the text Google indexes.
  loader: async ({ params, context: { queryClient } }) => {
    const data = await queryClient.ensureQueryData(blogPostBySlugQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE}/blog/${params.slug}`;
    if (!loaderData) {
      return { meta: [{ title: "Article not found — C Imperium" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — C Imperium`;
    const desc = (loaderData.excerpt ?? "").slice(0, 155) || "Insights from C Imperium Branding.";
    const img = loaderData.cover_image || DEFAULT_BLOG_COVER;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: absUrl(img) },
        ...(loaderData.cover_image ? [] : [{ property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }]),
        { name: "twitter:image", content: absUrl(img) },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: loaderData.title,
          description: desc,
          image: absUrl(img),
          datePublished: loaderData.published_at,
          dateModified: loaderData.published_at,
          author: { "@id": BUSINESS_ID },
          publisher: { "@id": BUSINESS_ID },
          mainEntityOfPage: url,
          url,
        }),
      }],
    };
  },
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
  const { data: post, isLoading } = useQuery(blogPostBySlugQuery(slug));

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
            <SafeImg
              src={post.cover_image}
              fallback={DEFAULT_BLOG_COVER}
              alt={post.title}
              className="mt-10 aspect-video w-full rounded-md object-cover"
            />
            {post.excerpt && (
              <p className="mt-10 border-l-2 border-imperium pl-6 text-lg italic text-foreground/90">{post.excerpt}</p>
            )}
            <RichText body={post.body} className="mt-10 text-base leading-[1.85] text-foreground/85" />
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
