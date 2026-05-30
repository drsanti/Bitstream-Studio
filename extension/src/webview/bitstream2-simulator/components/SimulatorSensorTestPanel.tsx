import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bug, Gauge, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { BITSTREAM2_TOPICS, type Bitstream2DevSimStatePayload, type Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../../../bitstream2/domains/config/sensor-config";
import { BS2_SENSOR_ID } from "../../../bitstream2/domains/sensors/sensor-ids";
import {
  CFG_ACCESS_POST_SET_SETTLE_MS,
  CFG_ACCESS_SET_TIMEOUT_MS,
} from "../../../bitstream2/domains/config/sensor-cfg-access-policy";
import { bytesToBase64 } from "../../../bitstream2/util/base64";
import { useBitstream2ReqAwait } from "../../bitstream-app/hooks/useBitstream2ReqAwait";
import {
  checkPayloadMaskIssues,
  defaultSensorTestCfg,
  diffCfgMessages,
  formatSensorTestCfg,
  quietBusCfg,
  rateFromWindow,
  SENSOR_TEST_IDS,
  SENSOR_TEST_LABEL,
  SENSOR_TEST_PRESETS,
  sleep,
  type SensorTestLastSample,
  type SensorTestUiStatus,
} from "../../shared/sensorTestShared";
import { useWsClientStore } from "../../ws-client-store";
import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNSectionContainer,
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
} from "../../ui/TRN";

type Props = {
  isConnected: boolean;
  loopbackEnabled: boolean;
  simState: Bitstream2DevSimStatePayload | null;
};

