import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// cimperiumbrand.com and www.cimperiumbrand.com must not both serve the site: Google would
// split rankings between them. Send the bare domain to www with a permanent redirect.
const canonicalHostMiddleware = createMiddleware().server(async ({ next, request }) => {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host === "cimperiumbrand.com") {
    const url = new URL(request.url);
    return new Response(null, {
      status: 301,
      headers: { Location: `https://www.cimperiumbrand.com${url.pathname}${url.search}` },
    });
  }
  return next();
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [canonicalHostMiddleware, errorMiddleware],
}));
