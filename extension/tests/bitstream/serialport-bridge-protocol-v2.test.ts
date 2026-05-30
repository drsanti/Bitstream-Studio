import assert from "node:assert/strict";
import test from "node:test";
import { SERIALPORT_TOPICS, type BridgeRuntimeSnapshotPayload } from "../../src/serialport-bridge/protocol";

test("serialport protocol v2 exposes runtime topics", () => {
  assert.equal(SERIALPORT_TOPICS.RUNTIME_SNAPSHOT, "serialport/runtime-snapshot");
  assert.equal(SERIALPORT_TOPICS.RUNTIME_OPERATION, "serialport/runtime-operation");
  assert.equal(
    SERIALPORT_TOPICS.RUNTIME_HANDSHAKE_REPORT,
    "serialport/runtime-handshake-report",
  );
  assert.equal(SERIALPORT_TOPICS.SENSOR_CFG_UPDATED, "serialport/sensor-cfg-updated");
  assert.equal(
    SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED,
    "serialport/bmi270-stream-mode-updated",
  );
});

test("runtime snapshot payload keeps canonical backend state fields", () => {
  const snapshot: BridgeRuntimeSnapshotPayload = {
    timestamp: Date.now(),
    leaseId: "lease-1",
    leaseOwner: "unit-test",
    connectionState: "connected",
    handshakeState: "unknown",
    handshakeLastError: null,
    serialStatus: {
      isOpen: true,
      path: "COM3",
      baudRate: 921600,
      bytesRead: 10,
      bytesWritten: 12,
      leaseId: "lease-1",
      leaseOwner: "unit-test",
      updatedAt: Date.now(),
    },
    ports: [{ path: "COM3" }],
    recentOperations: [{ type: "bridge-connected", message: "ok", timestamp: Date.now() }],
  };

  assert.equal(snapshot.connectionState, "connected");
  assert.equal(snapshot.serialStatus.path, "COM3");
  assert.equal(snapshot.recentOperations.length, 1);
});

test("runtime snapshot may embed sensorConfigs for broker cold sync", () => {
  const snapshot: BridgeRuntimeSnapshotPayload = {
    timestamp: 1,
    leaseId: null,
    leaseOwner: null,
    connectionState: "connected",
    handshakeState: "passed",
    handshakeLastError: null,
    serialStatus: {
      isOpen: true,
      path: "COM1",
      baudRate: 921600,
      bytesRead: 0,
      bytesWritten: 0,
    },
    ports: [],
    recentOperations: [],
    sensorConfigs: {
      1: {
        enabled: true,
        publishMode: 2,
        samplingIntervalMs: 200,
        deltaX100: 0,
        minPublishIntervalMs: 0,
        updatedAtMs: 2,
      },
    },
  };
  assert.equal(snapshot.sensorConfigs?.[1]?.publishMode, 2);
});
