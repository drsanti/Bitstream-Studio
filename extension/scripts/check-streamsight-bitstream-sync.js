const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const extensionRoot = path.resolve(__dirname, "..");
const defaultReferenceRoot = "D:/CODE/2026/TESAIoT_PSoC_Edge_Workspace/StreamSight";

const referenceRoot = process.env.STREAMSIGHT_REFERENCE_ROOT || defaultReferenceRoot;

const lockFilePath = path.join(extensionRoot, "src", "bitstream", "docs", "streamsight-reference-lock.json");

const trackedFiles = [
  "packages/backend/src/protocol/bitstreamBuilder.ts",
  "packages/backend/src/protocol/bitstreamParser.ts",
  "packages/backend/src/protocol/handshake.ts",
  "packages/backend/src/serial/serialPortManager.ts",
  "docs/ARCHITECTURE.md",
  "docs/SYSTEM_DIAGNOSTICS_TYPE_0X05_SPEC.md",
];

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function safeReadFile(absolutePath) {
  try {
    return await fs.readFile(absolutePath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function collectCurrent() {
  const files = [];
  for (const rel of trackedFiles) {
    const absolutePath = path.join(referenceRoot, rel);
    const content = await safeReadFile(absolutePath);
    if (!content) {
      files.push({
        path: rel,
        exists: false,
        sha256: null,
        size: 0,
      });
      continue;
    }

    files.push({
      path: rel,
      exists: true,
      sha256: sha256(content),
      size: content.byteLength,
    });
  }
  return {
    referenceRoot,
    capturedAt: new Date().toISOString(),
    files,
  };
}

async function readLock() {
  const data = await safeReadFile(lockFilePath);
  if (!data) {
    return null;
  }
  return JSON.parse(data.toString("utf8"));
}

function formatDriftLine(type, relPath, extra) {
  return `[${type}] ${relPath}${extra ? ` :: ${extra}` : ""}`;
}

function compareLock(lockData, currentData) {
  const drifts = [];
  const lockByPath = new Map((lockData.files || []).map((f) => [f.path, f]));

  for (const current of currentData.files) {
    const old = lockByPath.get(current.path);
    if (!old) {
      drifts.push(formatDriftLine("NEW", current.path, "Not present in lock"));
      continue;
    }

    if (old.exists !== current.exists) {
      drifts.push(formatDriftLine("EXISTS", current.path, `lock=${old.exists} current=${current.exists}`));
      continue;
    }

    if (!current.exists) {
      continue;
    }

    if (old.sha256 !== current.sha256) {
      drifts.push(formatDriftLine("HASH", current.path, `lock=${old.sha256} current=${current.sha256}`));
    }
  }

  return drifts;
}

async function writeLock(data) {
  await fs.mkdir(path.dirname(lockFilePath), { recursive: true });
  await fs.writeFile(lockFilePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function main() {
  const shouldUpdate = process.argv.includes("--update");
  const current = await collectCurrent();

  if (shouldUpdate) {
    await writeLock(current);
    console.log("[streamsight-sync] Lock file updated:", lockFilePath);
    console.log("[streamsight-sync] Reference root:", referenceRoot);
    return;
  }

  const lock = await readLock();
  if (!lock) {
    console.error("[streamsight-sync] Missing lock file:", lockFilePath);
    console.error("[streamsight-sync] Run: node scripts/check-streamsight-bitstream-sync.js --update");
    process.exit(2);
    return;
  }

  const referenceAvailable = current.files.some((f) => f.exists);
  if (!referenceAvailable) {
    console.warn(
      "[streamsight-sync] SKIP: no tracked files at reference root (set STREAMSIGHT_REFERENCE_ROOT if needed):",
      referenceRoot,
    );
    return;
  }

  const drifts = compareLock(lock, current);
  if (drifts.length === 0) {
    console.log("[streamsight-sync] OK: no drift detected.");
    console.log("[streamsight-sync] Reference root:", referenceRoot);
    return;
  }

  console.error("[streamsight-sync] Drift detected against lock file:");
  for (const line of drifts) {
    console.error(" -", line);
  }
  console.error(
    "[streamsight-sync] Review and then update lock if accepted: node scripts/check-streamsight-bitstream-sync.js --update",
  );
  process.exit(1);
}

main().catch((error) => {
  console.error("[streamsight-sync] Failed:", error);
  process.exit(1);
});
