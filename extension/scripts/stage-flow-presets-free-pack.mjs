/**
 * Stage official flow presets into a local clone of ternion-3d-assets-free.
 *
 * Usage:
 *   npm run flow-preset:gen
 *   npm run flow-preset:stage-free-pack
 *
 * Env:
 *   TERNION_FREE_ASSETS_REPO — override destination (default: ../../ternion-3d-assets-free)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(__dirname, "..");
const srcPack = path.join(extensionRoot, "src/assets/libraries/flow-preset");

const defaultFreeRepo = path.resolve(extensionRoot, "../../ternion-3d-assets-free");
const freeRepo = process.env.TERNION_FREE_ASSETS_REPO?.trim() || defaultFreeRepo;
const dstPack = path.join(freeRepo, "assets/libraries/flow-preset");

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === "README.md") {
      continue;
    }
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(src, dest);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

function main() {
  if (!fs.existsSync(srcPack)) {
    console.error("[flow-preset:stage-free-pack] missing src — run flow-preset:gen first");
    process.exit(1);
  }
  if (!fs.existsSync(freeRepo)) {
    console.error(
      `[flow-preset:stage-free-pack] free repo not found at ${freeRepo} — set TERNION_FREE_ASSETS_REPO`,
    );
    process.exit(1);
  }

  copyRecursive(srcPack, dstPack);

  const fileCount = fs.readdirSync(dstPack).filter((name) => name.endsWith(".json")).length;
  console.log(`[flow-preset:stage-free-pack] staged ${fileCount} JSON files → ${dstPack}`);
  console.log(
    "[flow-preset:stage-free-pack] next: bump assets/feed.json revision, commit + push in ternion-3d-assets-free",
  );
}

main();
