import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Deployment target. Explicit env always wins; production defaults to the
// Nitro node-server build for the Hostinger Node.js web app deployment
// (hPanel sets NODE_ENV=production). Force a different target by setting
// DEPLOY_TARGET=cloudflare-module | static for Lovable Publish / static hosts.
const target =
  process.env.VERCEL ? "vercel"
  : process.env.NETLIFY ? "netlify"
  : process.env.DEPLOY_TARGET === "node" ? "node-server"
  : process.env.DEPLOY_TARGET === "static" ? "static"
  : process.env.DEPLOY_TARGET === "cloudflare-module" ? "cloudflare-module"
  : (process.env.NODE_ENV === "production" ? "node-server" : undefined);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Increase the limit to 1000kB (1MB)
    chunkSizeWarningLimit: 1000,
  },
  ...(target ? { nitro: { preset: target } } : {}),
});
