import { v4 as uuidv4 } from "uuid";
import type { LayoutNode } from "./types";
import type { WorkbenchDockSizeMemory } from "./workbench-dock-size-memory";

export const WORKBENCH_LAYOUT_LIBRARY_VERSION = 1 as const;
export const MAX_NAMED_WORKBENCH_LAYOUTS = 12;

export type WorkbenchLayoutAppId = string;

export type WorkbenchLayoutSnapshotV1 = {
  version: typeof WORKBENCH_LAYOUT_LIBRARY_VERSION;
  id: string;
  name: string;
  appId: WorkbenchLayoutAppId;
  createdAt: string;
  updatedAt: string;
  source: "user" | "import";
  layout: LayoutNode;
  dockMemory?: WorkbenchDockSizeMemory;
  description?: string;
  basedOnPresetId?: string;
};

export type WorkbenchLayoutLibraryV1 = {
  version: typeof WORKBENCH_LAYOUT_LIBRARY_VERSION;
  appId: WorkbenchLayoutAppId;
  layouts: WorkbenchLayoutSnapshotV1[];
};

export type WorkbenchLayoutPreset = {
  id: string;
  label: string;
  description: string;
  layout: LayoutNode;
};

const LIBRARY_STORAGE_PREFIX = "trn_workbench_layout_lib_";

function getWebLocalStorage(): Storage | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  const g = globalThis as { localStorage?: Storage; window?: { localStorage?: Storage } };
  if (typeof g.window !== "undefined" && g.window?.localStorage != null) {
    return g.window.localStorage;
  }
  if (g.localStorage != null) {
    return g.localStorage;
  }
  return null;
}

export function workbenchLayoutLibraryStorageKey(appId: WorkbenchLayoutAppId): string {
  return `${LIBRARY_STORAGE_PREFIX}${appId}`;
}

function emptyLibrary(appId: WorkbenchLayoutAppId): WorkbenchLayoutLibraryV1 {
  return { version: WORKBENCH_LAYOUT_LIBRARY_VERSION, appId, layouts: [] };
}

function isSnapshot(value: unknown): value is WorkbenchLayoutSnapshotV1 {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as WorkbenchLayoutSnapshotV1;
  return (
    row.version === WORKBENCH_LAYOUT_LIBRARY_VERSION &&
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.appId === "string" &&
    row.layout != null &&
    typeof row.layout === "object"
  );
}

function isLibrary(value: unknown): value is WorkbenchLayoutLibraryV1 {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as WorkbenchLayoutLibraryV1;
  return (
    row.version === WORKBENCH_LAYOUT_LIBRARY_VERSION &&
    typeof row.appId === "string" &&
    Array.isArray(row.layouts)
  );
}

export function readWorkbenchLayoutLibrary(appId: WorkbenchLayoutAppId): WorkbenchLayoutLibraryV1 {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return emptyLibrary(appId);
  }
  try {
    const raw = ls.getItem(workbenchLayoutLibraryStorageKey(appId));
    if (!raw) {
      return emptyLibrary(appId);
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isLibrary(parsed) || parsed.appId !== appId) {
      return emptyLibrary(appId);
    }
    return {
      ...parsed,
      layouts: parsed.layouts.filter(isSnapshot),
    };
  } catch {
    return emptyLibrary(appId);
  }
}

export function writeWorkbenchLayoutLibrary(library: WorkbenchLayoutLibraryV1): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  ls.setItem(
    workbenchLayoutLibraryStorageKey(library.appId),
    JSON.stringify(library),
  );
}

export function normalizeWorkbenchLayoutName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 48);
}

export function findNamedWorkbenchLayoutByName(
  library: WorkbenchLayoutLibraryV1,
  name: string,
): WorkbenchLayoutSnapshotV1 | null {
  const needle = normalizeWorkbenchLayoutName(name).toLowerCase();
  if (!needle) {
    return null;
  }
  return (
    library.layouts.find(
      (row) => normalizeWorkbenchLayoutName(row.name).toLowerCase() === needle,
    ) ?? null
  );
}

export type SaveWorkbenchLayoutResult =
  | { ok: true; snapshot: WorkbenchLayoutSnapshotV1; overwritten: boolean }
  | {
      ok: false;
      reason: "empty_name" | "library_full" | "name_conflict";
      existing?: WorkbenchLayoutSnapshotV1;
    };

