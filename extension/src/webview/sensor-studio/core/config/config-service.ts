import { DATA_TYPE_COLORS_DEFAULTS } from "../../config/data-type-colors.config";
import { FEATURE_FLAGS_DEFAULTS } from "../../config/feature-flags.config";
import { NODE_CATALOG_DEFAULTS } from "../../config/node-catalog.config";
import { RUNTIME_DEFAULTS_CONFIG } from "../../config/runtime-defaults.config";
import { THEME_CONFIG_DEFAULTS } from "../../config/theme.config";
import { migrateConfigToVersion } from "../../persistence/config.migrations";
import {
  clearPersistedConfig,
  readPersistedConfig,
  writePersistedConfig,
} from "../../persistence/config.repository";
import { dataTypeColorsSchema } from "../schema/config/data-type-colors.schema";
import { featureFlagsSchema } from "../schema/config/feature-flags.schema";
import { nodeCatalogSchema } from "../schema/config/node-catalog.schema";
import { runtimeDefaultsSchema } from "../schema/config/runtime-defaults.schema";
import { themeConfigSchema } from "../schema/config/theme.config.schema";
import { logConfigSafeMode } from "./config-safe-mode";
import type {
  ConfigDomain,
  DataTypeColorsConfig,
  FeatureFlagsConfig,
  NodeCatalogConfig,
  RuntimeDefaultsConfig,
  ThemeConfig,
} from "./config-types";

type Listener = () => void;

type ConfigState = {
  theme: ThemeConfig;
  dataTypeColors: DataTypeColorsConfig;
  nodeCatalog: NodeCatalogConfig;
  runtimeDefaults: RuntimeDefaultsConfig;
  featureFlags: FeatureFlagsConfig;
};

const CURRENT_VERSION = 1;

const state: ConfigState = {
  theme: resolveDomain("theme"),
  dataTypeColors: resolveDomain("dataTypeColors"),
  nodeCatalog: resolveDomain("nodeCatalog"),
  runtimeDefaults: resolveDomain("runtimeDefaults"),
  featureFlags: resolveDomain("featureFlags"),
};

const listeners: Record<ConfigDomain, Set<Listener>> = {
  theme: new Set(),
  dataTypeColors: new Set(),
  nodeCatalog: new Set(),
  runtimeDefaults: new Set(),
  featureFlags: new Set(),
};

function emit(domain: ConfigDomain): void {
  for (const listener of listeners[domain]) {
    listener();
  }
}

function resolveDomain(domain: "theme"): ThemeConfig;
function resolveDomain(domain: "dataTypeColors"): DataTypeColorsConfig;
function resolveDomain(domain: "nodeCatalog"): NodeCatalogConfig;
function resolveDomain(domain: "runtimeDefaults"): RuntimeDefaultsConfig;
function resolveDomain(domain: "featureFlags"): FeatureFlagsConfig;
function resolveDomain(domain: ConfigDomain): ConfigState[ConfigDomain] {
  const persisted = readPersistedConfig(domain);
  const migrated =
    persisted == null
      ? null
      : migrateConfigToVersion(domain, persisted, CURRENT_VERSION);

  try {
    if (domain === "theme" && migrated != null) {
      return themeConfigSchema.parse(migrated);
    }
    if (domain === "dataTypeColors" && migrated != null) {
      return dataTypeColorsSchema.parse(migrated);
    }
    if (domain === "nodeCatalog" && migrated != null) {
      return nodeCatalogSchema.parse(migrated);
    }
    if (domain === "runtimeDefaults" && migrated != null) {
      return runtimeDefaultsSchema.parse(migrated);
    }
    if (domain === "featureFlags" && migrated != null) {
      return featureFlagsSchema.parse(migrated);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "parse-failed";
    logConfigSafeMode(domain, "invalid-schema", message);
  }

  if (domain === "theme") {
    return THEME_CONFIG_DEFAULTS;
  }
  if (domain === "dataTypeColors") {
    return DATA_TYPE_COLORS_DEFAULTS;
  }
  if (domain === "nodeCatalog") {
    return NODE_CATALOG_DEFAULTS;
  }
  if (domain === "runtimeDefaults") {
    return RUNTIME_DEFAULTS_CONFIG;
  }
  return FEATURE_FLAGS_DEFAULTS;
}

function setDomain<K extends ConfigDomain>(
  domain: K,
  nextValue: ConfigState[K],
): void {
  state[domain] = nextValue;
  writePersistedConfig(domain, nextValue);
  emit(domain);
}

function rehydrateDomain<K extends ConfigDomain>(domain: K): void {
  state[domain] = resolveDomain(domain);
  emit(domain);
}

export const configService = {
  getTheme(): ThemeConfig {
    return state.theme;
  },
  getDataTypeColors(): DataTypeColorsConfig {
    return state.dataTypeColors;
  },
  getNodeCatalog(): NodeCatalogConfig {
    return state.nodeCatalog;
  },
  getRuntimeDefaults(): RuntimeDefaultsConfig {
    return state.runtimeDefaults;
  },
  getFeatureFlags(): FeatureFlagsConfig {
    return state.featureFlags;
  },
  updateDomain<K extends ConfigDomain>(
    domain: K,
    updater: (prev: ConfigState[K]) => ConfigState[K],
  ): void {
    const next = updater(state[domain]);
    setDomain(domain, next);
  },
  subscribe(domain: ConfigDomain, listener: Listener): () => void {
    listeners[domain].add(listener);
    return () => {
      listeners[domain].delete(listener);
    };
  },
  resetToDefaults(domain?: ConfigDomain): void {
    if (domain == null) {
      const allDomains: ConfigDomain[] = [
        "theme",
        "dataTypeColors",
        "nodeCatalog",
        "runtimeDefaults",
        "featureFlags",
      ];
      for (const d of allDomains) {
        clearPersistedConfig(d);
        setDomain(d, resolveDomain(d));
      }
      return;
    }
    clearPersistedConfig(domain);
    setDomain(domain, resolveDomain(domain));
  },
  reloadFromPersistence(domain?: ConfigDomain): void {
    if (domain == null) {
      const allDomains: ConfigDomain[] = [
        "theme",
        "dataTypeColors",
        "nodeCatalog",
        "runtimeDefaults",
        "featureFlags",
      ];
      for (const d of allDomains) {
        rehydrateDomain(d);
      }
      return;
    }
    rehydrateDomain(domain);
  },
};
