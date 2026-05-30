/**
 * Copy single-thread Jolt WASM glue into extension assets (webview-safe).
 * Multithread binaries are omitted — VS Code webviews do not use COI/pthread Jolt.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "node_modules/jolt-physics/dist");
const dst = path.join(root, "src/assets/jolt");

fs.mkdirSync(dst, { recursive: true });

const files = ["jolt-physics.wasm.js", "jolt-physics.wasm.wasm"];

for (const f of files)
{
  const from = path.join(src, f);
  if (!fs.existsSync(from))
  {
    console.error("missing", from);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(dst, f));
  console.log("copied", f);
}