export function saveNamedWorkbenchLayout(input: {
  appId: WorkbenchLayoutAppId;
  name: string;
  layout: LayoutNode;
  dockMemory?: WorkbenchDockSizeMemory;
  description?: string;
  basedOnPresetId?: string;
  allowOverwrite?: boolean;
}): SaveWorkbenchLayoutResult {
  const name = normalizeWorkbenchLayoutName(input.name);
  if (!name) {
    return { ok: false, reason: "empty_name" };
  }

  const library = readWorkbenchLayoutLibrary(input.appId);
  const existing = findNamedWorkbenchLayoutByName(library, name);
  if (existing && !input.allowOverwrite) {
    return { ok: false, reason: "name_conflict", existing };
  }

  const now = new Date().toISOString();

  const snapshot: WorkbenchLayoutSnapshotV1 = existing
    ? {
        ...existing,
        name,
        updatedAt: now,
        layout: structuredClone(input.layout),
        dockMemory: structuredClone(input.dockMemory ?? {}),
        description: input.description?.trim() || undefined,
        basedOnPresetId: input.basedOnPresetId,
        source: "user",
      }
    : {
        version: WORKBENCH_LAYOUT_LIBRARY_VERSION,
        id: uuidv4(),
        name,
        appId: input.appId,
        createdAt: now,
        updatedAt: now,
        source: "user",
        layout: structuredClone(input.layout),
        dockMemory: structuredClone(input.dockMemory ?? {}),
        description: input.description?.trim() || undefined,
        basedOnPresetId: input.basedOnPresetId,
      };

  if (!existing && library.layouts.length >= MAX_NAMED_WORKBENCH_LAYOUTS) {
    return { ok: false, reason: "library_full" };
  }

  const nextLayouts = existing
    ? library.layouts.map((row) => (row.id === existing.id ? snapshot : row))
    : [...library.layouts, snapshot];

  writeWorkbenchLayoutLibrary({ ...library, layouts: nextLayouts });
  return { ok: true, snapshot, overwritten: Boolean(existing) };
}

export function deleteNamedWorkbenchLayout(
  appId: WorkbenchLayoutAppId,
  layoutId: string,
): boolean {
  const library = readWorkbenchLayoutLibrary(appId);
  const next = library.layouts.filter((row) => row.id !== layoutId);
  if (next.length === library.layouts.length) {
    return false;
  }
  writeWorkbenchLayoutLibrary({ ...library, layouts: next });
  return true;
}

export function getNamedWorkbenchLayout(
  appId: WorkbenchLayoutAppId,
  layoutId: string,
): WorkbenchLayoutSnapshotV1 | null {
  return readWorkbenchLayoutLibrary(appId).layouts.find((row) => row.id === layoutId) ?? null;
}

export function listNamedWorkbenchLayouts(
  appId: WorkbenchLayoutAppId,
): WorkbenchLayoutSnapshotV1[] {
  return [...readWorkbenchLayoutLibrary(appId).layouts];
}

