import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function BlogSection() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image, tags, published_at, created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section
      id="blog"
      className="relative z-[2] overflow-hidden border-t border-border/40 px-6 py-24 md:px-16 md:py-32"
      style={{ background: "var(--ci-black)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-14">
          <div>
            <div className="ci-section-label" style={{ fontSize: "1.4rem" }}>
              Branding Insights
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">
              Strategy, design thinking, and creative direction notes from the C Imperium studio.
            </p>
          </div>
          <Link
            to="/blog"
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-imperium hover:underline inline-flex items-center gap-1"
          >
            View all posts <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Featured insight — from the studio's brand guide */}
        <FeaturedInsight />

        {/* Supporting insight cards */}
        <InsightGrid />

        {/* Latest posts from the blog */}
        {!isLoading && (posts ?? []).length > 0 && (
          <LatestPosts posts={posts as any[]} />
        )}
      </div>
    </section>
  );
}

/* ---------- Featured insight ---------- */

function FeaturedInsight() {
  return (
    <div className="mb-16 relative overflow-hidden rounded-2xl border border-border/60 bg-card group">
      <div className="relative aspect-[16/9] bg-card/40 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl opacity-10">◆</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      <div className="p-8 md:p-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">
            Featured
          </span>
          <span className="h-px w-6 bg-imperium" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Brand Strategy
          </span>
        </div>
        <h2 className="mb-4 font-display text-3xl md:text-4xl leading-tight">
          Branding Agency in Jos, Nigeria: How to Build a Brand That Stands Out
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Our philosophy is simple: <strong>Stand out. Dominate.</strong> Every business deserves a brand
          that communicates its value, connects with its audience, and stands confidently apart from the
          competition. Branding is more than a logo — it is the complete impression people form about your
          business through its visual identity, communication, customer experience, and consistency.
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:gap-3 transition-all"
        >
          Read all insights <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/* ---------- Insight cards ---------- */

type InsightCard = {
  title: string;
  body: string;
  tag: string;
};

const INSIGHTS: InsightCard[] = [
  {
    title: "What Is Branding, and Why Does Your Business Need It?",
    tag: "Brand Strategy",
    body:
      "Effective branding helps your business build recognition and trust, communicate its values and unique selling proposition, differentiate from competitors, maintain a professional image across platforms, and create a stronger foundation for marketing, customer loyalty, and growth.",
  },
  {
    title: "Why Choose a Branding Agency in Jos?",
    tag: "Local Expertise",
    body:
      "Working with a branding agency in Jos gives businesses and organizations in Plateau State access to creative expertise and branding solutions within their region — thoughtful brand development, professional design, quality print production, and technology solutions that support business goals.",
  },
  {
    title: "Our Four Core Service Areas",
    tag: "Services",
    body:
      "C Imperium brings creative thinking and practical execution together through brand strategy and identity design, professional printing and brand collateral, campaign and corporate branding, and digital design and web development.",
  },
  {
    title: "Our Process: Discover, Design, Approve, Execute",
    tag: "Process",
    body:
      "We keep projects structured and collaborative — we learn about your business and objectives, develop creative concepts aligned with your brand, review and approve the direction together, then bring the approved concept to life through the agreed design, printing, branding, or technology deliverables.",
  },
];

function InsightGrid() {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {INSIGHTS.map((insight) => (
        <InsightCard key={insight.title} {...insight} />
      ))}
    </div>
  );
}

function InsightCard({ title, body, tag }: InsightCard) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 hover:border-imperium hover:shadow-[0_0_30px_-10px_var(--imperium)] transition-all duration-300">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-imperium mb-3 block">
        {tag}
      </span>
      <h3 className="mb-3 font-display text-xl leading-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/* ---------- Latest posts ---------- */

function LatestPosts({ posts }: { posts: any[] }) {
  return (
    <div className="mt-16 border-t border-border/40 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div className="ci-section-label" style={{ fontSize: "1.1rem" }}>
          Latest from the Studio
        </div>
        <Link
          to="/blog"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:underline"
        >
          View all posts →
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {posts.map((p) => (
          <Link
            key={p.id}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group overflow-hidden border transition-all"
            style={{
              background: "var(--ci-dark)",
              borderColor: "var(--ci-border)",
            }}
          >
            <div className="relative flex aspect-video items-center justify-center overflow-hidden" style={{ background: "var(--ci-charcoal)" }}>
              {p.cover_image ? (
                <img src={p.cover_image} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-sm italic" style={{ fontFamily: "'Poppins', sans-serif", color: "var(--ci-gray)" }}>
                  {p.title}
                </span>
              )}
              <span className="absolute bottom-3 left-3 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ background: "var(--imperium)", color: "var(--ci-black)" }}>
                {p.tags?.[0] ?? "Insights"}
              </span>
            </div>
            <div className="p-6">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-imperium">{formatDate(p)}</div>
              <h3 className="mb-3 font-display text-xl transition-colors group-hover:text-imperium">{p.title}</h3>
              {p.excerpt && (
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
              )}
              <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-imperium hover:gap-3 transition-all">
                Read More <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatDate(p: any) {
  const dateVal = p.published_at ?? p.created_at;
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
