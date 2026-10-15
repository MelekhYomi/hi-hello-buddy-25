// Server-only: dataset definitions shared by the admin export and the client read-only API.
export const DATASETS = {
  orders: { table: "orders", columns: "id,status,payment_provider,payment_status,payment_ref,subtotal,shipping_fee,total,currency,delivery_method,delivery_status,customer_name,customer_email,customer_phone,delivery_address,city,state,country,notes,created_at,updated_at" },
  order_items: { table: "order_items", columns: "id,order_id,product_id,title_snapshot,price_snapshot,quantity,created_at" },
  quotes: { table: "quotes", columns: "id,quote_number,full_name,email,phone,company,notes,preferred_contact,status,subtotal,total,currency,has_custom_items,valid_until,created_at,updated_at" },
  quote_items: { table: "quote_items", columns: "id,quote_id,item_type,title_snapshot,unit_price,quantity,is_on_request,line_total,created_at" },
  invoices: { table: "invoices", columns: "id,invoice_number,quote_id,full_name,email,phone,company,subtotal,discount,total,currency,deposit_percent,deposit_amount,amount_paid,payment_terms,status,fulfilment_status,delivery_choice,delivery_address,due_date,created_at,updated_at" },
  payments: { table: "payments", columns: "id,invoice_id,amount,method,kind,reference,status,confirmed_at,created_at" },
  receipts: { table: "receipts", columns: "id,receipt_number,invoice_id,payment_id,amount,balance_after,method,created_at" },
  bookings: { table: "bookings", columns: "id,full_name,email,phone,company,service_id,preferred_date,preferred_time,project_details,status,amount,payment_method,payment_status,created_at,updated_at" },
  leads: { table: "leads", columns: "id,name,email,phone,source,interest,created_at" },
  contacts: { table: "contacts", columns: "id,name,email,phone,subject,message,is_read,created_at" },
  products: { table: "products", columns: "id,slug,title,price,compare_at_price,currency,stock,is_active,is_featured,created_at,updated_at" },
  customers: { table: "profiles", columns: "id,display_name,phone,address,phone_verified,created_at" },
} as const;

export type DatasetKey = keyof typeof DATASETS;
export const DATASET_KEYS = Object.keys(DATASETS) as DatasetKey[];

export async function fetchDataset(
  key: DatasetKey,
  opts: { limit?: number; offset?: number; since?: string } = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const def = DATASETS[key];
  const limit = Math.min(Math.max(opts.limit ?? 1000, 1), 5000);
  const offset = Math.max(opts.offset ?? 0, 0);
  let q = (supabaseAdmin as any)
    .from(def.table)
    .select(def.columns)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (opts.since) q = q.gte("created_at", opts.since);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

export function toCsv(rows: Record<string, unknown>[], columns: string) {
  const cols = columns.split(",");
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\r\n");
}
