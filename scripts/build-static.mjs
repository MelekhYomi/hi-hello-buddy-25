// Builds the static site for Hostinger into dist/client:  npm run build:static
import { spawn } from "node:child_process";

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["vite", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, DEPLOY_TARGET: "static", NODE_OPTIONS: "--max-old-space-size=4096" },
});
child.on("exit", (code) => process.exit(code ?? 1));
