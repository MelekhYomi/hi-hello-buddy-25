import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { ProductsSection } from "@/components/products-section";
import { ServicesSection } from "@/components/services-section";
import { WhySection } from "@/components/why-section";
import { ProcessSection } from "@/components/process-section";
import { PortfolioSection } from "@/components/portfolio-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { BookingSection } from "@/components/booking-section";
import { ContactSection } from "@/components/contact-section";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C Imperium Branding — From Jos to the World" },
      {
        name: "description",
        content:
          "Premium branding agency in Jos, Nigeria. Logo design, print & packaging, web development, and large-scale campaigns for businesses ready to dominate their market.",
      },
      { property: "og:title", content: "C Imperium Branding — From Jos to the World" },
      {
        property: "og:description",
        content:
          "We build brands that command attention. Strategic design, printing, and digital execution for ambitious Nigerian businesses.",
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
        <ProductsSection />
        <ServicesSection />
        <WhySection />
        <ProcessSection />
        <PortfolioSection />
        <TestimonialsSection />

        <BookingSection />

        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
