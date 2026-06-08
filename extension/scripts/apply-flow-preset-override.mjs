/**
 * Copy a downloaded official override into the maintainer overrides folder.
 *
 * Usage:
 *   npm run flow-preset:apply-override -- signal-chain ./signal-chain.trn-flow-preset.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveFlowPresetOverrideDest,
  validateFlowPresetOverridePayload,
  writeFlowPresetOverrideFile,
} from "./flow-preset-override-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(__dirname, "..");

const templateId = process.argv[2]?.trim();
const sourcePath = process.argv[3]?.trim();

if (templateId == null || templateId.length === 0 || sourcePath == null || sourcePath.length === 0) {
  console.error("Usage: npm run flow-preset:apply-override -- <templateId> <source.json>");
  process.exit(1);
}

const resolvedSource = path.resolve(process.cwd(), sourcePath);
if (!fs.existsSync(resolvedSource)) {
  console.error(`Source not found: ${resolvedSource}`);
  process.exit(1);
}

let parsed;
let content;
try {
  content = fs.readFileSync(resolvedSource, "utf8");
  parsed = JSON.parse(content);
} catch (error) {
  console.error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const validation = validateFlowPresetOverridePayload(templateId, parsed);
if (!validation.ok) {
  console.error(validation.error);
  process.exit(1);
}
if (validation.warning) {
  console.warn(`warn: ${validation.warning}`);
}

const destPath = resolveFlowPresetOverrideDest(extensionRoot, templateId);
writeFlowPresetOverrideFile(destPath, content);
console.log(`applied override → ${destPath}`);
console.log("next: npm run flow-preset:gen");
