// Stand-in for "@tanstack/react-router": only createFileRoute is needed, to collect the
// server route handlers (Paystack webhook, PDFs, reviews sync, client API).
export const routeRegistry: { path: string; handlers: Record<string, (a: any) => Promise<Response> | Response> }[] = [];

export const createFileRoute = (path: string) => (opts: any) => {
  const handlers = opts?.server?.handlers;
  if (handlers) routeRegistry.push({ path, handlers });
  return { path };
};
