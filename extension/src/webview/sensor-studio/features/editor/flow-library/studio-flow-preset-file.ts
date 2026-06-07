import type { PersistedFlowDocumentV1 } from "../../../persistence/flow-graph.repository";

export const STUDIO_FLOW_PRESET_MARKER = "trn-flow-preset" as const;
export const STUDIO_FLOW_PRESET_VERSION = 1 as const;

export const STUDIO_FLOW_PRESET_CATEGORIES = [
  "telemetry",
  "audio",
  "animation",
  "stage",
  "vision",
  "scene",
  "utility",
  "custom",
] as const;

export type StudioFlowPresetCategory = (typeof STUDIO_FLOW_PRESET_CATEGORIES)[number];

export type StudioFlowPresetKind = "flowFull" | "flowPartial";

export type StudioFlowPresetDependencies = {
  modelUrls?: string[];
  hdriPresets?: string[];
  dataChannels?: string[];
};

export type StudioFlowPresetMeta = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  category: StudioFlowPresetCategory;
  presetKind: StudioFlowPresetKind;
  /** Graph level saved (`__root__` or group id). */
  activeGraphId?: string;
  /** Upsert key — root scope or sorted selection ids. */
  sourceScopeId?: string;
  createdAt: string;
  updatedAt: string;
  appVersion?: string;
};

export type StudioFlowPresetDocument = Pick<
  PersistedFlowDocumentV1,
  "version" | "nodes" | "edges" | "subgraphs" | "rootNodes" | "rootEdges" | "activeGraphId" | "graphStack"
>;

export type StudioFlowPresetFile = {
  marker: typeof STUDIO_FLOW_PRESET_MARKER;
  version: typeof STUDIO_FLOW_PRESET_VERSION;
  meta: StudioFlowPresetMeta;
  document: StudioFlowPresetDocument;
  dependencies?: StudioFlowPresetDependencies;
};

export function createStudioFlowPresetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isStudioFlowPresetCategory(value: unknown): value is StudioFlowPresetCategory {
  return (
    typeof value === "string" &&
    (STUDIO_FLOW_PRESET_CATEGORIES as readonly string[]).includes(value)
  );
}

export function createStudioFlowPresetMeta(
  name: string,
  patch?: Partial<StudioFlowPresetMeta>,
): StudioFlowPresetMeta {
  const now = new Date().toISOString();
  return {
    id: patch?.id ?? createStudioFlowPresetId(),
    name,
    description: patch?.description,
    tags: patch?.tags,
    category: patch?.category ?? "custom",
    presetKind: patch?.presetKind ?? "flowFull",
    activeGraphId: patch?.activeGraphId,
    sourceScopeId: patch?.sourceScopeId,
    createdAt: patch?.createdAt ?? now,
    updatedAt: now,
    appVersion: patch?.appVersion,
  };
}

export function serializeStudioFlowPresetFile(asset: StudioFlowPresetFile): string {
  return JSON.stringify(asset, null, 2);
}

export function parseStudioFlowPresetFile(text: string): StudioFlowPresetFile | null {
  try {
    const raw = JSON.parse(text) as Partial<StudioFlowPresetFile>;
    if (raw?.marker !== STUDIO_FLOW_PRESET_MARKER || raw.version !== STUDIO_FLOW_PRESET_VERSION) {
      return null;
    }
    if (raw.meta == null || typeof raw.meta.name !== "string" || raw.meta.name.trim().length === 0) {
      return null;
    }
    if (raw.document == null || typeof raw.document !== "object") {
      return null;
    }
    const doc = raw.document as StudioFlowPresetDocument;
    if (doc.version !== 1 || !Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) {
      return null;
    }
    const category = isStudioFlowPresetCategory(raw.meta.category) ? raw.meta.category : "custom";
    const presetKind: StudioFlowPresetKind =
      raw.meta.presetKind === "flowPartial" ? "flowPartial" : "flowFull";
    return {
      marker: STUDIO_FLOW_PRESET_MARKER,
      version: STUDIO_FLOW_PRESET_VERSION,
      meta: {
        id: typeof raw.meta.id === "string" ? raw.meta.id : createStudioFlowPresetId(),
        name: raw.meta.name.trim(),
        description:
          typeof raw.meta.description === "string" ? raw.meta.description : undefined,
        tags: Array.isArray(raw.meta.tags)
          ? raw.meta.tags.filter((t): t is string => typeof t === "string")
          : undefined,
        category,
        presetKind,
        activeGraphId:
          typeof raw.meta.activeGraphId === "string" ? raw.meta.activeGraphId : undefined,
        sourceScopeId:
          typeof raw.meta.sourceScopeId === "string" ? raw.meta.sourceScopeId : undefined,
        createdAt:
          typeof raw.meta.createdAt === "string" ? raw.meta.createdAt : new Date().toISOString(),
        updatedAt:
          typeof raw.meta.updatedAt === "string" ? raw.meta.updatedAt : new Date().toISOString(),
        appVersion: typeof raw.meta.appVersion === "string" ? raw.meta.appVersion : undefined,
      },
      document: doc,
      dependencies: raw.dependencies as StudioFlowPresetDependencies | undefined,
    };
  } catch {
    return null;
  }
}

export function downloadStudioFlowPresetFile(
  asset: StudioFlowPresetFile,
  filename?: string,
): void {
  if (typeof document === "undefined") {
    return;
  }
  const safe =
    filename ??
    `${asset.meta.name
      .trim()
      .replace(/[^\w-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 64) || "flow-preset"}.trn-flow-preset.json`;
  const blob = new Blob([serializeStudioFlowPresetFile(asset)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safe.endsWith(".json") ? safe : `${safe}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function rekeyStudioFlowPresetMeta(asset: StudioFlowPresetFile): StudioFlowPresetFile {
  const now = new Date().toISOString();
  return {
    ...asset,
    meta: {
      ...asset.meta,
      id: createStudioFlowPresetId(),
      sourceScopeId: undefined,
      createdAt: asset.meta.createdAt ?? now,
      updatedAt: now,
    },
  };
}
