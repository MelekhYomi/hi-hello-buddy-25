import { useQuery } from "@tanstack/react-query";
import { siteSettingsQuery } from "@/lib/queries";

export type SiteSettings = {
  whatsapp_number?: string;
  payment_provider?: "paystack" | "flutterwave" | "manual" | "off";
  payment_mode?: "test" | "live";
  contact_email?: string;
  socials?: { instagram?: string; linkedin?: string; behance?: string };
  hero?: {
    eyebrow?: string;
    headline_line1?: string;
    headline_line2?: string;
    headline_line3?: string;
    subline?: string;
  };
  [k: string]: unknown;
};

export function useSiteSettings() {
  return useQuery({ ...siteSettingsQuery, select: (d): SiteSettings => d as SiteSettings });
}

export const cleanWaNumber = (raw?: string) =>
  (raw ?? "").replace(/[^0-9]/g, "").replace(/^0/, "234");
