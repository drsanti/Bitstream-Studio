/**
 * Copies the minimal npm tree needed by `out/combined-bridge-entry.js` (esbuild keeps `serialport`
 * external). VSIX excludes repo root `node_modules`; staged deps ship next to `out/` instead.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const destRoot = path.join(root, "out", "serialport-runtime", "node_modules");

const PACKAGES = [
  "serialport",
  "@serialport",
  "debug",
  "ms",
  "node-addon-api",
  "node-gyp-build",
];

function main() {
  if (!fs.existsSync(path.join(root, "node_modules"))) {
    console.warn("[stage-serialport-runtime] Skipping: no node_modules (run npm install).");
    return;
  }
  fs.rmSync(path.dirname(destRoot), { recursive: true, force: true });
  fs.mkdirSync(destRoot, { recursive: true });
  for (const name of PACKAGES) {
    const src = path.join(root, "node_modules", name);
    const dst = path.join(destRoot, name);
    if (!fs.existsSync(src)) {
      console.warn(`[stage-serialport-runtime] Missing ${name} — run npm install.`);
      continue;
    }
    fs.cpSync(src, dst, { recursive: true, dereference: true });
  }
  console.log("[stage-serialport-runtime] Staged native serialport stack to out/serialport-runtime/node_modules");
}

main();
