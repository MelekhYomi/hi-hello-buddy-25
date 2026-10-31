import { supabase } from "@/integrations/supabase/client";

// Static hosting (Hostinger) has no server, so the "server functions" of the app live in one Supabase
// Edge Function called "api" (see scripts/build-edge.mjs). In a static build every *.functions.ts file is
// replaced by stubs made with callApi() (see vite.config.ts); this file is only used there.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const EDGE_BASE = `${SUPABASE_URL ?? ""}/functions/v1/api`;
const IS_STATIC = import.meta.env.VITE_STATIC === "true";

/** Address of a server route such as "/api/public/pdf/quote/<token>" (same site normally, the edge function when static). */
export function apiUrl(path: string) {
  return IS_STATIC ? EDGE_BASE + path.replace(/^\/api(?=\/)/, "") : path;
}

/** Full address (for showing to the owner, e.g. the Paystack webhook URL). */
export function absoluteApiUrl(path: string) {
  const u = apiUrl(path);
  return u.startsWith("http") || typeof window === "undefined" ? u : window.location.origin + u;
}

/** Same call shape as a TanStack server function: fn({ data }) resolves with the result or throws. */
export function callApi(name: string) {
  return async (opts?: { data?: unknown }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    const res = await fetch(`${EDGE_BASE}/fn/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { apikey: key } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ data: opts?.data ?? null }),
    });
    const text = await res.text();
    let json: { result?: unknown; error?: string } | null = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    if (!res.ok) throw new Error(json?.error ?? (text.slice(0, 200) || `Request failed (${res.status})`));
    return json?.result ?? null;
  };
}
