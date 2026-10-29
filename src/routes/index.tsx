import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { seoHead } from "@/lib/seo";
import {
  servicesQuery,
  featuredProductsQuery,
  caseStudiesQuery,
  testimonialsQuery,
  homeBlogQuery,
  prefetch,
} from "@/lib/queries";
import { Hero } from "@/components/hero";
import { MarqueeStrip } from "@/components/marquee-strip";
import { AboutSection } from "@/components/about-section";
import { ProductsSection } from "@/components/products-section";
import { ServicesSection } from "@/components/services-section";
import { AiAdvisor } from "@/components/ai-advisor";
import { ProcessSection } from "@/components/process-section";
import { PortfolioSection } from "@/components/portfolio-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { BlogSection } from "@/components/blog-section";
import { WhySection } from "@/components/why-section";
import { BookingSection } from "@/components/booking-section";
import { ContactSection } from "@/components/contact-section";

export const Route = createFileRoute("/")({
  // Prefetch everything the sections show so crawlers and first paint get real content.
  // A failed query never blocks the page: the section just fetches in the browser instead.
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      prefetch(queryClient, servicesQuery),
      prefetch(queryClient, featuredProductsQuery),
      prefetch(queryClient, caseStudiesQuery),
      prefetch(queryClient, testimonialsQuery),
      prefetch(queryClient, homeBlogQuery),
    ]);
  },
  headers: () => ({
    "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
  }),
  head: () => {
    const seo = seoHead({
      title: "Branding Agency in Jos, Nigeria | C Imperium Branding",
      description:
        "C Imperium is a branding agency in Jos, Plateau State. Brand identity, logo design, printing, packaging, social media and web design for businesses, ministries and organisations.",
      path: "/",
    });
    return {
      ...seo,
      // The hero background is the biggest thing in the first view: fetch it immediately.
      links: [...seo.links, { rel: "preload", as: "image", href: "/hero-bg.jpg", fetchPriority: "high" as const }],
    };
  },
  component: HomePage,
});

function HomePage() {
  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <MarqueeStrip />
        <AboutSection />
        <ProductsSection />
        <ServicesSection />
        <AiAdvisor />
        <ProcessSection />
        <PortfolioSection />
        <WhySection />
        <TestimonialsSection />
        <BlogSection />
        <BookingSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
