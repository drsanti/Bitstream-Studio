/**
 * Generate assets/vision/mediapipe/manifest.v1.json from extension/src/assets/vision/mediapipe.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const packRoot = path.join(root, "src/assets/vision/mediapipe");
const outPath = path.join(packRoot, "manifest.v1.json");

const WASM_FILES = [
  "wasm/vision_wasm_internal.js",
  "wasm/vision_wasm_internal.wasm",
  "wasm/vision_wasm_nosimd_internal.js",
  "wasm/vision_wasm_nosimd_internal.wasm",
];

const LITE_FILES = ["pose_landmarker_lite.task"];

const OPTIONAL_FILES = [
  "pose_landmarker_full.task",
  "pose_landmarker_heavy.task",
  "hand_landmarker.task",
  "face_landmarker.task",
  "efficientdet_lite0.tflite",
];

function readPkgVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    );
    const dep = pkg.dependencies?.["@mediapipe/tasks-vision"];
    return typeof dep === "string" ? dep.replace(/^\^/, "") : undefined;
  } catch {
    return undefined;
  }
}

function collectFiles(relPaths) {
  const files = [];
  for (const rel of relPaths) {
    const abs = path.join(packRoot, rel);
    if (!fs.existsSync(abs)) {
      continue;
    }
    const st = fs.statSync(abs);
    if (st.isFile()) {
      files.push({ path: rel.replace(/\\/g, "/"), bytes: st.size });
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(packRoot)) {
    console.warn("[vision:gen-mediapipe-manifest] pack root missing — run vision:copy-mediapipe first");
    process.exit(1);
  }

  const wasmAndLite = collectFiles([...WASM_FILES, ...LITE_FILES]);
  const optional = collectFiles(OPTIONAL_FILES);
  const allPresent = [...wasmAndLite, ...optional];

  const manifest = {
    revision: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    mediapipeTasksVisionVersion: readPkgVersion(),
    files: allPresent,
    packs: {
      lite: [...WASM_FILES, ...LITE_FILES],
      full: [...WASM_FILES, ...LITE_FILES, ...OPTIONAL_FILES],
    },
  };

  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    `[vision:gen-mediapipe-manifest] wrote ${path.relative(root, outPath)} (${allPresent.length} files)`,
  );
}

main();
