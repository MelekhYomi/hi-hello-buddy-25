import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { MarqueeStrip } from "@/components/marquee-strip";
import { AboutSection } from "@/components/about-section";
import { ProductsSection } from "@/components/products-section";
import { ServicesSection } from "@/components/services-section";
import { ProcessSection } from "@/components/process-section";
import { PortfolioSection } from "@/components/portfolio-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { BlogSection } from "@/components/blog-section";
import { WhySection } from "@/components/why-section";
import { BookingSection } from "@/components/booking-section";
import { ContactSection } from "@/components/contact-section";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C Imperium — Stand Out. Dominate." },
      {
        name: "description",
        content:
          "C Imperium is a brand transformation agency in Nigeria. Brand identity, print, packaging, web, social, and creative direction that makes brands impossible to ignore.",
      },
      { property: "og:title", content: "C Imperium — Stand Out. Dominate." },
      {
        property: "og:description",
        content:
          "Premium brand transformation. We build visual identities and brand experiences that dominate.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
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
