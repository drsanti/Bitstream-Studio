import { useEffect, useMemo, useState } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2HostReqPayload,
  type Bitstream2HostResPayload,
  type Bitstream2MetricsPayload,
  type Bitstream2SensorSamplePayload,
} from "../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../bitstream2/domains/config/commands";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  encodeStreamMaskSetBody,
  encodeStreamRateSetBody,
} from "../../bitstream2/domains/config/sensor-config";
import { base64ToBytes, bytesToBase64 } from "../../bitstream2/util/base64";
import {
  SERIALPORT_TOPICS,
  type FirmwareLivenessPayload,
  type SerialPortStatusPayload,
} from "../../serialport-bridge/protocol";
import { useWsClientStore } from "../ws-client-store";
import { Bitstream2DevPanel } from "./Bitstream2DevPanel";

type LatestBySensor = Record<number, Bitstream2SensorSamplePayload>;

export function Bitstream2AppMain() {
  const connect = useWsClientStore((s) => s.connect);
  const isConnected = useWsClientStore((s) => s.isConnected);
  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const publish = useWsClientStore((s) => s.publish);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  const [hello, setHello] = useState<Bitstream2HelloPayload | null>(null);
  const [metrics, setMetrics] = useState<Bitstream2MetricsPayload | null>(null);
  const [latestBySensor, setLatestBySensor] = useState<LatestBySensor>({});
  const [sampleCount, setSampleCount] = useState(0);
  const [lastRes, setLastRes] = useState<Bitstream2HostResPayload | null>(null);
  const [sensorId, setSensorId] = useState(0);
  const [maskHex, setMaskHex] = useState("1f");
  const [publishMode, setPublishMode] = useState(0);
  const [samplingIntervalMs, setSamplingIntervalMs] = useState(20);
  const [deltaX100, setDeltaX100] = useState(0);
  const [minPublishIntervalMs, setMinPublishIntervalMs] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [decodedCfg, setDecodedCfg] = useState<string | null>(null);
  const [serialStatus, setSerialStatus] = useState<SerialPortStatusPayload | null>(null);
  const [firmwareLiveness, setFirmwareLiveness] = useState<FirmwareLivenessPayload | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const sensorRows = useMemo(() => {
    const rows = Object.values(latestBySensor).sort((a, b) => (a.sensorId ?? 0) - (b.sensorId ?? 0));
    return rows;
  }, [latestBySensor]);

  useEffect(() => {
    void connect();
  }, [connect]);

  useEffect(() => {
    if (!isConnected) return;
    void subscribeTopic(BITSTREAM2_TOPICS.HELLO, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.METRICS, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.EVT_SENSOR, 0, "json");
    void subscribeTopic(BITSTREAM2_TOPICS.RES, 0, "json");
    void subscribeTopic(SERIALPORT_TOPICS.STATUS, 0, "json");
    void subscribeTopic(SERIALPORT_TOPICS.FIRMWARE_LIVENESS, 0, "json");

    const id = "bitstream2-app-main";
    addMessageListener(id, (topic, payload) => {
      if (topic === SERIALPORT_TOPICS.STATUS) {
        setSerialStatus(payload as SerialPortStatusPayload);
        return;
      }
      if (topic === SERIALPORT_TOPICS.FIRMWARE_LIVENESS) {
        setFirmwareLiveness(payload as FirmwareLivenessPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.HELLO) {
        setHello(payload as Bitstream2HelloPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.METRICS) {
        setMetrics(payload as Bitstream2MetricsPayload);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
        const p = payload as Bitstream2SensorSamplePayload;
        setLatestBySensor((prev) => ({ ...prev, [p.sensorId]: p }));
        setSampleCount((c) => c + 1);
        return;
      }
      if (topic === BITSTREAM2_TOPICS.RES) {
        const res = payload as Bitstream2HostResPayload;
        setLastRes(res);
        if (!res.ok && res.error) {
          setLastError(res.error);
        } else {
          setLastError(null);
        }
        if (typeof res.bodyB64 === "string" && res.bodyB64.length > 0) {
          const decoded = decodeSensorCfgBody(base64ToBytes(res.bodyB64));
          setDecodedCfg(decoded ? JSON.stringify(decoded) : null);
        } else {
          setDecodedCfg(null);
        }
      }
    });
    return () => {
      removeMessageListener(id);
    };
  }, [addMessageListener, isConnected, removeMessageListener, subscribeTopic]);

  return (
    <div className="t3d-shell-overlay pointer-events-auto h-full w-full overflow-y-auto p-4 text-zinc-100">
      <div className="text-lg font-semibold">Bitstream vNext (BS framed)</div>
      <div className="mt-2 space-y-1 text-sm text-zinc-300">
        <div>
          WS: {isConnected ? "connected" : "disconnected"} · Samples: {sampleCount}
        </div>
        <div>
          Serial:{" "}
          {serialStatus?.isOpen
            ? `open (${serialStatus.path ?? "?"}, ${serialStatus.baudRate ?? "?"} baud)`
            : "closed"}
          {serialStatus?.error ? ` · ${serialStatus.error}` : ""}
        </div>
        <div>
          Firmware: {firmwareLiveness?.state ?? "unknown"}
          {firmwareLiveness?.reason ? ` (${firmwareLiveness.reason})` : ""}
        </div>
        {lastError ? <div className="text-amber-400">Last error: {lastError}</div> : null}
      </div>

      <Bitstream2DevPanel />

      <div className="mt-3 flex items-center gap-2">
        <button
          className="rounded-md border border-zinc-700 bg-zinc-900/40 px-3 py-1 text-sm hover:bg-zinc-900"
          onClick={() => {
            const req: Bitstream2HostReqPayload = {
              requestId: `ui-ping-${Date.now()}`,
              reqId: 0,
              cmdId: BS2_CMD.PING,
              timeoutMs: 2000,
              retryCount: 0,
            };
            void publish(BITSTREAM2_TOPICS.REQ, req, 0);
          }}
        >
          Send PING
        </button>
        <div className="text-xs text-zinc-400">Last RES: {lastRes ? (lastRes.ok ? "ok" : "fail") : "—"}</div>
      </div>

      <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900/40 p-3">
        <div className="text-sm font-medium">Control / Config</div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <label className="flex items-center gap-2">
            <span className="w-28 text-zinc-300">sensorId</span>
            <input
              className="w-24 rounded border border-zinc-700 bg-zinc-950/40 px-2 py-1"
              type="number"
              value={sensorId}
              onChange={(e) => setSensorId(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-zinc-300">mask (hex)</span>
            <input
              className="w-24 rounded border border-zinc-700 bg-zinc-950/40 px-2 py-1"
              value={maskHex}
              onChange={(e) => setMaskHex(e.target.value.trim())}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-zinc-300">publishMode</span>
            <select
              className="w-24 rounded border border-zinc-700 bg-zinc-950/40 px-2 py-1"
              value={publishMode}
              onChange={(e) => setPublishMode(Number(e.target.value))}
            >
              <option value={0}>0 periodic</option>
              <option value={1}>1 on_change</option>
              <option value={2}>2 hybrid</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-zinc-300">samplingMs</span>
            <input
              className="w-24 rounded border border-zinc-700 bg-zinc-950/40 px-2 py-1"
              type="number"
              value={samplingIntervalMs}
              onChange={(e) => setSamplingIntervalMs(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-zinc-300">deltaX100</span>
            <input
              className="w-24 rounded border border-zinc-700 bg-zinc-950/40 px-2 py-1"
              type="number"
              value={deltaX100}
              onChange={(e) => setDeltaX100(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-zinc-300">minPublishMs</span>
            <input
              className="w-24 rounded border border-zinc-700 bg-zinc-950/40 px-2 py-1"
              type="number"
              value={minPublishIntervalMs}
              onChange={(e) => setMinPublishIntervalMs(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-zinc-300">enabled</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-1 text-sm hover:bg-zinc-900"
            onClick={() => {
              const mask = parseInt(maskHex || "0", 16) & 0xff;
              const body = encodeStreamMaskSetBody(sensorId, mask);
              const req: Bitstream2HostReqPayload = {
                requestId: `ui-mask-set-${Date.now()}`,
                reqId: 0,
                cmdId: BS2_CMD.STREAM_MASK_SET,
                bodyB64: bytesToBase64(body),
                timeoutMs: 2000,
              };
              void publish(BITSTREAM2_TOPICS.REQ, req, 0);
            }}
          >
            Stream mask set
          </button>

          <button
            className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-1 text-sm hover:bg-zinc-900"
            onClick={() => {
              const body = encodeStreamRateSetBody(sensorId, samplingIntervalMs);
              const req: Bitstream2HostReqPayload = {
                requestId: `ui-rate-set-${Date.now()}`,
                reqId: 0,
                cmdId: BS2_CMD.STREAM_RATE_SET,
                bodyB64: bytesToBase64(body),
                timeoutMs: 2000,
              };
              void publish(BITSTREAM2_TOPICS.REQ, req, 0);
            }}
          >
            Stream rate set
          </button>

          <button
            className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-1 text-sm hover:bg-zinc-900"
            onClick={() => {
              const body = encodeSensorCfgGetBody(sensorId);
              const req: Bitstream2HostReqPayload = {
                requestId: `ui-cfg-get-${Date.now()}`,
                reqId: 0,
                cmdId: BS2_CMD.SENSOR_CFG_GET,
                bodyB64: bytesToBase64(body),
                timeoutMs: 2000,
              };
              void publish(BITSTREAM2_TOPICS.REQ, req, 0);
            }}
          >
            Sensor cfg get
          </button>

          <button
            className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-1 text-sm hover:bg-zinc-900"
            onClick={() => {
              const mask = parseInt(maskHex || "0", 16) & 0xff;
              const body = encodeSensorCfgBody({
                sensorId,
                enabled,
                publishMode: publishMode as 0 | 1 | 2,
                mask,
                samplingIntervalMs,
                publishIntervalMs: 0,
                deltaX100,
                minPublishIntervalMs,
              });
              const req: Bitstream2HostReqPayload = {
                requestId: `ui-cfg-set-${Date.now()}`,
                reqId: 0,
                cmdId: BS2_CMD.SENSOR_CFG_SET,
                bodyB64: bytesToBase64(body),
                timeoutMs: 2000,
              };
              void publish(BITSTREAM2_TOPICS.REQ, req, 0);
            }}
          >
            Sensor cfg set
          </button>
        </div>

        <div className="mt-2 text-xs text-zinc-400">
          Decoded cfg from last RES body: {decodedCfg ?? "—"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-md border border-zinc-700 bg-zinc-900/40 p-3">
          <div className="text-sm font-medium">HELLO</div>
          <pre className="mt-2 overflow-auto text-xs text-zinc-300">{hello ? JSON.stringify(hello, null, 2) : "—"}</pre>
        </div>

        <div className="rounded-md border border-zinc-700 bg-zinc-900/40 p-3">
          <div className="text-sm font-medium">METRICS</div>
          <pre className="mt-2 overflow-auto text-xs text-zinc-300">{metrics ? JSON.stringify(metrics, null, 2) : "—"}</pre>
        </div>

        <div className="rounded-md border border-zinc-700 bg-zinc-900/40 p-3">
          <div className="text-sm font-medium">Last REQ/RES</div>
          <pre className="mt-2 overflow-auto text-xs text-zinc-300">{lastRes ? JSON.stringify(lastRes, null, 2) : "—"}</pre>
        </div>

        <div className="rounded-md border border-zinc-700 bg-zinc-900/40 p-3">
          <div className="text-sm font-medium">Latest samples</div>
          <div className="mt-2 space-y-2">
            {sensorRows.length === 0 ? (
              <div className="text-xs text-zinc-400">—</div>
            ) : (
              sensorRows.map((row) => (
                <div key={row.sensorId} className="rounded border border-zinc-800 bg-zinc-950/40 p-2">
                  <div className="text-xs text-zinc-300">
                    sensorId={row.sensorId} mask=0x{(row.mask ?? 0).toString(16)} counter={row.counter} tMs={row.tMs}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400 break-all">values: [{row.values?.join(", ")}]</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

