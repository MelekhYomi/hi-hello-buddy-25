import { SITE_URL } from "@/lib/site-url";

export const SITE_NAME = "C Imperium Branding";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
/** Shown for blog posts that have no cover image of their own. */
export const DEFAULT_BLOG_COVER = "/blog/default-cover.jpg";

/** Makes a site-relative path ("/work/x") or already-absolute URL absolute. */
export function absUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Trims text to a search-snippet length without cutting a word in half. */
export function snippet(text: string | null | undefined, max = 155): string {
  const clean = (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60))}…`;
}

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

/** One place that builds title, description, canonical, Open Graph, Twitter and JSON-LD tags. */
export function seoHead({ title, description, path, image, type = "website", noindex, jsonLd }: SeoInput) {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  const img = absUrl(image);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_NG" },
      { property: "og:type", content: type },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: jsonLd
      ? [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }]
      : [],
  };
}

export const BUSINESS_ID = `${SITE_URL}/#business`;

/** Sitewide structured data: who the business is and where it is (local SEO). */
export const businessJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["ProfessionalService", "LocalBusiness"],
      "@id": BUSINESS_ID,
      name: SITE_NAME,
      alternateName: "C Imperium",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/cimperium-c-mark.png`,
      image: DEFAULT_OG_IMAGE,
      description:
        "Branding agency in Jos, Plateau State, Nigeria: brand identity, logo design, printing, packaging, social media and web design.",
      email: "info@cimperiumbrand.com",
      telephone: "+2349010912491",
      address: {
        "@type": "PostalAddress",
        streetAddress: "No. 4 Boulevard Road, Shop 2, Jolex Plaza",
        addressLocality: "Jos",
        addressRegion: "Plateau State",
        addressCountry: "NG",
      },
      areaServed: { "@type": "Country", name: "Nigeria" },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "17:00",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: "en-NG",
      publisher: { "@id": BUSINESS_ID },
    },
  ],
};

/** Breadcrumb trail for search results (Home > Work > Case study). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
