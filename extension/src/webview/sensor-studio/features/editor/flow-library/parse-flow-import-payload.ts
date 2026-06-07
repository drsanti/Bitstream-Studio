import { FLOW_CLIPBOARD_MARKER, FLOW_CLIPBOARD_VERSION } from "../clipboard/flow-clipboard";
import { parseStudioNodeAssetFile, type StudioNodeAssetFile } from "../subgraphs/node-library/studio-node-asset-file";
import {
  parseStudioFlowPresetFile,
  type StudioFlowPresetFile,
} from "./studio-flow-preset-file";

export type FlowImportPayload =
  | { kind: "flow-preset"; preset: StudioFlowPresetFile }
  | { kind: "node-asset"; asset: StudioNodeAssetFile }
  | { kind: "flow-clipboard"; text: string }
  | { kind: "raw-flow-document"; text: string };

export function parseFlowImportPayload(text: string): FlowImportPayload | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const nodeAsset = parseStudioNodeAssetFile(trimmed);
  if (nodeAsset != null) {
    return { kind: "node-asset", asset: nodeAsset };
  }

  const flowPreset = parseStudioFlowPresetFile(trimmed);
  if (flowPreset != null) {
    return { kind: "flow-preset", preset: flowPreset };
  }

  try {
    const raw = JSON.parse(trimmed) as Record<string, unknown>;
    if (raw.marker === FLOW_CLIPBOARD_MARKER && raw.version === FLOW_CLIPBOARD_VERSION) {
      return { kind: "flow-clipboard", text: trimmed };
    }
    if (raw.version === 1 && Array.isArray(raw.nodes) && Array.isArray(raw.edges)) {
      return { kind: "raw-flow-document", text: trimmed };
    }
  } catch {
    return null;
  }

  return null;
}