export function listNamedWorkbenchLayoutsSorted(
  appId: WorkbenchLayoutAppId,
): WorkbenchLayoutSnapshotV1[] {
  return [...readWorkbenchLayoutLibrary(appId).layouts].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export type RenameWorkbenchLayoutResult =
  | { ok: true; snapshot: WorkbenchLayoutSnapshotV1 }
  | {
      ok: false;
      reason: "empty_name" | "not_found" | "name_conflict";
      existing?: WorkbenchLayoutSnapshotV1;
    };

export function renameNamedWorkbenchLayout(input: {
  appId: WorkbenchLayoutAppId;
  layoutId: string;
  name: string;
}): RenameWorkbenchLayoutResult {
  const name = normalizeWorkbenchLayoutName(input.name);
  if (!name) {
    return { ok: false, reason: "empty_name" };
  }
  const library = readWorkbenchLayoutLibrary(input.appId);
  const target = library.layouts.find((row) => row.id === input.layoutId);
  if (!target) {
    return { ok: false, reason: "not_found" };
  }
  const conflict = findNamedWorkbenchLayoutByName(library, name);
  if (conflict && conflict.id !== target.id) {
    return { ok: false, reason: "name_conflict", existing: conflict };
  }
  const now = new Date().toISOString();
  const snapshot: WorkbenchLayoutSnapshotV1 = {
    ...target,
    name,
    updatedAt: now,
  };
  writeWorkbenchLayoutLibrary({
    ...library,
    layouts: library.layouts.map((row) => (row.id === target.id ? snapshot : row)),
  });
  return { ok: true, snapshot };
}

function suggestDuplicateLayoutName(
  library: WorkbenchLayoutLibraryV1,
  baseName: string,
): string {
  const base = normalizeWorkbenchLayoutName(baseName);
  let candidate = `${base} copy`;
  let index = 2;
  while (findNamedWorkbenchLayoutByName(library, candidate)) {
    candidate = `${base} (${index})`;
    index += 1;
  }
  return candidate;
}

export type DuplicateWorkbenchLayoutResult =
  | { ok: true; snapshot: WorkbenchLayoutSnapshotV1 }
  | { ok: false; reason: "not_found" | "library_full" };

export function duplicateNamedWorkbenchLayout(
  appId: WorkbenchLayoutAppId,
  layoutId: string,
): DuplicateWorkbenchLayoutResult {
  const library = readWorkbenchLayoutLibrary(appId);
  const source = library.layouts.find((row) => row.id === layoutId);
  if (!source) {
    return { ok: false, reason: "not_found" };
  }
  if (library.layouts.length >= MAX_NAMED_WORKBENCH_LAYOUTS) {
    return { ok: false, reason: "library_full" };
  }
  const now = new Date().toISOString();
  const snapshot: WorkbenchLayoutSnapshotV1 = {
    ...structuredClone(source),
    id: uuidv4(),
    name: suggestDuplicateLayoutName(library, source.name),
    createdAt: now,
    updatedAt: now,
    source: "user",
  };
  writeWorkbenchLayoutLibrary({ ...library, layouts: [...library.layouts, snapshot] });
  return { ok: true, snapshot };
}

export function reorderNamedWorkbenchLayout(
  appId: WorkbenchLayoutAppId,
  layoutId: string,
  direction: -1 | 1,
): boolean {
  const library = readWorkbenchLayoutLibrary(appId);
  const index = library.layouts.findIndex((row) => row.id === layoutId);
  if (index < 0) {
    return false;
  }
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= library.layouts.length) {
    return false;
  }
  const nextLayouts = [...library.layouts];
  const [row] = nextLayouts.splice(index, 1);
  nextLayouts.splice(nextIndex, 0, row);
  writeWorkbenchLayoutLibrary({ ...library, layouts: nextLayouts });
  return true;
}

export type WorkbenchStartupPreference =
  | { kind: "session" }
  | { kind: "preset"; presetId: string }
  | { kind: "named"; layoutId: string };

const STARTUP_STORAGE_PREFIX = "trn_workbench_startup_";

export function workbenchStartupPreferenceStorageKey(appId: WorkbenchLayoutAppId): string {
  return `${STARTUP_STORAGE_PREFIX}${appId}`;
}

function isStartupPreference(value: unknown): value is WorkbenchStartupPreference {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as WorkbenchStartupPreference;
  if (row.kind === "session") {
    return true;
  }
  if (row.kind === "preset" && typeof row.presetId === "string" && row.presetId.length > 0) {
    return true;
  }
  if (row.kind === "named" && typeof row.layoutId === "string" && row.layoutId.length > 0) {
    return true;
  }
  return false;
}

export function readWorkbenchStartupPreference(
  appId: WorkbenchLayoutAppId,
): WorkbenchStartupPreference {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return { kind: "session" };
  }
  try {
    const raw = ls.getItem(workbenchStartupPreferenceStorageKey(appId));
    if (!raw) {
      return { kind: "session" };
    }
    const parsed = JSON.parse(raw) as unknown;
    return isStartupPreference(parsed) ? parsed : { kind: "session" };
  } catch {
    return { kind: "session" };
  }
}

export function writeWorkbenchStartupPreference(
  appId: WorkbenchLayoutAppId,
  preference: WorkbenchStartupPreference,
): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  ls.setItem(workbenchStartupPreferenceStorageKey(appId), JSON.stringify(preference));
}

export type WorkbenchLayoutExportV1 = {
  exportVersion: typeof WORKBENCH_LAYOUT_LIBRARY_VERSION;
  exportedAt: string;
  snapshot: WorkbenchLayoutSnapshotV1;
};

