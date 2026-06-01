/**
 * Persists NodeInspector UI preferences (tab, accordions, rotation rail) in localStorage.
 */

const PREFIX = "ternion.sensor-studio.nodeInspector.";

const KEYS = {
  activeTab: `${PREFIX}activeTab`,
  settingsJsonAccordion: `${PREFIX}settingsJsonAccordion`,
  /** @deprecated migrated to settingsSharedDeviceCollapsed */
  detailsSharedDeviceAccordion: `${PREFIX}detailsSharedDeviceAccordion`,
  settingsSharedDeviceCollapsed: `${PREFIX}settingsSharedDeviceCollapsed.v1`,
  detailsSectionOrder: `${PREFIX}detailsSectionOrder.v1`,
  detailsSectionCollapsed: `${PREFIX}detailsSectionCollapsed.v1`,
  rotationRailByNodeId: `${PREFIX}rotationRailByNodeId.v1`,
} as const;

export type DetailsInspectorSectionId = "specs" | "ports";

export const DEFAULT_DETAILS_SECTION_ORDER: readonly DetailsInspectorSectionId[] = [
  "ports",
  "specs",
];

const DETAILS_SECTION_IDS = new Set<string>(DEFAULT_DETAILS_SECTION_ORDER);

const ROTATION_RAIL_IDS = new Set<string>([
  "model",
  "environment",
  "renderer",
  "camera",
  "orbit",
  "lights",
  "helpers",
]);

const MAX_ROTATION_RAIL_ENTRIES = 64;

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export type InspectorMainTab = "details" | "live" | "node" | "device" | "animation";

export function readStoredInspectorActiveTab(): InspectorMainTab {
  const raw = safeLocalStorageGet(KEYS.activeTab);
  if (raw === "settings") {
    return "node";
  }
  if (
    raw === "details" ||
    raw === "live" ||
    raw === "node" ||
    raw === "device" ||
    raw === "animation"
  ) {
    return raw;
  }
  return "details";
}

export function writeStoredInspectorActiveTab(tab: InspectorMainTab): void {
  safeLocalStorageSet(KEYS.activeTab, tab);
}

/** Accordion item value when the JSON config section is expanded (single-type accordion). */
export const SETTINGS_JSON_ACCORDION_VALUE = "default-config-json" as const;

export function readSettingsJsonAccordionValue(): string | undefined {
  const raw = safeLocalStorageGet(KEYS.settingsJsonAccordion);
  if (raw === SETTINGS_JSON_ACCORDION_VALUE) {
    return SETTINGS_JSON_ACCORDION_VALUE;
  }
  return undefined;
}

export function writeSettingsJsonAccordionValue(
  next: string | undefined,
): void {
  if (next === SETTINGS_JSON_ACCORDION_VALUE) {
    safeLocalStorageSet(KEYS.settingsJsonAccordion, next);
    return;
  }
  safeLocalStorageRemove(KEYS.settingsJsonAccordion);
}

const LEGACY_DETAILS_SHARED_DEVICE_ACCORDION_VALUE = "shared-device" as const;

function readLegacyDetailsSharedDeviceExpanded(): boolean | undefined {
  const raw = safeLocalStorageGet(KEYS.detailsSharedDeviceAccordion);
  if (raw === LEGACY_DETAILS_SHARED_DEVICE_ACCORDION_VALUE) {
    return true;
  }
  if (raw != null && raw.length > 0) {
    return false;
  }
  return undefined;
}

