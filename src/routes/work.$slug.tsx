import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CaseStudyBanner, CaseStudyBody } from "@/components/case-study-modal";
import { caseStudyBySlugQuery } from "@/lib/queries";
import { BUSINESS_ID, absUrl, breadcrumbJsonLd, seoHead, snippet } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/work/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const study = await queryClient.ensureQueryData(caseStudyBySlugQuery(params.slug));
    if (!study) throw notFound();
    return study;
  },
  headers: () => ({ "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" }),
  head: ({ loaderData: study, params }) => {
    if (!study) return {};
    const path = `/work/${params.slug}`;
    const description = snippet(`${study.client}: ${study.challenge ?? ""} ${study.solution ?? ""}`);
    return seoHead({
      title: `${study.title} | Case Study | C Imperium Branding`,
      description: description || study.title,
      path,
      image: study.cover_image,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Our work", path: "/#portfolio" },
          { name: study.title, path },
        ]),
        {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: study.title,
        description,
        url: `${SITE_URL}${path}`,
        image: (study.gallery_images?.length ? study.gallery_images : [study.cover_image])
          .filter(Boolean)
          .map((u) => absUrl(u as string)),
        creator: { "@id": BUSINESS_ID },
        about: study.client,
        },
      ],
    });
  },
  component: WorkPage,
});

function WorkPage() {
  const study = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-24 md:px-6">
        <Link
          to="/"
          hash="portfolio"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-imperium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All work
        </Link>
        <article className="overflow-hidden border border-border bg-card">
          <CaseStudyBanner study={study} />
          <CaseStudyBody study={study} headingAs="h1" />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
