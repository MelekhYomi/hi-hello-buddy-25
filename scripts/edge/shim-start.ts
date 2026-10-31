// Stand-in for "@tanstack/react-start" when the server functions run inside a Supabase Edge Function.
// It keeps the existing *.functions.ts files untouched: each createServerFn() registers itself by name,
// and runtime.ts calls it when a request arrives.
import { AsyncLocalStorage } from "node:async_hooks";

type Ctx = Record<string, unknown>;
type Middleware = { _server?: (a: any) => unknown; _deps: Middleware[] };
type FnDef = {
  mws: Middleware[];
  validator?: (d: unknown) => unknown;
  handler?: (a: { data: unknown; context: Ctx }) => unknown;
};

export const requestStore = new AsyncLocalStorage<{ request: Request }>();
export const fnRegistry = new Map<string, FnDef>();

export function createMiddleware(_opts?: unknown) {
  const mw: any = { _deps: [] as Middleware[] };
  mw.server = (fn: (a: any) => unknown) => ((mw._server = fn), mw);
  mw.client = () => mw;
  mw.middleware = (deps: Middleware[]) => ((mw._deps = deps ?? []), mw);
  mw.inputValidator = () => mw;
  return mw as Middleware & Record<string, any>;
}

function builder(name: string) {
  const def: FnDef = { mws: [] };
  const b: any = {
    middleware: (m: Middleware[]) => ((def.mws = m ?? []), b),
    inputValidator: (v: any) => ((def.validator = typeof v === "function" ? v : (d: unknown) => v.parse(d)), b),
    handler: (h: FnDef["handler"]) => {
      def.handler = h;
      fnRegistry.set(name, def);
      return async () => {
        throw new Error("Server functions cannot be called inside the edge runtime directly");
      };
    },
  };
  return b;
}

export const createServerFn: any = (_opts?: unknown) => builder("?");
// The build script rewrites `export const X = createServerFn(` to `createServerFn.named("X")(` so each function knows its name.
createServerFn.named = (name: string) => (_opts?: unknown) => builder(name);

/** Run a registered server function: middleware (auth) first, then validation, then the handler. */
export async function runServerFn(name: string, input: unknown, request: Request) {
  const def = fnRegistry.get(name);
  if (!def) return undefined;
  const chain: Middleware[] = [];
  const add = (m: Middleware) => {
    m._deps.forEach(add);
    chain.push(m);
  };
  def.mws.forEach(add);

  return requestStore.run({ request }, async () => {
    const exec = async (i: number, context: Ctx): Promise<unknown> => {
      if (i === chain.length) {
        const data = def.validator ? await def.validator(input) : input;
        return def.handler!({ data, context });
      }
      const mw = chain[i];
      if (!mw._server) return exec(i + 1, context);
      let out: unknown;
      await mw._server({
        context,
        request,
        next: async (o?: { context?: Ctx }) => {
          out = await exec(i + 1, { ...context, ...(o?.context ?? {}) });
          return { result: out };
        },
      });
      return out;
    };
    return exec(0, {});
  });
}