export function createWorkbenchLayoutExport(
  snapshot: WorkbenchLayoutSnapshotV1,
): WorkbenchLayoutExportV1 {
  return {
    exportVersion: WORKBENCH_LAYOUT_LIBRARY_VERSION,
    exportedAt: new Date().toISOString(),
    snapshot: structuredClone(snapshot),
  };
}

export function serializeWorkbenchLayoutExport(snapshot: WorkbenchLayoutSnapshotV1): string {
  return JSON.stringify(createWorkbenchLayoutExport(snapshot), null, 2);
}

export type ParseWorkbenchLayoutImportResult =
  | { ok: true; snapshot: WorkbenchLayoutSnapshotV1 }
  | { ok: false; reason: "invalid_json" | "invalid_format" | "wrong_app" };

export function parseWorkbenchLayoutImport(
  raw: string,
  expectedAppId: WorkbenchLayoutAppId,
): ParseWorkbenchLayoutImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "invalid_format" };
  }
  const envelope = parsed as Partial<WorkbenchLayoutExportV1 & WorkbenchLayoutSnapshotV1>;
  const snapshot =
    envelope.exportVersion === WORKBENCH_LAYOUT_LIBRARY_VERSION &&
    envelope.snapshot &&
    isSnapshot(envelope.snapshot)
      ? envelope.snapshot
      : isSnapshot(parsed)
        ? (parsed as WorkbenchLayoutSnapshotV1)
        : null;
  if (!snapshot) {
    return { ok: false, reason: "invalid_format" };
  }
  if (snapshot.appId !== expectedAppId) {
    return { ok: false, reason: "wrong_app" };
  }
  return { ok: true, snapshot };
}

export function importWorkbenchLayoutToLibrary(input: {
  appId: WorkbenchLayoutAppId;
  snapshot: WorkbenchLayoutSnapshotV1;
  allowOverwrite?: boolean;
  nameOverride?: string;
}): SaveWorkbenchLayoutResult {
  const name = normalizeWorkbenchLayoutName(input.nameOverride ?? input.snapshot.name);
  return saveNamedWorkbenchLayout({
    appId: input.appId,
    name,
    layout: input.snapshot.layout,
    dockMemory: input.snapshot.dockMemory,
    description: input.snapshot.description,
    basedOnPresetId: input.snapshot.basedOnPresetId,
    allowOverwrite: input.allowOverwrite,
  });
}

export function createWorkbenchLayoutSnapshotFromCurrent(input: {
  appId: WorkbenchLayoutAppId;
  name: string;
  layout: LayoutNode;
  dockMemory?: WorkbenchDockSizeMemory;
  description?: string;
  basedOnPresetId?: string;
}): WorkbenchLayoutSnapshotV1 {
  const now = new Date().toISOString();
  return {
    version: WORKBENCH_LAYOUT_LIBRARY_VERSION,
    id: uuidv4(),
    name: normalizeWorkbenchLayoutName(input.name),
    appId: input.appId,
    createdAt: now,
    updatedAt: now,
    source: "user",
    layout: structuredClone(input.layout),
    dockMemory: structuredClone(input.dockMemory ?? {}),
    description: input.description?.trim() || undefined,
    basedOnPresetId: input.basedOnPresetId,
  };
}

export function workbenchLayoutExportFilename(snapshot: WorkbenchLayoutSnapshotV1): string {
  const slug = snapshot.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const safeSlug = slug || "layout";
  return `${snapshot.appId}-${safeSlug}.trn-workbench-layout.json`;
}

export function downloadWorkbenchLayoutJson(
  snapshot: WorkbenchLayoutSnapshotV1,
): void {
  if (typeof document === "undefined") {
    return;
  }
  const json = serializeWorkbenchLayoutExport(snapshot);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = workbenchLayoutExportFilename(snapshot);
  anchor.click();
  URL.revokeObjectURL(url);
}

export function summarizeWorkbenchLayoutPanes(layout: LayoutNode): string {
  const types = new Set<string>();
  const walk = (node: LayoutNode): void => {
    if (node.type === "editor") {
      types.add(node.editorType);
      return;
    }
    if (node.type === "tabs") {
      for (const pane of node.panes) {
        types.add(pane.editorType);
      }
      return;
    }
    walk(node.first);
    walk(node.second);
  };
  walk(layout);
  return Array.from(types).join(" · ");
}
