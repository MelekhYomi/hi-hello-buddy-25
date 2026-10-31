import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PROMOTIONS, EMPTY_PAGE, type Promotion, type PromoPage } from "@/lib/promotions-defaults";

// Shared query definitions. Route loaders prefetch these on the server so the first
// HTML response already contains the content (good for SEO and first paint), and the
// components read the very same queries from the hydrated cache.

const isServer = typeof window === "undefined";
const memo = new Map<string, { t: number; v: unknown }>();

/** Server-only short cache so a burst of visitors does not hit the database each time. */
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  if (!isServer) return fn();
  const hit = memo.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v as T;
  const v = await fn();
  memo.set(key, { t: Date.now(), v });
  return v;
}

const TTL = 60_000;

/**
 * Load a query for server-side rendering, but never let a slow or failing database hold
 * the page hostage: after `ms` (or on error) carry on and let the browser fetch it instead.
 */
export function prefetch(queryClient: QueryClient, options: unknown, ms = 3000): Promise<void> {
  return Promise.race([
    queryClient.ensureQueryData(options as never).then(
      () => undefined,
      () => undefined,
    ),
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
}

export const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: () =>
    cached("services", TTL, async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    }),
});

export const featuredProductsQuery = queryOptions({
  queryKey: ["featured-products"],
  queryFn: () =>
    cached("featured-products", TTL, async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,title,description,price,compare_at_price,images,stock")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("display_order")
        .limit(6);
      if (error) throw error;
      return data;
    }),
});

export const caseStudiesQuery = queryOptions({
  queryKey: ["case_studies"],
  queryFn: () =>
    cached("case_studies", TTL, async () => {
      const { data, error } = await supabase.from("case_studies").select("*").order("display_order");
      if (error) throw error;
      return data;
    }),
});

export const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: () =>
    cached("testimonials", TTL, async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_published", true)
        .order("display_order");
      if (error) throw error;
      // Newest Google reviews first within the same display_order. Sorted here (not in SQL)
      // so the page keeps working before the review_time column exists.
      return [...data].sort(
        (a, b) =>
          a.display_order - b.display_order ||
          Date.parse((b as { review_time?: string | null }).review_time ?? "") -
            Date.parse((a as { review_time?: string | null }).review_time ?? "") ||
          0,
      );
    }),
});

export const homeBlogQuery = queryOptions({
  queryKey: ["blog-posts-home"],
  queryFn: () =>
    cached("blog-posts-home", TTL, async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image, tags, published_at, created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(3);
      if (error) throw error;
      return data;
    }),
});

export const siteSettingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: () =>
    cached("site-settings", TTL, async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const out: Record<string, unknown> = {};
      for (const row of data ?? []) out[row.key] = row.value as unknown;
      return out;
    }),
});

export const caseStudyBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["case_study", slug],
    queryFn: () =>
      cached(`case_study:${slug}`, TTL, async () => {
        const { data, error } = await supabase.from("case_studies").select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;
        return data;
      }),
  });

export const serviceBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["service", slug],
    queryFn: () =>
      cached(`service:${slug}`, TTL, async () => {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();
        if (error) throw error;
        return data;
      }),
  });

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () =>
      cached(`product:${slug}`, TTL, async () => {
        const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;
        return data;
      }),
  });

export const blogPostBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: () =>
      cached(`blog-post:${slug}`, TTL, async () => {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();
        if (error) throw error;
        return data;
      }),
  });

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () =>
    cached("categories", TTL, async () => {
      const { data } = await supabase.from("product_categories").select("*").order("display_order");
      return data ?? [];
    }),
});

export const productsQuery = (categoryId: string | null) =>
  queryOptions({
    queryKey: ["products", categoryId],
    queryFn: () =>
      cached(`products:${categoryId ?? "all"}`, TTL, async () => {
        let q = supabase.from("products").select("*").eq("is_active", true).order("display_order");
        if (categoryId) q = q.eq("category_id", categoryId);
        const { data, error } = await q;
        if (error) throw error;
        return data;
      }),
  });

export const blogListQuery = queryOptions({
  queryKey: ["blog-posts-all"],
  queryFn: () =>
    cached("blog-posts-all", TTL, async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image, tags, published_at, created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    }),
});

// Promotions: cards on the home page and the page each one opens. If the table cannot be read
// (for instance before it has been created) the built-in launch promotions are used instead.
const DEFAULT_ROWS: Promotion[] = DEFAULT_PROMOTIONS.map((p) => ({ ...p, id: p.slug }));

/** Fill any missing field of the stored page so older rows never break the page. */
export function normalizePromotion(row: {
  id: string; slug: string; is_published: boolean; display_order: number; tag: string; title: string;
  blurb: string; benefits: string[]; card_cta: string; icon: string; page: unknown;
}): Promotion {
  return { ...row, page: { ...EMPTY_PAGE, ...((row.page ?? {}) as Partial<PromoPage>) } };
}

export const promotionsQuery = queryOptions({
  queryKey: ["promotions"],
  queryFn: () =>
    cached("promotions", TTL, async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_published", true)
        .order("display_order");
      if (error) return DEFAULT_ROWS;
      return data.map(normalizePromotion);
    }),
});

export const promotionBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["promotion", slug],
    queryFn: () =>
      cached(`promotion:${slug}`, TTL, async () => {
        const { data, error } = await supabase
          .from("promotions")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();
        if (error) return DEFAULT_ROWS.find((p) => p.slug === slug) ?? null;
        return data ? normalizePromotion(data) : null;
      }),
  });
