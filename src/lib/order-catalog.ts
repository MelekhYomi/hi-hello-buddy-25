/**
 * Paid service orders. "Place an Order" on a service card opens /order/<slug>,
 * which shows each package (image + price) with a Pay overlay button, takes the
 * customer's details and pays through Paystack (same rails as the shop and
 * Idea 2 Brand). After payment the customer completes the brief on the
 * service's Google Form.
 */

export type OrderPackage = {
  id: string;
  name: string;
  /** Price in naira. */
  price: number;
  /** Image under /public. Falls back to a branded panel when the file is missing. */
  image: string;
  blurb: string;
  includes: string[];
};

export type OrderCatalog = {
  /** Matches services.slug. */
  slug: string;
  title: string;
  /** Brief form the customer fills in after paying. */
  formUrl: string;
  /** Empty = the items are still being prepared; the page offers the form instead. */
  packages: OrderPackage[];
};

export const ORDER_CATALOG: Record<string, OrderCatalog> = {
  "brand-identity": {
    slug: "brand-identity",
    title: "Brand Identity System",
    formUrl: "https://forms.gle/Q1BBK4fDRJqXcfLF9",
    packages: [
      {
        id: "basic",
        name: "Basic",
        price: 250_000,
        image: "/packages/brand-identity-basic.jpg",
        blurb:
          "The essentials to kick-start your brand on a budget — run your business smoothly while delivering solutions to your target audience.",
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
          "Everything you need to launch your brand, plus enhancements that refine its style and tone — leaving a lasting impression on your clients.",
        includes: ["Everything in Basic", "Roll-up Banner Design", "Brochure Design"],
      },
    ],
  },
  "print-packaging": {
    slug: "print-packaging",
    title: "Print & Packaging",
    formUrl: "https://forms.gle/PdSLdc5AxdZgYq9X7",
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
