import assert from "node:assert/strict";
import test from "node:test";
import {
  isBs2UartFirmwareLink,
  isLinkHandshakeSatisfied,
  isSimulatorTelemetryBackend,
  isTelemetryDecodePipelineActive,
  isTelemetryTransportReady,
  reconcileBs2HandshakePassedFromStores,
  shouldAcceptBs2Hello,
  shouldIngestTelemetry,
  shouldPreserveLiveTelemetryOnSessionDrop,
  shouldResetLiveTelemetryOnSessionClose,
  shouldUseBs2UartAutoOrchestrate,
  telemetryLinkStatusLabel,
  usesBs2ControlPlane,
} from "../../src/webview/bitstream-app/utils/bitstreamTelemetryTransport";
import { useBitstreamConnectionStore } from "../../src/webview/bitstream-app/state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../../src/webview/bitstream-app/state/bitstreamLive.store";
import { useBitstreamConfigStore } from "../../src/webview/bitstream-app/state/bitstreamConfig.store";
import { useBitstreamTelemetrySourceStore } from "../../src/webview/bitstream-app/state/bitstreamTelemetrySource.store";

test("isTelemetryTransportReady: simulator uses WS only", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "simulator", loopbackAvailable: true });
  assert.equal(
    isTelemetryTransportReady({
      connected: true,
      transportState: "connected",
      serialBridgeStatus: { isOpen: false, path: "", baudRate: 921600 },
    }),
    true,
  );
  assert.equal(
    isTelemetryTransportReady({
      connected: false,
      transportState: "disconnected",
      serialBridgeStatus: null,
    }),
    false,
  );
});

test("isTelemetryTransportReady: uart disabled in webview until transport redesign", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: true });
  assert.equal(
    isTelemetryTransportReady({
      connected: false,
      transportState: "disconnected",
      serialBridgeStatus: { isOpen: true, path: "/dev/ttyUSB0", baudRate: 921600 },
    }),
    false,
  );
});

test("isTelemetryDecodePipelineActive requires handshake passed", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "simulator", loopbackAvailable: true });
  const conn = {
    connected: true,
    transportState: "connected" as const,
    serialBridgeStatus: null,
  };
  assert.equal(isTelemetryDecodePipelineActive(conn, "unknown"), false);
  assert.equal(isTelemetryDecodePipelineActive(conn, "passed"), true);
});

test("telemetryLinkStatusLabel distinguishes simulator vs uart", () => {
  assert.match(
    telemetryLinkStatusLabel({
      transportReady: false,
      handshakeState: "unknown",
      simulatorMode: true,
    }) ?? "",
    /simulator/i,
  );
  assert.equal(
    telemetryLinkStatusLabel({
      transportReady: false,
      handshakeState: "unknown",
      simulatorMode: false,
    }),
    "Serial closed",
  );
});

test("isSimulatorTelemetryBackend respects explicit simulator choice without loopback", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "simulator", loopbackAvailable: false });
  assert.equal(isSimulatorTelemetryBackend(), true);
});

test("shouldIngestTelemetry: uart ingests when COM is open", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: true });
  const openSerial = {
    connected: true,
    transportState: "connected" as const,
    serialBridgeStatus: { isOpen: true, path: "/dev/ttyUSB0", baudRate: 921600 },
  };
  assert.equal(shouldIngestTelemetry(openSerial), true);
  assert.equal(
    shouldIngestTelemetry({
      connected: false,
      transportState: "disconnected",
      serialBridgeStatus: { isOpen: false, path: "", baudRate: 921600 },
    }),
    false,
  );
});

test("shouldIngestTelemetry: simulator without COM ingests external sim stream", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "simulator", loopbackAvailable: true });
  assert.equal(
    shouldIngestTelemetry({
      connected: true,
      transportState: "connected",
      serialBridgeStatus: { isOpen: false, path: "", baudRate: 921600 },
    }),
    true,
  );
});

