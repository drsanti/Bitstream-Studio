import fs from "node:fs";
import path from "node:path";

export const OFFICIAL_FLOW_PRESET_OVERRIDE_DIR_NAME = "overrides";

export function resolveFlowPresetPackDir(extensionRoot) {
  return path.join(extensionRoot, "src/assets/libraries/flow-preset");
}

export function resolveFlowPresetOverrideDir(extensionRoot) {
  return path.join(resolveFlowPresetPackDir(extensionRoot), OFFICIAL_FLOW_PRESET_OVERRIDE_DIR_NAME);
}

export function resolveFlowPresetOverrideDest(extensionRoot, templateId) {
  const safe = String(templateId).trim();
  if (!/^[a-z0-9-]+$/.test(safe)) {
    throw new Error(`Invalid template id: ${templateId}`);
  }
  return path.join(resolveFlowPresetOverrideDir(extensionRoot), `${safe}.trn-flow-preset.json`);
}

export function validateFlowPresetOverridePayload(templateId, parsed) {
  if (parsed?.marker !== "trn-flow-preset") {
    return { ok: false, error: "File is not a trn-flow-preset export." };
  }
  const expectedId = `official-${templateId}`;
  if (parsed?.meta?.id !== expectedId) {
    return {
      ok: true,
      warning: `meta.id is "${parsed?.meta?.id}" — expected "${expectedId}"`,
    };
  }
  return { ok: true };
}

export function writeFlowPresetOverrideFile(destPath, content) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  fs.writeFileSync(destPath, normalized, "utf8");
}
