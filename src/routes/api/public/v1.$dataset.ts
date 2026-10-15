import { createFileRoute } from "@tanstack/react-router";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Read-only reporting API for the client's own tools. Auth: x-api-key header (or Authorization: Bearer).
export const Route = createFileRoute("/api/public/v1/$dataset")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const expected = process.env["CLIENT_API_KEY"];
        if (!expected) return Response.json({ error: "API not configured" }, { status: 503 });
        const auth = request.headers.get("authorization") ?? "";
        const provided = request.headers.get("x-api-key") ?? (auth.startsWith("Bearer ") ? auth.slice(7) : "");
        if (!provided || !safeEqual(provided, expected)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { DATASETS, DATASET_KEYS, fetchDataset, toCsv } = await import("@/lib/data-export.server");
        const key = params.dataset as keyof typeof DATASETS;
        if (!DATASET_KEYS.includes(key)) {
          return Response.json({ error: "Unknown dataset", available: DATASET_KEYS }, { status: 404 });
        }
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 1000) || 1000;
        const offset = Number(url.searchParams.get("offset") ?? 0) || 0;
        const sinceRaw = url.searchParams.get("since") ?? undefined;
        const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw).toISOString() : undefined;
        try {
          const rows = await fetchDataset(key, { limit, offset, since });
          if (url.searchParams.get("format") === "csv") {
            return new Response(toCsv(rows, DATASETS[key].columns), {
              headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" },
            });
          }
          return Response.json({ dataset: key, count: rows.length, offset, data: rows }, { headers: { "Cache-Control": "no-store" } });
        } catch (e) {
          console.error("data api error", e);
          return Response.json({ error: "Query failed" }, { status: 500 });
        }
      },
    },
  },
});
