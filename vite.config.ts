import { defineConfig, loadEnv, mergeConfig, type Plugin, type PluginOption } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Deployment target. Explicit env always wins.
//   DEPLOY_TARGET=static   -> fully static site (prerendered HTML + client app) for plain web hosting
//   DEPLOY_TARGET=node     -> Nitro node-server
// Vercel / Netlify are detected automatically; otherwise production defaults to node-server.
const target =
  process.env.VERCEL ? "vercel"
  : process.env.NETLIFY ? "netlify"
  : process.env.DEPLOY_TARGET === "node" ? "node-server"
  : process.env.DEPLOY_TARGET === "static" ? "static"
  : process.env.DEPLOY_TARGET === "cloudflare-module" ? "cloudflare-module"
  : (process.env.NODE_ENV === "production" ? "node-server" : undefined);

const isStatic = target === "static";

// Static hosting has no server. Each src/lib/*.functions.ts file is replaced by stubs that call the
// Supabase Edge Function "api" (see src/lib/api-client.ts and scripts/build-edge.mjs). The real
// handlers (and the server-only code they import) never reach the browser bundle.
const staticApiStubs: Plugin = {
  name: "static-api-stubs",
  enforce: "pre",
  transform(code, id) {
    if (!/[\\/]src[\\/]lib[\\/][^\\/]+\.functions\.ts$/.test(id.split("?")[0])) return null;
    const names = [...code.matchAll(/export const (\w+) = createServerFn\(/g)].map((m) => m[1]);
    const constants = [...code.matchAll(/^export const ([A-Z][A-Z0-9_]*) = .*;$/gm)].map((m) => m[0]);
    return {
      code: [
        'import { callApi } from "@/lib/api-client";',
        ...constants,
        ...names.map((n) => `export const ${n} = callApi(${JSON.stringify(n)});`),
      ].join("\n"),
      map: null,
    };
  },
};

const tanstackStartOptions = {
  server: { entry: "server" },
  // Server-only code must never be bundled into the browser.
  importProtection: { behavior: "error", client: { files: ["**/server/**"], specifiers: ["server-only"] } },
  // Increase the limit to 1000kB (1MB)
  chunkSizeWarningLimit: 1000,
  ...(isStatic
    ? {
        // Every public page becomes a real HTML file at build time (SEO + instant first paint).
        // Links found while crawling (services, case studies, products, posts) are prerendered too.
        prerender: {
          enabled: true,
          crawlLinks: true,
          concurrency: 4,
          failOnError: false,
          autoStaticPathsDiscovery: true,
          // Only public marketing pages are built ahead. Private pages (admin, account, login,
          // checkout, quote/invoice/receipt links) redirect around and, when crawled, loop forever.
          filter: ({ path }: { path: string }) =>
            !/[?#]/.test(path) &&
            (path === "/" || path === "/login" || /^\/(shop|blog|work|services)(\/[^/]+)?$/.test(path)),
        },
        pages: [{ path: "/" }, { path: "/shop" }, { path: "/blog" }],
        // Pages that cannot be built ahead (quote/invoice/receipt links, account, admin) are served
        // by this client-only shell; the host rewrites unknown addresses to it. The shell is
        // rendered from /login (an existing route) but written to _shell.html, never to /login.
        spa: { enabled: true, maskPath: "/login", prerender: { outputPath: "/_shell.html", crawlLinks: false, retryCount: 0 } },
      }
    : {}),
};

export default defineConfig(async ({ command, mode }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    ...(isStatic ? [staticApiStubs] : []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tanstackStart(tanstackStartOptions as any),
  ];

  // Server builds are packaged by Nitro; the static build is written by TanStack's own prerenderer.
  if (command === "build" && target && !isStatic) {
    const { nitro } = await import("nitro/vite");
    plugins.push(nitro({ preset: target }));
  }
  plugins.push(viteReact());

  // Expose the VITE_* settings to the code (also from .env.production for production builds).
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), "VITE_"))) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return mergeConfig(
    {
      server: { host: "::", port: 8080 },
      define: envDefine,
      css: { transformer: "lightningcss" as const },
      resolve: {
        alias: { "@": `${process.cwd()}/src` },
        dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
      },
      optimizeDeps: {
        include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
        ignoreOutdatedRequests: true,
      },
      plugins,
    },
    // Static builds tell the app it has no server (see src/lib/api-client.ts).
    isStatic ? { define: { "import.meta.env.VITE_STATIC": JSON.stringify("true") } } : {},
  );
});
