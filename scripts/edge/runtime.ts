import { Buffer } from "node:buffer";
import { runServerFn, fnRegistry } from "./shim-start";
import { routeRegistry } from "./shim-router";

(globalThis as any).Buffer ??= Buffer;

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?cimperiumbrand\.com$/,
  /^https:\/\/cimperium[a-z0-9-]*\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.some((re) => re.test(origin))) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function withCors(res: Response, req: Request) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(corsHeaders(req))) out.headers.set(k, v);
  return out;
}

// "/api/public/pdf/$kind/$token" -> /public/pdf/:kind/:token (the function name already is "api").
function matchRoute(pathname: string) {
  for (const r of routeRegistry) {
    const pattern = r.path.replace(/^\/api/, "");
    const names: string[] = [];
    const re = new RegExp("^" + pattern.replace(/\$(\w+)/g, (_m, n) => (names.push(n), "([^/]+)")) + "/?$");
    const m = re.exec(pathname);
    if (m) return { route: r, params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });

  // Supabase forwards "/<function-name>/..." so drop the leading "/api".
  const pathname = new URL(req.url).pathname.replace(/^\/functions\/v1/, "").replace(/^\/api(?=\/|$)/, "") || "/";

  try {
    const fnMatch = /^\/fn\/([\w-]+)$/.exec(pathname);
    if (fnMatch) {
      if (req.method !== "POST") return withCors(Response.json({ error: "Method not allowed" }, { status: 405 }), req);
      if (!fnRegistry.has(fnMatch[1])) return withCors(Response.json({ error: "Unknown function" }, { status: 404 }), req);
      let body: { data?: unknown } = {};
      try {
        body = await req.json();
      } catch {
        /* empty body */
      }
      const result = await runServerFn(fnMatch[1], body?.data, req);
      return withCors(Response.json({ result: result ?? null }), req);
    }

    const hit = matchRoute(pathname);
    if (hit) {
      const handler = hit.route.handlers[req.method];
      if (!handler) return withCors(Response.json({ error: "Method not allowed" }, { status: 405 }), req);
      return withCors(await handler({ request: req, params: hit.params }), req);
    }
    return withCors(Response.json({ error: "Not found" }, { status: 404 }), req);
  } catch (e) {
    if (e instanceof Response) return withCors(e, req);
    if (e && typeof e === "object" && (e as { name?: string }).name === "ZodError") {
      return withCors(Response.json({ error: "Invalid input" }, { status: 400 }), req);
    }
    console.error(`[api] ${pathname}`, e);
    return withCors(Response.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 }), req);
  }
}
