/**
 * Persists NodeInspector UI preferences (tab, accordions, rotation rail) in localStorage.
 */

const PREFIX = "ternion.sensor-studio.nodeInspector.";

const KEYS = {
  activeTab: `${PREFIX}activeTab`,
  settingsJsonAccordion: `${PREFIX}settingsJsonAccordion`,
  detailsSharedDeviceAccordion: `${PREFIX}detailsSharedDeviceAccordion`,
  rotationRailByNodeId: `${PREFIX}rotationRailByNodeId.v1`,
} as const;

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

export type InspectorMainTab = "details" | "settings" | "live";

export function readStoredInspectorActiveTab(): InspectorMainTab {
  const raw = safeLocalStorageGet(KEYS.activeTab);
  if (raw === "details" || raw === "settings" || raw === "live") {
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

export const DETAILS_SHARED_DEVICE_ACCORDION_VALUE = "shared-device" as const;

export function readDetailsSharedDeviceAccordionValue(): string | undefined {
  const raw = safeLocalStorageGet(KEYS.detailsSharedDeviceAccordion);
  if (raw === DETAILS_SHARED_DEVICE_ACCORDION_VALUE) {
    return DETAILS_SHARED_DEVICE_ACCORDION_VALUE;
  }
  return undefined;
}

export function writeDetailsSharedDeviceAccordionValue(
  next: string | undefined,
): void {
  if (next === DETAILS_SHARED_DEVICE_ACCORDION_VALUE) {
    safeLocalStorageSet(KEYS.detailsSharedDeviceAccordion, next);
    return;
  }
  safeLocalStorageRemove(KEYS.detailsSharedDeviceAccordion);
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
