import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KEYS = ["orders", "order_items", "quotes", "quote_items", "invoices", "payments", "receipts", "bookings", "leads", "contacts", "products", "customers"] as const;

export const exportDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ dataset: z.enum(KEYS), since: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Forbidden");
    const { fetchDataset, toCsv, DATASETS } = await import("./data-export.server");
    const rows = await fetchDataset(data.dataset, { limit: 5000, since: data.since });
    return { csv: toCsv(rows, DATASETS[data.dataset].columns), count: rows.length };
  });
