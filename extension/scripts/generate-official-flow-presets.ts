/**
 * Export built-in demo templates as bundled official `trn-flow-preset` files.
 * Run: `npm run flow-preset:gen` from `extension/`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { NODE_CATALOG_DEFAULTS } from "../src/webview/sensor-studio/config/node-catalog.config";
import { CANVAS_DEMO_TEMPLATE_OPTIONS } from "../src/webview/sensor-studio/features/editor/components/inspector/canvas-inspector-demo-templates";
import { buildDemoTemplateFlowPreset } from "../src/webview/sensor-studio/features/editor/flow-library/build-demo-template-flow-preset";
import {
  demoTemplateFlowPresetCategory,
  officialFlowPresetFileName,
  officialFlowPresetIdForTemplate,
} from "../src/webview/sensor-studio/features/editor/flow-library/demo-template-flow-preset-category";
import { OFFICIAL_FLOW_PRESET_OVERRIDE_DIR_NAME } from "../src/webview/sensor-studio/features/editor/flow-library/official-flow-preset-override-paths";
import {
  parseStudioFlowPresetFile,
  serializeStudioFlowPresetFile,
  type StudioFlowPresetFile,
} from "../src/webview/sensor-studio/features/editor/flow-library/studio-flow-preset-file";
import type { StudioDemoTemplateId } from "../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import { useFlowEditorStore } from "../src/webview/sensor-studio/features/editor/store/flow-editor.store";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../src/assets/libraries/flow-preset");
const OVERRIDE_DIR = path.join(OUT_DIR, OFFICIAL_FLOW_PRESET_OVERRIDE_DIR_NAME);

function indexEntryFromPreset(preset: StudioFlowPresetFile, fileName: string) {
  return {
    id: preset.meta.id,
    name: preset.meta.name,
    category: preset.meta.category,
    file: fileName,
    description: preset.meta.description,
  };
}

function readMaintainerOverride(fileName: string): StudioFlowPresetFile | null {
  const overridePath = path.join(OVERRIDE_DIR, fileName);
  if (!fs.existsSync(overridePath)) {
    return null;
  }
  const text = fs.readFileSync(overridePath, "utf8");
  const parsed = parseStudioFlowPresetFile(text);
  if (parsed == null) {
    console.warn(`skip override ${fileName}: invalid trn-flow-preset`);
    return null;
  }
  return parsed;
}

function main(): void {
  const catalog = NODE_CATALOG_DEFAULTS.payload.nodes;
  useFlowEditorStore.setState({ tickSimulation: () => {} });
  const indexEntries: Array<{
    id: string;
    name: string;
    category: string;
    file: string;
    description?: string;
  }> = [];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const option of CANVAS_DEMO_TEMPLATE_OPTIONS) {
    const templateId = option.value as StudioDemoTemplateId;
    useFlowEditorStore.getState().resetCanvas();
    useFlowEditorStore.getState().runDemoTemplate(templateId, catalog);
    const st = useFlowEditorStore.getState();
    if (st.nodes.length === 0) {
      console.warn(`skip ${templateId}: runDemoTemplate produced no nodes`);
      continue;
    }

    const preset = buildDemoTemplateFlowPreset({
      templateId,
      name: option.label,
      description: option.hint,
      nodes: st.nodes,
      edges: st.edges,
      subgraphs: st.subgraphs,
      activeGraphId: st.activeGraphId,
      rootNodes: st.rootNodes,
      rootEdges: st.rootEdges,
    });

    const fileName = officialFlowPresetFileName(templateId);
    const outPath = path.join(OUT_DIR, fileName);
    const override = readMaintainerOverride(fileName);
    if (override != null) {
      fs.writeFileSync(outPath, `${serializeStudioFlowPresetFile(override)}\n`, "utf8");
      indexEntries.push(indexEntryFromPreset(override, fileName));
      console.log(`override ${fileName} (${override.document.nodes.length} nodes)`);
      continue;
    }

    fs.writeFileSync(outPath, `${serializeStudioFlowPresetFile(preset)}\n`, "utf8");

    indexEntries.push({
      id: officialFlowPresetIdForTemplate(templateId),
      name: option.label,
      category: demoTemplateFlowPresetCategory(templateId),
      file: fileName,
      description: option.hint,
    });
    console.log(`wrote ${fileName} (${st.nodes.length} nodes)`);
  }

  const index = { version: 1, entries: indexEntries };
  fs.writeFileSync(
    path.join(OUT_DIR, "index.json"),
    `${JSON.stringify(index, null, 2)}\n`,
    "utf8",
  );
  console.log(`index.json — ${indexEntries.length} entries`);
  // Avoid deferred GLB auto-bind callbacks after Node teardown.
  process.exit(0);
}

main();
