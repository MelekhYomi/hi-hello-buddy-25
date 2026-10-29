import { createFileRoute } from "@tanstack/react-router";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Scheduled refresh of Google reviews. Auth: "Authorization: Bearer <CRON_SECRET>"
// (Vercel Cron sends this automatically when CRON_SECRET is set; on Hostinger use a
// cron job that curls this URL with the same header).
async function run(request: Request) {
  const expected = process.env["CRON_SECRET"];
  if (!expected) return Response.json({ error: "Not configured" }, { status: 503 });
  const auth = request.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!provided || !safeEqual(provided, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { syncGoogleReviews } = await import("@/lib/google-reviews.server");
    return Response.json({ ok: true, ...(await syncGoogleReviews()) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("google reviews sync failed", e);
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Sync failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/sync-google-reviews")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
