import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const target =
  process.env.VERCEL ? "vercel"
  : process.env.NETLIFY ? "netlify"
  : process.env.DEPLOY_TARGET === "node" ? "node-server"
  : process.env.DEPLOY_TARGET === "static" ? "static"
  : "cloudflare-module";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Increase the limit to 1000kB (1MB)
    chunkSizeWarningLimit: 1000,
  },
  nitro: { preset: target },
});