function readLegacyDetailsSharedDeviceCollapsed(): boolean | undefined {
  const raw = safeLocalStorageGet(KEYS.detailsSectionCollapsed);
  if (raw == null || raw.length === 0) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    const value = (parsed as Record<string, unknown>)["shared-device"];
    return typeof value === "boolean" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** @deprecated Device tab is always expanded; kept for legacy localStorage migration. */
export function readSettingsSharedDeviceCollapsed(): boolean {
  const raw = safeLocalStorageGet(KEYS.settingsSharedDeviceCollapsed);
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  const legacyExpanded = readLegacyDetailsSharedDeviceExpanded();
  if (legacyExpanded != null) {
    return !legacyExpanded;
  }
  const legacyCollapsed = readLegacyDetailsSharedDeviceCollapsed();
  if (legacyCollapsed != null) {
    return legacyCollapsed;
  }
  return false;
}

export function writeSettingsSharedDeviceCollapsed(collapsed: boolean): void {
  safeLocalStorageSet(KEYS.settingsSharedDeviceCollapsed, collapsed ? "true" : "false");
}

function isDetailsSectionId(value: string): value is DetailsInspectorSectionId {
  return DETAILS_SECTION_IDS.has(value) || value === "about" || value === "shared-device";
}

function stripLegacyDetailsSectionIds(
  order: readonly DetailsInspectorSectionId[],
): DetailsInspectorSectionId[] {
  return order.filter((id) => id !== "shared-device");
}

function detailsSectionOrderWithSpecsLast(
  order: readonly DetailsInspectorSectionId[],
): DetailsInspectorSectionId[] {
  if (!order.includes("specs")) {
    return [...order];
  }
  return [...order.filter((id) => id !== "specs"), "specs"];
}

export function readDetailsSectionOrder(): DetailsInspectorSectionId[] {
  const raw = safeLocalStorageGet(KEYS.detailsSectionOrder);
  if (raw == null || raw.length === 0) {
    return [...DEFAULT_DETAILS_SECTION_ORDER];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_DETAILS_SECTION_ORDER];
    }
    const out: DetailsInspectorSectionId[] = [];
    for (const item of parsed) {
      if (typeof item === "string") {
        const id =
          item === "about"
            ? "specs"
            : item === "shared-device"
              ? null
              : item;
        if (
          id != null &&
          isDetailsSectionId(id) &&
          id !== "shared-device" &&
          !out.includes(id)
        ) {
          out.push(id);
        }
      }
    }
    for (const id of DEFAULT_DETAILS_SECTION_ORDER) {
      if (!out.includes(id)) {
        out.push(id);
      }
    }
    return detailsSectionOrderWithSpecsLast(stripLegacyDetailsSectionIds(out));
  } catch {
    return [...DEFAULT_DETAILS_SECTION_ORDER];
  }
}

export function writeDetailsSectionOrder(order: readonly DetailsInspectorSectionId[]): void {
  safeLocalStorageSet(KEYS.detailsSectionOrder, JSON.stringify([...order]));
}

export function mergeDetailsSectionOrder(
  stored: readonly DetailsInspectorSectionId[],
  visible: readonly DetailsInspectorSectionId[],
): DetailsInspectorSectionId[] {
  const visibleSet = new Set(visible);
  const ordered = stored.filter((id) => visibleSet.has(id));
  for (const id of visible) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  const hiddenTail = stored.filter((id) => !visibleSet.has(id));
  return [...ordered, ...hiddenTail];
}

export function readDetailsSectionCollapsed(): Record<DetailsInspectorSectionId, boolean> {
  const defaults: Record<DetailsInspectorSectionId, boolean> = {
    specs: true,
    ports: false,
  };
  const raw = safeLocalStorageGet(KEYS.detailsSectionCollapsed);
  if (raw == null || raw.length === 0) {
    return defaults;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaults;
    }
    const legacy = parsed as Record<string, unknown>;
    const out = { ...defaults };
    for (const id of DEFAULT_DETAILS_SECTION_ORDER) {
      const value = legacy[id];
      if (typeof value === "boolean") {
        out[id] = value;
      }
    }
    if (typeof legacy.about === "boolean" && legacy.specs === undefined) {
      out.specs = legacy.about;
    }
    return out;
  } catch {
    return defaults;
  }
}

export function writeDetailsSectionCollapsed(
  next: Record<DetailsInspectorSectionId, boolean>,
): void {
  safeLocalStorageSet(KEYS.detailsSectionCollapsed, JSON.stringify(next));
}

export type RotationInspectorRailPanelId =
  | "model"
  | "environment"
  | "renderer"
  | "camera"
  | "orbit"
  | "lights"
  | "helpers";

function isRotationRailId(s: string): s is RotationInspectorRailPanelId {
  return ROTATION_RAIL_IDS.has(s);
}

export function readRotationRailsMap(): Map<string, RotationInspectorRailPanelId> {
  const raw = safeLocalStorageGet(KEYS.rotationRailByNodeId);
  if (raw == null || raw.length === 0) {
    return new Map();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Map();
    }
    const out = new Map<string, RotationInspectorRailPanelId>();
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k !== "string" || k.length === 0) {
        continue;
      }
      if (typeof v !== "string" || !isRotationRailId(v)) {
        continue;
      }
      out.set(k, v);
    }
    return out;
  } catch {
    return new Map();
  }
}

export function writeRotationRailsMap(
  map: Map<string, RotationInspectorRailPanelId>,
): void {
  const entries = Array.from(map.entries());
  const trimmed =
    entries.length > MAX_ROTATION_RAIL_ENTRIES
      ? entries.slice(entries.length - MAX_ROTATION_RAIL_ENTRIES)
      : entries;
  const obj: Record<string, string> = {};
  for (const [k, v] of trimmed) {
    obj[k] = v;
  }
  safeLocalStorageSet(KEYS.rotationRailByNodeId, JSON.stringify(obj));
}
