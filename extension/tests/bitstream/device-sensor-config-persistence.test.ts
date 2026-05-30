import assert from "node:assert/strict";
import test from "node:test";
import { mergeBridgeRuntimeSensorConfigsCache } from "../../src/serialport-bridge/runtimeSnapshotSensorConfigsCache";
import {
  DEVICE_SENSOR_CONFIG_STORAGE_KEY,
  mergePersistedDeviceSensorRowsIntoSeeds,
  readPersistedDeviceSensorConfigRows,
  writePersistedDeviceSensorConfigRows,
} from "../../src/webview/bitstream-app/state/deviceSensorConfigLocalStorage";

test("mergeBridgeRuntimeSensorConfigsCache ignores rows without positive updatedAtMs", () => {
  const a = mergeBridgeRuntimeSensorConfigsCache(null, {
    1: {
      enabled: true,
      publishMode: 2,
      samplingIntervalMs: 100,
      deltaX100: 0,
      minPublishIntervalMs: 0,
    },
  });
  assert.equal(a, null);
});

test("mergeBridgeRuntimeSensorConfigsCache applies verified rows and prefers newer updatedAtMs", () => {
  let c = mergeBridgeRuntimeSensorConfigsCache(null, {
    10: {
      enabled: true,
      publishMode: 2,
      samplingIntervalMs: 250,
      deltaX100: 0,
      minPublishIntervalMs: 0,
      updatedAtMs: 100,
    },
  });
  assert.ok(c);
  assert.equal(c![10].samplingIntervalMs, 250);

  c = mergeBridgeRuntimeSensorConfigsCache(c, {
    10: {
      enabled: false,
      publishMode: 1,
      samplingIntervalMs: 500,
      deltaX100: 1,
      minPublishIntervalMs: 10,
      updatedAtMs: 50,
    },
  });
  assert.equal(c![10].samplingIntervalMs, 250, "older updatedAtMs must not overwrite");

  c = mergeBridgeRuntimeSensorConfigsCache(c, {
    10: {
      enabled: false,
      publishMode: 1,
      samplingIntervalMs: 500,
      deltaX100: 1,
      minPublishIntervalMs: 10,
      updatedAtMs: 200,
    },
  });
  assert.equal(c![10].samplingIntervalMs, 500);
  assert.equal(c![10].enabled, false);
});

test("mergePersistedDeviceSensorRowsIntoSeeds never applies stale persisted over newer seed ts", () => {
  const seeds = {
    1: {
      sourceId: 1,
      enabled: true,
      publishMode: 2,
      samplingIntervalMs: 50,
      deltaX100: 0,
      minPublishIntervalMs: 0,
      updatedAtMs: 0,
    },
  };
  const merged = mergePersistedDeviceSensorRowsIntoSeeds(seeds, {
    1: {
      sourceId: 1,
      enabled: false,
      publishMode: 1,
      samplingIntervalMs: 999,
      deltaX100: 0,
      minPublishIntervalMs: 0,
      updatedAtMs: 10,
    },
  });
  assert.equal(merged[1]!.samplingIntervalMs, 999);

  const keepNewer = mergePersistedDeviceSensorRowsIntoSeeds(
    {
      1: {
        sourceId: 1,
        enabled: true,
        publishMode: 2,
        samplingIntervalMs: 50,
        deltaX100: 0,
        minPublishIntervalMs: 0,
        updatedAtMs: 100,
      },
    },
    {
      1: {
        sourceId: 1,
        enabled: false,
        publishMode: 1,
        samplingIntervalMs: 999,
        deltaX100: 0,
        minPublishIntervalMs: 0,
        updatedAtMs: 50,
      },
    },
  );
  assert.equal(keepNewer[1]!.updatedAtMs, 100);
  assert.equal(keepNewer[1]!.samplingIntervalMs, 50);
});

test("deviceSensorConfig localStorage round-trip via global window mock", () => {
  const store: Record<string, string> = {};
  const g = globalThis as typeof globalThis & {
    window?: { localStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> };
  };
  const prev = g.window;
  g.window = {
    localStorage: {
      getItem: (k: string) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k]! : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    },
  };

  try {
    writePersistedDeviceSensorConfigRows({
      2: {
        sourceId: 2,
        enabled: true,
        publishMode: 2,
        samplingIntervalMs: 120,
        deltaX100: 0,
        minPublishIntervalMs: 0,
        updatedAtMs: 42,
      },
    });
    const read = readPersistedDeviceSensorConfigRows();
    assert.ok(read);
    assert.equal(read![2].samplingIntervalMs, 120);
    assert.equal(read![2].updatedAtMs, 42);
    assert.ok(store[DEVICE_SENSOR_CONFIG_STORAGE_KEY]);
  } finally {
    if (prev === undefined) {
      delete g.window;
    } else {
      g.window = prev;
    }
  }
});
