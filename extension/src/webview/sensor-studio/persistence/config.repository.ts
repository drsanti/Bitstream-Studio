import type { ConfigDomain } from "../core/config/config-types";

const STORAGE_KEYS: Record<ConfigDomain, string> = {
  theme: "sensor-studio:config:theme",
  dataTypeColors: "sensor-studio:config:data-type-colors",
  nodeCatalog: "sensor-studio:config:node-catalog",
  runtimeDefaults: "sensor-studio:config:runtime-defaults",
  featureFlags: "sensor-studio:config:feature-flags",
};

export function readPersistedConfig(domain: ConfigDomain): unknown | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS[domain]);
  if (raw == null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writePersistedConfig(domain: ConfigDomain, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS[domain], JSON.stringify(value));
}

export function clearPersistedConfig(domain: ConfigDomain): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS[domain]);
}
