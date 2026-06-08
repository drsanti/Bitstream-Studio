/**
 * Upload bundled official flow presets to GitHub (ternion-3d-assets-free).
 * Requires GITHUB_TOKEN on the host running this script.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishFlowPresetsFreePack } from "./flow-preset-publish-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(__dirname, "..");

const result = await publishFlowPresetsFreePack(extensionRoot);
if (!result.ok) {
  console.error(result.error);
  process.exit(1);
}

console.log(
  `Done — ${result.fileCount} files published to ${result.repo}@${result.branch}/${result.remotePrefix}/`,
);
