import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  return useQuery({
    queryKey: ["site-settings"],
    staleTime: 60_000,
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const out: SiteSettings = {};
      for (const row of data ?? []) {
        (out as Record<string, unknown>)[row.key] = row.value as unknown;
      }
      return out;
    },
  });
}

export const cleanWaNumber = (raw?: string) =>
  (raw ?? "").replace(/[^0-9]/g, "").replace(/^0/, "234");
