/**
 * Paid service orders. "Place an Order" on a service card opens /order/<slug>,
 * which shows each package (image + price) with a Pay overlay button, takes the
 * customer's details and pays through Paystack (same rails as the shop and
 * Idea 2 Brand). After payment the customer completes the project brief in
 * the site's own form (see service-brief-form.tsx) — no Google Forms.
 */

import type { BriefServiceSlug } from "@/components/service-brief-form";
export type OrderPackage = {
  id: string;
  name: string;
  /** Price in naira. */
  price: number;
  /** Image under /public. Falls back to a branded panel when the file is missing. */
  image: string;
  blurb: string;
  includes: string[];
  /** Fine print shown under the includes (e.g. print specs). */
  notes?: string[];
};

export type OrderCatalog = {
  /** Matches services.slug. */
  slug: BriefServiceSlug;
  title: string;
  /** E-flyer shown as a banner on the order page; hidden while the file is missing. */
  heroImage?: string;
  /** Empty = the items are still being prepared; the page offers the brief form instead. */
  packages: OrderPackage[];
};

export const ORDER_CATALOG: Record<string, OrderCatalog> = {
  "brand-identity": {
    slug: "brand-identity",
    title: "Brand Identity System",
    heroImage: "/packages/brand-identity-hero.jpg",
    packages: [
      {
        id: "basic",
        name: "Basic",
        price: 250_000,
        image: "/packages/brand-identity-basic.jpg",
        blurb:
          "This package equips you with the essentials to kick-start your brand on a budget, helping you run your business smoothly while delivering solutions to your target audience.",
        includes: [
          "Logo",
          "Letterhead Design",
          "Business Card Design",
          "E-Flyer Design",
          "Receipt Design",
          "T-Shirt Design & Print",
          "Colour Palette",
          "Typography",
          "Brand Manual Design & Print",
        ],
      },
      {
        id: "standard",
        name: "Standard",
        price: 450_000,
        image: "/packages/brand-identity-standard.jpg",
        blurb:
          "This package provides everything you need to launch your brand, along with enhancements that refine its style and tone, leaving a lasting impression on your clients.",
        includes: [
          "Logo",
          "Letterhead Design",
          "Business Card Design",
          "E-Flyer Design",
          "Receipt Design",
          "Roll-up Banner Design",
          "T-Shirt Design & Print",
          "Colour Palette",
          "Typography",
          "Brand Manual Design & Print",
          "Brochure Design",
        ],
      },
      {
        id: "premium",
        name: "Premium",
        price: 1_400_000,
        image: "/packages/brand-identity-premium.jpg",
        blurb:
          "This package includes all the essentials to help you launch your brand on a budget, operate your business effectively, and deliver solutions to your target audience.",
        includes: [
          "Logo",
          "Letterhead Design",
          "Business Card Design",
          "E-Flyer Design",
          "Receipt Design",
          "Roll-up Banner Design",
          "T-Shirt Design & Print",
          "Colour Palette",
          "Typography",
          "Brand Manual Design & Print",
          "Brochure Design",
          "Single Page Website",
          "ID Card Design",
          "Logo Animation",
          "File Jacket Design",
        ],
        notes: [
          "Letterhead, Business Card & Envelopes will have 50 printed samples each",
          "1 ID Card print",
          "1 T-Shirt with logo print",
          "Brochure optimised for both digital viewing and print",
        ],
      },
    ],
  },
  "print-packaging": {
    slug: "print-packaging",
    title: "Print & Packaging",
    packages: [],
  },
};

export function orderCatalogFor(slug: string): OrderCatalog | undefined {
  return ORDER_CATALOG[slug];
}

/** True when this service is paid through /order/<slug> instead of the quote flow. */
export function isOrderService(slug: string): boolean {
  return Boolean(ORDER_CATALOG[slug]);
}