test("shouldIngestTelemetry: simulator always ingests", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "simulator", loopbackAvailable: true });
  assert.equal(
    shouldIngestTelemetry({
      connected: true,
      transportState: "connected",
      serialBridgeStatus: null,
    }),
    true,
  );
});

test("shouldPreserveLiveTelemetryOnSessionDrop: uart with open COM (legacy helper)", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: false });
  const conn = {
    connected: true,
    transportState: "connected" as const,
    serialBridgeStatus: { isOpen: true, path: "/dev/ttyUSB0", baudRate: 921600 },
  };
  assert.equal(shouldPreserveLiveTelemetryOnSessionDrop(conn), true);
  assert.equal(shouldResetLiveTelemetryOnSessionClose(conn), false);
});

test("isBs2UartFirmwareLink is true only for uart effective backend", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: false });
  assert.equal(isBs2UartFirmwareLink(), true);
  useBitstreamTelemetrySourceStore.setState({ backend: "simulator", loopbackAvailable: false });
  assert.equal(isBs2UartFirmwareLink(), false);
});

test("isTelemetryDecodePipelineActive: uart decode inactive until redesign", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: false });
  const conn = {
    connected: false,
    transportState: "disconnected" as const,
    serialBridgeStatus: { isOpen: true, path: "/dev/ttyUSB0", baudRate: 921600 },
  };
  assert.equal(isTelemetryDecodePipelineActive(conn, "unknown"), true);
});

test("shouldAcceptBs2Hello: simulator always; uart when COM open", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "simulator", loopbackAvailable: true });
  assert.equal(
    shouldAcceptBs2Hello({
      connected: false,
      transportState: "disconnected",
      serialBridgeStatus: null,
    }),
    true,
  );
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: false });
  assert.equal(
    shouldAcceptBs2Hello({
      connected: false,
      transportState: "disconnected",
      serialBridgeStatus: { isOpen: false, path: "", baudRate: 921600 },
    }),
    false,
  );
  assert.equal(
    shouldAcceptBs2Hello({
      connected: true,
      transportState: "connected",
      serialBridgeStatus: { isOpen: true, path: "COM3", baudRate: 921600 },
    }),
    true,
  );
});

test("isLinkHandshakeSatisfied: BS2 HELLO + simulator", () => {
  useBitstreamTelemetrySourceStore.setState({
    backend: "simulator",
    loopbackAvailable: true,
    bs2Hello: { version: 2, caps: 0x7f, mtuSensor: 512, mtuCtrl: 256, atMs: Date.now() },
  });
  useBitstreamLiveStore.setState({ handshakeState: "unknown" });
  assert.equal(isLinkHandshakeSatisfied("unknown"), true);
  assert.equal(reconcileBs2HandshakePassedFromStores(), true);
  assert.equal(useBitstreamLiveStore.getState().handshakeState, "passed");
});

test("shouldUseBs2UartAutoOrchestrate disabled until webview UART redesign", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: false });
  useBitstreamConfigStore.setState({ bs2AutoConnectOnStartup: true });
  assert.equal(shouldUseBs2UartAutoOrchestrate("uart"), false);
  assert.equal(shouldUseBs2UartAutoOrchestrate("simulator"), false);
});

test("usesBs2ControlPlane is true for uart and simulator effective backends", () => {
  assert.equal(usesBs2ControlPlane("uart"), true);
  assert.equal(usesBs2ControlPlane("simulator"), true);
});

test("shouldResetLiveTelemetryOnSessionClose: user disconnect always clears", () => {
  useBitstreamTelemetrySourceStore.setState({ backend: "uart", loopbackAvailable: false });
  const conn = {
    connected: true,
    transportState: "connected" as const,
    serialBridgeStatus: { isOpen: true, path: "/dev/ttyUSB0", baudRate: 921600 },
  };
  assert.equal(shouldResetLiveTelemetryOnSessionClose(conn, { userInitiated: true }), true);
  assert.equal(
    shouldResetLiveTelemetryOnSessionClose(conn, { preserveLiveTelemetry: true }),
    false,
  );
});
