import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://hi-hello-buddy-25.lovable.app";

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

        const [{ data: products }, { data: posts }] = await Promise.all([
          supabase.from("products").select("slug, updated_at").eq("is_active", true),
          supabase.from("blog_posts").select("slug, updated_at, published_at").eq("is_published", true),
        ]);

        const productEntries: Entry[] = (products ?? []).map((p) => ({
          path: `/shop/${p.slug}`,
          lastmod: p.updated_at?.slice(0, 10),
          changefreq: "weekly",
          priority: "0.7",
        }));

        const blogEntries: Entry[] = (posts ?? []).map((p) => ({
          path: `/blog/${p.slug}`,
          lastmod: (p.published_at ?? p.updated_at)?.slice(0, 10),
          changefreq: "monthly",
          priority: "0.6",
        }));

        const all = [...staticEntries, ...productEntries, ...blogEntries];

        const urls = all.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