export function SimulatorSensorTestPanel(props: Props) {
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);
  const { sendReqAwait } = useBitstream2ReqAwait();

  const [activeSensorId, setActiveSensorId] = useState<number>(BS2_SENSOR_ID.BMM350);
  const [status, setStatus] = useState<SensorTestUiStatus>({ tone: "idle", message: "Ready." });
  const [roundtripResult, setRoundtripResult] = useState<string[]>([]);
  const [windowMs, setWindowMs] = useState<number>(3000);
  const [measuredHzBySensorId, setMeasuredHzBySensorId] = useState<Record<number, number>>({});
  const [lastSampleBySensorId, setLastSampleBySensorId] = useState<
    Record<number, SensorTestLastSample>
  >({});

  const evtTimestampsRef = useRef<Record<number, number[]>>({
    [BS2_SENSOR_ID.BMI270]: [],
    [BS2_SENSOR_ID.BMM350]: [],
    [BS2_SENSOR_ID.SHT40]: [],
    [BS2_SENSOR_ID.DPS368]: [],
  });

  const cfgBySensorId = useMemo(() => {
    const out: Partial<Record<number, Bs2SensorConfig>> = {};
    for (const row of props.simState?.configs ?? []) {
      out[row.sensorId] = normalizeSensorCfg({
        publishIntervalMs: 0,
        ...row,
      } as Bs2SensorConfig);
    }
    return out;
  }, [props.simState?.configs]);

  const setStatusOk = useCallback((message: string) => setStatus({ tone: "ok", message }), []);
  const setStatusWarn = useCallback((message: string) => setStatus({ tone: "warning", message }), []);
  const setStatusErr = useCallback((message: string) => setStatus({ tone: "error", message }), []);

  const sendCfgSet = useCallback(
    async (cfg: Bs2SensorConfig, timeoutMs: number) => {
      const normalized = normalizeSensorCfg(cfg);
      const res = await sendReqAwait(
        {
          requestId: `sim-sensor-test-set-${normalized.sensorId}-${Date.now()}`,
          cmdId: BS2_CMD.SENSOR_CFG_SET,
          bodyB64: bytesToBase64(encodeSensorCfgBody(normalized)),
          timeoutMs,
        },
        timeoutMs,
      );
      if (!res.ok) {
        throw new Error(res.error ?? `SENSOR_CFG_SET failed (status=${res.status})`);
      }
      const ack = decodeSensorCfgBody(res.body);
      if (ack == null) {
        throw new Error("SENSOR_CFG_SET ack decode failed");
      }
      return normalizeSensorCfg(ack);
    },
    [sendReqAwait],
  );

  const sendCfgGet = useCallback(
    async (sensorId: number, timeoutMs: number) => {
      const res = await sendReqAwait(
        {
          requestId: `sim-sensor-test-get-${sensorId}-${Date.now()}`,
          cmdId: BS2_CMD.SENSOR_CFG_GET,
          bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
          timeoutMs,
        },
        timeoutMs,
      );
      if (!res.ok) {
        throw new Error(res.error ?? `SENSOR_CFG_GET failed (status=${res.status})`);
      }
      const cfg = decodeSensorCfgBody(res.body);
      if (cfg == null) {
        throw new Error("SENSOR_CFG_GET decode failed");
      }
      return normalizeSensorCfg(cfg);
    },
    [sendReqAwait],
  );

  const quietBus = useCallback(async () => {
    try {
      setStatusWarn("Quieting bus: disabling all sensors…");
      setRoundtripResult([]);
      const timeoutMs = CFG_ACCESS_SET_TIMEOUT_MS;
      for (const sensorId of SENSOR_TEST_IDS) {
        await sendCfgSet(quietBusCfg(sensorId), timeoutMs);
        await sleep(80);
      }
      await sleep(CFG_ACCESS_POST_SET_SETTLE_MS);
      for (const id of SENSOR_TEST_IDS) {
        evtTimestampsRef.current[id] = [];
      }
      setStatusOk("Bus quieted (all sensors disabled).");
    } catch (e) {
      setStatusErr(e instanceof Error ? e.message : String(e));
    }
  }, [sendCfgSet, setStatusErr, setStatusOk, setStatusWarn]);

  const applyPreset = useCallback(
    async (preset: (typeof SENSOR_TEST_PRESETS)[number]) => {
      try {
        setStatusWarn(`Applying preset: ${preset.label}…`);
        setRoundtripResult([]);
        const base = cfgBySensorId[activeSensorId] ?? defaultSensorTestCfg(activeSensorId);
        const next = normalizeSensorCfg({ ...base, ...preset.cfgPatch, sensorId: activeSensorId });
        const ack = await sendCfgSet(next, CFG_ACCESS_SET_TIMEOUT_MS);
        await sleep(CFG_ACCESS_POST_SET_SETTLE_MS);
        setStatusOk(`Applied: ${formatSensorTestCfg(ack)}`);
      } catch (e) {
        setStatusErr(e instanceof Error ? e.message : String(e));
      }
    },
    [activeSensorId, cfgBySensorId, sendCfgSet, setStatusErr, setStatusOk, setStatusWarn],
  );

  const roundtripSetGetCompare = useCallback(async () => {
    try {
      setStatusWarn("Round-trip: SET → ack → GET → compare…");
      setRoundtripResult([]);

      const expected = cfgBySensorId[activeSensorId] ?? defaultSensorTestCfg(activeSensorId);
      const ack = await sendCfgSet(expected, CFG_ACCESS_SET_TIMEOUT_MS);
      const got = await sendCfgGet(activeSensorId, CFG_ACCESS_SET_TIMEOUT_MS);

      const diffsAck = diffCfgMessages(expected, ack);
      const diffsGet = diffCfgMessages(expected, got);
      const out: string[] = [];

      if (diffsAck.length > 0) {
        out.push(`Ack diffs: ${diffsAck.join("; ")}`);
      }
      if (diffsGet.length > 0) {
        out.push(`GET diffs: ${diffsGet.join("; ")}`);
      }

      if (out.length === 0) {
        setStatusOk(`Round-trip OK: ${formatSensorTestCfg(got)}`);
      } else {
        setStatusWarn(`Round-trip mismatch: ${out.join(" | ")}`);
      }
      setRoundtripResult(out);
    } catch (e) {
      setStatusErr(e instanceof Error ? e.message : String(e));
    }
  }, [activeSensorId, cfgBySensorId, sendCfgGet, sendCfgSet, setStatusErr, setStatusOk, setStatusWarn]);

  useEffect(() => {
    const listenerId = "simulator-sensor-test-panel:evt-sensor";
    const onMessage = (topic: string, payload: unknown) => {
      if (topic !== BITSTREAM2_TOPICS.EVT_SENSOR) {
        return;
      }
      const ev = payload as Bitstream2SensorSamplePayload;
      const sensorId = ev.sensorId;
      if (!SENSOR_TEST_IDS.includes(sensorId)) {
        return;
      }
      const now = Date.now();
      evtTimestampsRef.current[sensorId].push(now);
      setLastSampleBySensorId((p) => ({
        ...p,
        [sensorId]: { mask: ev.mask, valuesLen: ev.values.length, atMs: now },
      }));
    };
    addMessageListener(listenerId, onMessage);
    return () => {
      removeMessageListener(listenerId);
    };
  }, [addMessageListener, removeMessageListener]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const next: Record<number, number> = {};
      for (const id of SENSOR_TEST_IDS) {
        const ts = evtTimestampsRef.current[id];
        const keep = ts.filter((t) => now - t <= windowMs);
        evtTimestampsRef.current[id] = keep;
        next[id] = rateFromWindow(keep, windowMs);
      }
      setMeasuredHzBySensorId(next);
    }, 250);
    return () => clearInterval(timer);
  }, [windowMs]);

  const backendHint = useMemo(() => {
    if (!props.isConnected) {
      return "WebSocket disconnected.";
    }
    if (!props.loopbackEnabled) {
      return "External simulator not detected — install/run bitstream-simulator extension and start bridge.";
    }
    return "Backend: Node BS2 simulator (loopback).";
  }, [props.isConnected, props.loopbackEnabled]);

  const payloadIssues = useMemo(
    () => checkPayloadMaskIssues(activeSensorId, cfgBySensorId[activeSensorId], lastSampleBySensorId[activeSensorId]),
    [activeSensorId, cfgBySensorId, lastSampleBySensorId],
  );

  return (
    <TRNSectionContainer title="Sensor Test" glass glassPreset="soft">
      <div className="flex flex-col gap-3">
        <TRNHintText tone="neutral" className="text-[11px]">
          {backendHint} Quick presets, SET/GET round-trip, measured Hz, and payload sanity checks (mirrors Bitstream App).
        </TRNHintText>
        {status.tone !== "idle" ? (
          <TRNHintText
            tone={status.tone === "ok" ? "success" : status.tone === "warning" ? "warning" : "danger"}
            className="text-[11px]"
          >
            {status.message}
          </TRNHintText>
        ) : null}
        {roundtripResult.length > 0 ? (
          <TRNHintText tone="warning" className="text-[11px]">
            {roundtripResult.join(" | ")}
          </TRNHintText>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SENSOR_TEST_IDS.map((id) => (
            <TRNButton
              key={id}
              variant={id === activeSensorId ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveSensorId(id)}
            >
              {SENSOR_TEST_LABEL[id]}
            </TRNButton>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <TRNButton variant="secondary" size="sm" onClick={() => void quietBus()}>
            Quiet bus
          </TRNButton>
          <TRNButton variant="secondary" size="sm" onClick={() => void roundtripSetGetCompare()}>
            Round-trip SET/GET
          </TRNButton>
        </div>

        <TRNTabs defaultValue="presets" lazyMount className="flex min-h-0 flex-col gap-2">
          <TRNTabsList className="inline-flex w-full gap-1">
            <TRNTabsTrigger value="presets" className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Presets
              </div>
            </TRNTabsTrigger>
            <TRNTabsTrigger value="live" className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <Gauge className="h-4 w-4" />
                Live Hz
              </div>
            </TRNTabsTrigger>
            <TRNTabsTrigger value="payload" className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Payload
              </div>
            </TRNTabsTrigger>
          </TRNTabsList>

          <TRNTabsContent value="presets" className="min-h-0 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SENSOR_TEST_PRESETS.map((p) => (
                <TRNButton key={p.id} variant="secondary" size="sm" onClick={() => void applyPreset(p)}>
                  {p.label}
                </TRNButton>
              ))}
            </div>
          </TRNTabsContent>

          <TRNTabsContent value="live" className="min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <TRNFormField
                label="Window (ms)"
                hint="MeasuredHz = (#EVT in window) / window."
                className="max-w-[240px]"
              >
                <input
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
                  type="number"
                  min={500}
                  max={30000}
                  step={500}
                  value={windowMs}
                  onChange={(e) =>
                    setWindowMs(Math.max(500, Math.min(30000, Math.round(Number(e.target.value) || 3000))))
                  }
                />
              </TRNFormField>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SENSOR_TEST_IDS.map((id) => (
                  <div key={id} className="rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-zinc-200">{SENSOR_TEST_LABEL[id]}</div>
                      <div className="text-sm tabular-nums text-zinc-100">
                        {(measuredHzBySensorId[id] ?? 0).toFixed(2)} Hz
                      </div>
                    </div>
                    {lastSampleBySensorId[id] ? (
                      <div className="mt-1 text-[11px] text-zinc-400">
                        mask=0x{lastSampleBySensorId[id]!.mask.toString(16)} len=
                        {lastSampleBySensorId[id]!.valuesLen}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-zinc-500">No samples yet.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TRNTabsContent>

          <TRNTabsContent value="payload" className="min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <div className="rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-200">
                Active: {SENSOR_TEST_LABEL[activeSensorId]}{" "}
                {cfgBySensorId[activeSensorId]
                  ? `(${formatSensorTestCfg(cfgBySensorId[activeSensorId]!)})`
                  : "(cfg unknown)"}
              </div>
              {payloadIssues.length === 0 ? (
                <TRNHintText tone="success" className="text-[11px]">
                  OK: last sample mask includes configured bits.
                </TRNHintText>
              ) : (
                <TRNHintText tone="danger" className="text-[11px]">
                  {payloadIssues.join("; ")}
                </TRNHintText>
              )}
            </div>
          </TRNTabsContent>
        </TRNTabs>
      </div>
    </TRNSectionContainer>
  );
}
