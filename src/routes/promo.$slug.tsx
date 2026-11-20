import { createFileRoute, notFound } from "@tanstack/react-router";
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "@/styles-promo.css";
import { promotionBySlugQuery } from "@/lib/queries";
import { breadcrumbJsonLd, seoHead } from "@/lib/seo";
import { promoPath } from "@/lib/promotions-defaults";
import { PromoPageView, faqSchema } from "@/components/promo-page";

export const Route = createFileRoute("/promo/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const promo = await queryClient.ensureQueryData(promotionBySlugQuery(params.slug));
    if (!promo) throw notFound();
    return promo;
  },
  headers: () => ({ "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" }),
  head: ({ loaderData: promo, params }) => {
    if (!promo) return {};
    // Idea to Brand's canonical address is /idea2brand, so even if this URL is opened
    // directly the page points crawlers at the short address.
    const path = promoPath(params.slug);
    const p = promo.page;
    return seoHead({
      title: p.seo_title || `${promo.title} | C Imperium Branding`,
      description: p.seo_description || promo.blurb,
      path,
      image: p.og_image || undefined,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: promo.title, path },
        ]),
        ...faqSchema(p.faq),
      ],
    });
  },
  component: PromoRouteView,
});

function PromoRouteView() {
  const promo = Route.useLoaderData();
  return <PromoPageView promo={promo} />;
}
