import { defineConfig } from "nitro/config";

// Pre-gzip/brotli the built JS and CSS so the Node server can send small files on its own,
// without depending on a CDN in front of it. Uploaded/site images are cached for a week;
// the built /assets files are already cached for a year by their hashed names.
const week = "public, max-age=604800, stale-while-revalidate=86400";

export default defineConfig({
  compressPublicAssets: true,
  routeRules: {
    "/portfolio/**": { headers: { "cache-control": week } },
    "/products/**": { headers: { "cache-control": week } },
    "/blog/**": { headers: { "cache-control": week } },
    "/og-image.jpg": { headers: { "cache-control": week } },
    "/hero-bg.jpg": { headers: { "cache-control": week } },
  },
});
