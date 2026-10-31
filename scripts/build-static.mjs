// Builds the static site for Hostinger into dist/client:  npm run build:static
import { spawn } from "node:child_process";

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["vite", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, DEPLOY_TARGET: "static", NODE_OPTIONS: "--max-old-space-size=4096" },
});
child.on("exit", (code) => {
  if (code) process.exit(code);
  // The live /sitemap.xml route needs a server, so write the file at build time.
  const sitemap = spawn(process.execPath, ["scripts/build-sitemap.mjs"], { stdio: "inherit" });
  sitemap.on("exit", (c) => process.exit(c ?? 1));
});
