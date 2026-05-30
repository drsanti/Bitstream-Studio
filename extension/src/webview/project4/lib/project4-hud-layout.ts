/**
 * Persisted draggable HUD tiles — positions + optional hidden state — separate from
 * **`ternion.project4.settings.v1`** (MCU/hardware).
 */

export const PROJECT4_HUD_LAYOUT_STORAGE_KEY = "ternion.project4.hudLayout.v1";

/** Dispatched after hidden-set changes so multiple components stay in sync. */
export const PROJECT4_HUD_PANELS_CHANGED_EVENT = "project4-hud-panels-changed";

export type Project4HudPersistPanelId =
  | "connection"
  | "telemetry"
  | "motion"
  | "mcuCard";

export const PROJECT4_HUD_PANEL_IDS: readonly Project4HudPersistPanelId[] = [
  "connection",
  "telemetry",
  "motion",
  "mcuCard",
] as const;

type StoredHudLayoutV1 = {
  schemaVersion: 1;
  panels: Partial<Record<Project4HudPersistPanelId, { x: number; y: number }>>;
  /** Panels dismissed via header close — omitted means all visible. */
  hiddenPanelIds?: Project4HudPersistPanelId[];
};

function isFinitePair(x: unknown, y: unknown): boolean {
  return typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y);
}

function parsePanels(raw: unknown): StoredHudLayoutV1["panels"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Partial<Record<Project4HudPersistPanelId, { x: number; y: number }>> = {};
  for (const id of PROJECT4_HUD_PANEL_IDS) {
    const rec = (raw as Record<string, unknown>)[id];
    if (!rec || typeof rec !== "object" || Array.isArray(rec)) {
      continue;
    }
    const ox = (rec as Record<string, unknown>).x;
    const oy = (rec as Record<string, unknown>).y;
    if (isFinitePair(ox, oy)) {
      out[id] = { x: ox as number, y: oy as number };
    }
  }
  return out;
}

function parseHiddenPanelIds(raw: unknown): Project4HudPersistPanelId[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const allowed = new Set<string>(PROJECT4_HUD_PANEL_IDS);
  const next: Project4HudPersistPanelId[] = [];
  for (const item of raw) {
    if (typeof item === "string" && allowed.has(item)) {
      next.push(item as Project4HudPersistPanelId);
    }
  }
  return [...new Set(next)];
}

function emptyDoc(): StoredHudLayoutV1 {
  return { schemaVersion: 1, panels: {} };
}

/** Full document — use when merging several fields to avoid wiping sibling keys. */
export function readProject4HudLayoutDoc(): StoredHudLayoutV1 {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return emptyDoc();
  }
  try {
    const raw = window.localStorage.getItem(PROJECT4_HUD_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return emptyDoc();
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      (parsed as StoredHudLayoutV1).schemaVersion !== 1
    ) {
      return emptyDoc();
    }
    const o = parsed as Record<string, unknown>;
    return {
      schemaVersion: 1,
      panels: parsePanels(o.panels),
      hiddenPanelIds: parseHiddenPanelIds(o.hiddenPanelIds),
    };
  } catch {
    return emptyDoc();
  }
}

export function writeProject4HudLayoutDoc(doc: StoredHudLayoutV1): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    const payload: StoredHudLayoutV1 = {
      schemaVersion: 1,
      panels: doc.panels,
      ...(doc.hiddenPanelIds != null && doc.hiddenPanelIds.length > 0
        ? { hiddenPanelIds: doc.hiddenPanelIds }
        : {}),
    };
    window.localStorage.setItem(PROJECT4_HUD_LAYOUT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / restricted storage — ignore.
  }
}

export function notifyProject4HudPanelsChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(PROJECT4_HUD_PANELS_CHANGED_EVENT));
}

export function loadProject4HudLayoutPanels(): Partial<
  Record<Project4HudPersistPanelId, { x: number; y: number }>
> {
  return readProject4HudLayoutDoc().panels;
}

export function loadProject4HudHiddenPanelIds(): Project4HudPersistPanelId[] {
  const ids = readProject4HudLayoutDoc().hiddenPanelIds;
  return ids != null ? [...ids] : [];
}

export function persistProject4HudPanelPosition(
  id: Project4HudPersistPanelId,
  x: number,
  y: number,
): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }
  const doc = readProject4HudLayoutDoc();
  doc.panels = { ...doc.panels, [id]: { x, y } };
  writeProject4HudLayoutDoc(doc);
}

export function setProject4HudPanelHidden(id: Project4HudPersistPanelId, hidden: boolean): void {
  const doc = readProject4HudLayoutDoc();
  const set = new Set(doc.hiddenPanelIds ?? []);
  if (hidden) {
    set.add(id);
  } else {
    set.delete(id);
  }
  doc.hiddenPanelIds = [...set];
  writeProject4HudLayoutDoc(doc);
  notifyProject4HudPanelsChanged();
}

export function toggleProject4HudPanelHidden(id: Project4HudPersistPanelId): void {
  const hiddenNow = loadProject4HudHiddenPanelIds().includes(id);
  setProject4HudPanelHidden(id, !hiddenNow);
}
