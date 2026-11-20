import { createFileRoute, notFound } from "@tanstack/react-router";
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "@/styles-promo.css";
import { promotionBySlugQuery } from "@/lib/queries";
import { breadcrumbJsonLd, seoHead } from "@/lib/seo";
import { IDEA_TO_BRAND_SLUG } from "@/lib/promotions-defaults";
import { PromoPageView, PromoShell, faqSchema } from "@/components/promo-page";
import { Idea2BrandJoin } from "@/components/idea2brand-pay";

/** The Idea to Brand masterclass lives at the short address /idea2brand (the old
 *  /promo/idea-to-brand-2027 301s here). Paystack returns to this same URL with a
 *  `reference`, which renders the join-cohort screen instead of the landing page. */
export const Route = createFileRoute("/idea2brand")({
  loader: async ({ context: { queryClient } }) => {
    const promo = await queryClient.ensureQueryData(promotionBySlugQuery(IDEA_TO_BRAND_SLUG));
    if (!promo) throw notFound();
    return promo;
  },
  headers: () => ({ "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" }),
  validateSearch: (s: Record<string, unknown>): { reference?: string; trxref?: string } => ({
    reference: typeof s.reference === "string" ? s.reference : undefined,
    trxref: typeof s.trxref === "string" ? s.trxref : undefined,
  }),
  head: ({ loaderData: promo }) => {
    if (!promo) return {};
    const p = promo.page;
    return seoHead({
      title: p.seo_title || `${promo.title} | C Imperium Branding`,
      description: p.seo_description || promo.blurb,
      path: "/idea2brand",
      image: p.og_image || undefined,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: promo.title, path: "/idea2brand" },
        ]),
        ...faqSchema(p.faq),
      ],
    });
  },
  component: Idea2BrandRouteView,
});

function Idea2BrandRouteView() {
  const promo = Route.useLoaderData();
  const { reference, trxref } = Route.useSearch();
  const ref = reference || trxref;

  if (ref) {
    return (
      <PromoShell>
        <Idea2BrandJoin promo={promo} reference={ref} />
      </PromoShell>
    );
  }
  return <PromoPageView promo={promo} />;
}
