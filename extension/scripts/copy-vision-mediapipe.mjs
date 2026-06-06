/**
 * Copy MediaPipe Tasks Vision WASM + download default pose model for local / fast Vision Pose load.
 * Idempotent — skips files that already exist with non-zero size.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dstRoot = path.join(root, "src/assets/vision/mediapipe");
const wasmSrc = path.join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const wasmDst = path.join(dstRoot, "wasm");

/** Minimum set for Vision Pose (lite model). Optional models: run with --all */
const POSE_LITE_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const OPTIONAL_MODELS = [
  {
    file: "pose_landmarker_full.task",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  },
  {
    file: "pose_landmarker_heavy.task",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
  },
  {
    file: "hand_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  },
  {
    file: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  },
  {
    file: "efficientdet_lite0.tflite",
    url: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
  },
];

function copyFileIfChanged(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) {
    const srcStat = fs.statSync(from);
    const dstStat = fs.statSync(to);
    if (dstStat.size === srcStat.size && dstStat.mtimeMs >= srcStat.mtimeMs) {
      return false;
    }
  }
  fs.copyFileSync(from, to);
  return true;
}

function copyWasmTree() {
  if (!fs.existsSync(wasmSrc)) {
    console.warn(
      "[vision:copy-mediapipe] skip WASM — install deps first (npm install). Missing:",
      wasmSrc,
    );
    return false;
  }
  fs.mkdirSync(wasmDst, { recursive: true });
  let copied = 0;
  for (const entry of fs.readdirSync(wasmSrc, { withFileTypes: true })) {
    const from = path.join(wasmSrc, entry.name);
    const to = path.join(wasmDst, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(from, to, { recursive: true, force: true });
      copied += 1;
      console.log("[vision:copy-mediapipe] copied dir", entry.name);
    } else if (copyFileIfChanged(from, to)) {
      copied += 1;
      console.log("[vision:copy-mediapipe] copied", entry.name);
    }
  }
  if (copied === 0) {
    console.log("[vision:copy-mediapipe] WASM up to date");
  }
  return true;
}

async function downloadModel(url, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1024) {
    console.log("[vision:copy-mediapipe] skip (exists)", path.basename(destPath));
    return true;
  }
  console.log("[vision:copy-mediapipe] downloading", path.basename(destPath), "…");
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(
      `[vision:copy-mediapipe] download failed ${res.status} ${path.basename(destPath)}`,
    );
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  console.log("[vision:copy-mediapipe] wrote", path.basename(destPath), `(${buf.length} bytes)`);
  return true;
}

async function main() {
  const includeAll = process.argv.includes("--all");
  fs.mkdirSync(dstRoot, { recursive: true });

  const wasmOk = copyWasmTree();
  const liteOk = await downloadModel(
    POSE_LITE_URL,
    path.join(dstRoot, "pose_landmarker_lite.task"),
  );

  if (includeAll) {
    for (const model of OPTIONAL_MODELS) {
      await downloadModel(model.url, path.join(dstRoot, model.file));
    }
  }

  if (!wasmOk || !liteOk) {
    console.warn(
      "[vision:copy-mediapipe] incomplete — Vision Pose will fall back to CDN until assets are present.",
    );
    console.warn("[vision:copy-mediapipe] retry: npm run vision:copy-mediapipe");
    process.exit(0);
  }

  console.log("[vision:copy-mediapipe] done — bundled models under src/assets/vision/mediapipe (Prefer bundled ON).");
}

main().catch((err) => {
  console.warn("[vision:copy-mediapipe] error:", err instanceof Error ? err.message : err);
  process.exit(0);
});
