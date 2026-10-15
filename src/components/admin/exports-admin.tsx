import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { exportDataset } from "@/lib/export.functions";

const ITEMS = [
  ["orders", "Shop orders"], ["order_items", "Order line items"], ["quotes", "Quotes"], ["quote_items", "Quote line items"],
  ["invoices", "Invoices"], ["payments", "Payments"], ["receipts", "Receipts"], ["bookings", "Bookings"],
  ["leads", "Leads"], ["contacts", "Messages"], ["products", "Products"], ["customers", "Customers"],
] as const;

export function ExportsAdmin() {
  const run = useServerFn(exportDataset);
  const [busy, setBusy] = useState<string | null>(null);
  const [since, setSince] = useState("");

  async function download(key: (typeof ITEMS)[number][0]) {
    setBusy(key);
    try {
      const res = await run({ data: { dataset: key, since: since ? new Date(since).toISOString() : undefined } });
      const url = URL.createObjectURL(new Blob([res.csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `cimperium-${key}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.count} rows`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="mt-10 space-y-12">
      <section>
        <h2 className="font-display text-3xl">Data exports</h2>
        <p className="mt-2 text-sm text-muted-foreground">Downloads open in Excel, Google Sheets or Numbers (CSV, up to 5,000 newest rows).</p>
        <label className="mt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          From date (optional)
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="border border-border bg-transparent px-3 py-2 text-foreground" />
        </label>
        <div className="mt-6 grid gap-px bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(([key, label]) => (
            <button key={key} disabled={busy !== null} onClick={() => download(key)}
              className="flex items-center justify-between bg-background px-5 py-4 text-left hover:bg-muted disabled:opacity-50">
              <span>{label}</span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">
                <Download className="h-3.5 w-3.5" />{busy === key ? "…" : "CSV"}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl">Read-only API</h2>
        <p className="mt-2 text-sm text-muted-foreground">For reporting tools (Power BI, Looker Studio, Excel Power Query, Zapier). Send the API key in the <code>x-api-key</code> header.</p>
        <pre className="mt-4 overflow-x-auto border border-border bg-muted/40 p-4 font-mono text-xs">{`GET ${base}/api/public/v1/{dataset}
Header: x-api-key: <your key>

Datasets: ${ITEMS.map((i) => i[0]).join(", ")}
Options:  ?limit=1000 (max 5000)  &offset=0  &since=2026-01-01  &format=csv

curl -H "x-api-key: YOUR_KEY" ${base}/api/public/v1/orders?limit=100`}</pre>
      </section>
    </div>
  );
}
