/**
 * Stage MediaPipe vision pack into a local clone of ternion-3d-assets-free.
 *
 * Usage:
 *   npm run vision:copy-mediapipe:all
 *   npm run vision:gen-mediapipe-manifest
 *   npm run vision:stage-free-pack
 *
 * Env:
 *   TERNION_FREE_ASSETS_REPO — override destination (default: ../../ternion-3d-assets-free)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(__dirname, "..");
const srcPack = path.join(extensionRoot, "src/assets/vision/mediapipe");

const defaultFreeRepo = path.resolve(extensionRoot, "../../ternion-3d-assets-free");
const freeRepo = process.env.TERNION_FREE_ASSETS_REPO?.trim() || defaultFreeRepo;
const dstPack = path.join(freeRepo, "assets/vision/mediapipe");

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
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
    console.error("[vision:stage-free-pack] missing src — run vision:copy-mediapipe:all first");
    process.exit(1);
  }
  if (!fs.existsSync(freeRepo)) {
    console.error(
      `[vision:stage-free-pack] free repo not found at ${freeRepo} — set TERNION_FREE_ASSETS_REPO`,
    );
    process.exit(1);
  }

  copyRecursive(srcPack, dstPack);

  const noticeSrc = path.join(dstPack, "NOTICE.md");
  if (!fs.existsSync(noticeSrc)) {
    fs.writeFileSync(
      noticeSrc,
      `# MediaPipe notice\n\nModels and WASM from Google MediaPipe Tasks Vision.\nSee https://developers.google.com/mediapipe\n`,
      "utf8",
    );
  }

  console.log(`[vision:stage-free-pack] staged → ${dstPack}`);
  console.log("[vision:stage-free-pack] next: bump assets/feed.json revision, commit + push in ternion-3d-assets-free");
}

main();
