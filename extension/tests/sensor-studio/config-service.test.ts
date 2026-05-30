import assert from "node:assert/strict";
import test from "node:test";

import { NODE_CATALOG_DEFAULTS } from "../../src/webview/sensor-studio/config/node-catalog.config";
import { configService } from "../../src/webview/sensor-studio/core/config/config-service";
import { clearSafeModeWarnings } from "../../src/webview/sensor-studio/core/config/config-safe-mode";
import { migrateConfigToVersion } from "../../src/webview/sensor-studio/persistence/config.migrations";
import {
  clearPersistedConfig,
  readPersistedConfig,
  writePersistedConfig,
} from "../../src/webview/sensor-studio/persistence/config.repository";

type StorageMap = Map<string, string>;

function installWindowLocalStorageMock() {
  const store: StorageMap = new Map();
  const localStorage = {
    getItem: (key: string): string | null => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: { localStorage },
    writable: true,
    configurable: true,
  });
  return store;
}

test("config.repository writes, reads, and clears domain payload", () => {
  installWindowLocalStorageMock();

  writePersistedConfig("runtimeDefaults", { configVersion: 1, payload: { tickRateHz: 10 } });
  const stored = readPersistedConfig("runtimeDefaults") as { payload?: { tickRateHz?: number } };
  assert.equal(stored.payload?.tickRateHz, 10);

  clearPersistedConfig("runtimeDefaults");
  const removed = readPersistedConfig("runtimeDefaults");
  assert.equal(removed, null);
});

test("migrateConfigToVersion keeps payload when no migration exists", () => {
  const input = {
    configVersion: 1,
    updatedAt: "2026-05-04T00:00:00.000Z",
    payload: { tickRateHz: 30 },
  };
  const out = migrateConfigToVersion("runtimeDefaults", input, 2) as { configVersion?: number };
  assert.equal(out.configVersion, 1);
});

test("configService subscribe/update/reset works for featureFlags", () => {
  const calls: string[] = [];
  const unsubscribe = configService.subscribe("featureFlags", () => {
    calls.push("featureFlags");
  });

  const before = configService.getFeatureFlags().payload.enableRuntimeTraceOverlay;
  configService.updateDomain("featureFlags", (prev) => ({
    ...prev,
    payload: {
      ...prev.payload,
      enableRuntimeTraceOverlay: !before,
    },
    updatedAt: new Date().toISOString(),
  }));

  const afterUpdate = configService.getFeatureFlags().payload.enableRuntimeTraceOverlay;
  assert.equal(afterUpdate, !before);
  assert.equal(calls.length, 1);

  configService.resetToDefaults("featureFlags");
  const afterReset = configService.getFeatureFlags().payload.enableRuntimeTraceOverlay;
  assert.equal(afterReset, false);
  assert.equal(calls.length, 2);

  unsubscribe();
});

test("configService reloadFromPersistence falls back and warns for invalid payload", () => {
  installWindowLocalStorageMock();
  clearSafeModeWarnings();

  const warns: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message?: unknown, ...optionalParams: unknown[]) => {
    const joined = [message, ...optionalParams].map((v) => String(v)).join(" ");
    warns.push(joined);
  };

  try {
    writePersistedConfig("runtimeDefaults", {
      configVersion: 1,
      updatedAt: "2026-05-04T00:00:00.000Z",
      payload: {
        tickRateHz: "bad-type",
      },
    });

    configService.reloadFromPersistence("runtimeDefaults");
    const runtimeDefaults = configService.getRuntimeDefaults().payload;
    assert.equal(runtimeDefaults.tickRateHz, 30);
    assert.ok(
      warns.some((line) =>
        line.includes("[ConfigSafeMode] domain=runtimeDefaults reason=invalid-schema"),
      ),
    );
  } finally {
    console.warn = originalWarn;
  }
});

test("configService reloadFromPersistence nodeCatalog falls back when sensor-input sourceKey is invalid", () => {
  installWindowLocalStorageMock();
  clearSafeModeWarnings();

  const warns: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message?: unknown, ...optionalParams: unknown[]) => {
    warns.push([message, ...optionalParams].map((v) => String(v)).join(" "));
  };

  try {
    const bad = JSON.parse(JSON.stringify(NODE_CATALOG_DEFAULTS)) as typeof NODE_CATALOG_DEFAULTS;
    const sensor = bad.payload.nodes.find((n) => n.id === "sensor-input");
    if (sensor == null) {
      throw new Error("expected sensor-input in catalog");
    }
    sensor.defaultConfig.sourceKey = "bmm350.mag.not_valid";
    writePersistedConfig("nodeCatalog", bad);

    configService.reloadFromPersistence("nodeCatalog");
    const sourceKey = configService
      .getNodeCatalog()
      .payload.nodes.find((n) => n.id === "sensor-input")?.defaultConfig.sourceKey;
    assert.equal(sourceKey, "bmi270.accel.x");
    assert.ok(
      warns.some((line) => line.includes("[ConfigSafeMode] domain=nodeCatalog reason=invalid-schema")),
    );
  } finally {
    console.warn = originalWarn;
    configService.resetToDefaults("nodeCatalog");
  }
});
