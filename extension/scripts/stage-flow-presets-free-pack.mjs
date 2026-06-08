/**
 * Stage official flow presets into a local clone of ternion-3d-assets-free.
 *
 * Usage:
 *   npm run flow-preset:gen
 *   npm run flow-preset:stage-free-pack
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stageFlowPresetsFreePack } from "./flow-preset-publish-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(__dirname, "..");

const result = stageFlowPresetsFreePack(extensionRoot);
if (!result.ok) {
  console.error(`[flow-preset:stage-free-pack] ${result.error}`);
  process.exit(1);
}

console.log(
  `[flow-preset:stage-free-pack] staged ${result.fileCount} JSON files → ${result.stagedPackPath}`,
);
console.log(`[flow-preset:stage-free-pack] next: ${result.nextStep}`);
