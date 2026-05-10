import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { ServicesSection } from "@/components/services-section";
import { PortfolioSection } from "@/components/portfolio-section";
import { TestimonialsSection } from "@/components/testimonials-section";

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
        <ServicesSection />
        <PortfolioSection />
        <TestimonialsSection />

        <section id="book" className="border-t border-border/40 py-32 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Let's talk</div>
          <h2 className="mt-4 font-display text-5xl md:text-7xl">BOOK A CONSULTATION</h2>
          <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">Coming in Phase 3 — with auth + availability.</p>
        </section>

        <section id="contact" className="border-t border-border/40 py-32 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Reach out</div>
          <h2 className="mt-4 font-display text-5xl md:text-7xl">CONTACT</h2>
          <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">Coming in Phase 4.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
