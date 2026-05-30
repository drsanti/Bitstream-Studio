const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const extensionRoot = path.resolve(__dirname, "..");
const t3dRoot = path.resolve(extensionRoot, "../T3D");
const t3dSrcRoot = path.join(t3dRoot, "src");
const t3dDistRoot = path.join(t3dRoot, "dist");
const viteCacheDir = path.join(extensionRoot, "node_modules", ".vite");
const linkedPackagePath = path.join(
  extensionRoot,
  "node_modules",
  "@ternion",
  "t3d",
);

function safeStat(targetPath) {
  try {
    return fs.statSync(targetPath);
  } catch {
    return null;
  }
}

function getNewestMtimeMs(rootDir) {
  let newest = 0;
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const stat = safeStat(fullPath);
      if (stat && stat.mtimeMs > newest) {
        newest = stat.mtimeMs;
      }
    }
  }

  return newest;
}

function isT3DLinkedToLocalRepo() {
  try {
    const linkStat = fs.lstatSync(linkedPackagePath);
    if (!linkStat.isSymbolicLink()) return false;
    const resolved = fs.realpathSync(linkedPackagePath);
    const normalizedResolved = resolved.replace(/\\/g, "/").toLowerCase();
    const normalizedT3DRoot = t3dRoot.replace(/\\/g, "/").toLowerCase();
    return normalizedResolved.includes(normalizedT3DRoot);
  } catch {
    return false;
  }
}

function main() {
  if (!isT3DLinkedToLocalRepo()) {
    console.log(
      "[ensure-t3d-linked-build-fresh] @ternion/t3d is not a local symlink, skipping freshness check.",
    );
    return;
  }

  const srcStat = safeStat(t3dSrcRoot);
  if (!srcStat || !srcStat.isDirectory()) {
    console.log(
      `[ensure-t3d-linked-build-fresh] Missing T3D source at ${t3dSrcRoot}, skipping.`,
    );
    return;
  }

  const distStat = safeStat(t3dDistRoot);
  const newestSrcMtime = getNewestMtimeMs(t3dSrcRoot);
  const newestDistMtime = distStat && distStat.isDirectory() ? getNewestMtimeMs(t3dDistRoot) : 0;

  const shouldRebuild = !distStat || newestSrcMtime > newestDistMtime;
  if (!shouldRebuild) {
    console.log(
      "[ensure-t3d-linked-build-fresh] T3D dist is up to date.",
    );
    return;
  }

  console.log(
    "[ensure-t3d-linked-build-fresh] Detected newer T3D source, rebuilding T3D dist...",
  );
  execSync("npm run build:lib:dev", {
    cwd: t3dRoot,
    stdio: "inherit",
  });
  try {
    fs.rmSync(viteCacheDir, { recursive: true, force: true });
    console.log(
      "[ensure-t3d-linked-build-fresh] Cleared extension Vite cache (node_modules/.vite).",
    );
  } catch (error) {
    console.warn(
      "[ensure-t3d-linked-build-fresh] Failed to clear node_modules/.vite:",
      error,
    );
  }
  console.log("[ensure-t3d-linked-build-fresh] Rebuild complete.");
}

main();
