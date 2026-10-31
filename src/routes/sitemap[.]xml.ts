import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        type Entry = { path: string; lastmod?: string; changefreq?: string; priority?: string };
        const staticEntries: Entry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
        ];

        // One failing table must not take the whole sitemap down.
        const safe = async <T,>(q: PromiseLike<{ data: T[] | null }>): Promise<T[]> => {
          try {
            return (await q).data ?? [];
          } catch {
            return [];
          }
        };

        const [products, posts, services, cases, promos] = await Promise.all([
          safe(supabase.from("products").select("slug, updated_at").eq("is_active", true)),
          safe(supabase.from("blog_posts").select("slug, updated_at, published_at").eq("is_published", true)),
          safe(supabase.from("services").select("slug, updated_at").eq("is_active", true)),
          safe(supabase.from("case_studies").select("slug, updated_at")),
          safe(supabase.from("promotions").select("slug, updated_at").eq("is_published", true)),
        ]);

        const serviceEntries: Entry[] = services.map((s) => ({
          path: `/services/${s.slug}`,
          lastmod: s.updated_at?.slice(0, 10),
          changefreq: "monthly",
          priority: "0.8",
        }));

        const workEntries: Entry[] = cases.map((c) => ({
          path: `/work/${c.slug}`,
          lastmod: c.updated_at?.slice(0, 10),
          changefreq: "monthly",
          priority: "0.7",
        }));

        const productEntries: Entry[] = products.map((p) => ({
          path: `/shop/${p.slug}`,
          lastmod: p.updated_at?.slice(0, 10),
          changefreq: "weekly",
          priority: "0.7",
        }));

        const blogEntries: Entry[] = posts.map((p) => ({
          path: `/blog/${p.slug}`,
          lastmod: (p.published_at ?? p.updated_at)?.slice(0, 10),
          changefreq: "monthly",
          priority: "0.6",
        }));

        const promoEntries: Entry[] = promos.map((p) => ({
          path: `/promo/${p.slug}`,
          lastmod: p.updated_at?.slice(0, 10),
          changefreq: "monthly",
          priority: "0.7",
        }));

        const all = [...staticEntries, ...promoEntries, ...serviceEntries, ...workEntries, ...productEntries, ...blogEntries];

        const urls = all.map((e) =>
          [
            `  <url>`,
            `    <loc>${esc(BASE_URL + e.path)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=0, s-maxage=3600" },
        });
      },
    },
  },
});
