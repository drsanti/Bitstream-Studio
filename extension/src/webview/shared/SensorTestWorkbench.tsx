import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Gauge, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { BITSTREAM2_TOPICS, type Bitstream2SensorSamplePayload } from "../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../bitstream2/domains/config/commands";
import {
  CFG_ACCESS_POST_SET_SETTLE_MS,
  CFG_ACCESS_SET_TIMEOUT_MS,
  CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS,
} from "../../bitstream2/domains/config/sensor-cfg-access-policy";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../../bitstream2/domains/config/sensor-config";
import { BS2_SENSOR_ID } from "../../bitstream2/domains/sensors/sensor-ids";
import { bytesToBase64 } from "../../bitstream2/util/base64";
import { useWsClientStore } from "../ws-client-store";
import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNSectionContainer,
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
} from "../ui/TRN";
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
} from "./sensorTestShared";
import { useBitstream2ReqAwait } from "./useBitstream2ReqAwait";

export type SensorTestWorkbenchHandle = {
  quietBus: () => Promise<void>;
  roundtripSetGetCompare: () => Promise<void>;
};

export type SensorTestWorkbenchProps = {
  backendHint: string;
  cfgAccessHint?: string | null;
  cfgBySensorId: Partial<Record<number, Bs2SensorConfig>>;
  onCfgApplied?: (cfg: Bs2SensorConfig) => void;
  requestIdPrefix?: string;
  useUartLoadTimeouts?: boolean;
  /** `dashboard` = sidebar owns chrome; meters live in parent strip. */
  layout?: "stack" | "dashboard";
  activeSensorId?: number;
  onActiveSensorIdChange?: (sensorId: number) => void;
  windowMs?: number;
  onWindowMsChange?: (ms: number) => void;
  onStatusChange?: (status: SensorTestUiStatus, roundtripLines: string[]) => void;
  onMetricsUpdate?: (
    hzBySensorId: Record<number, number>,
    lastBySensorId: Record<number, SensorTestLastSample>,
  ) => void;
};

export const SensorTestWorkbench = forwardRef<SensorTestWorkbenchHandle, SensorTestWorkbenchProps>(
  function SensorTestWorkbench(props, ref) {
  const {
    backendHint,
    cfgAccessHint = null,
    cfgBySensorId,
    onCfgApplied,
    requestIdPrefix,
    useUartLoadTimeouts = false,
    layout = "stack",
  } = props;

  const isDashboard = layout === "dashboard";

  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);
  const { sendReqAwait } = useBitstream2ReqAwait();

  const [internalSensorId, setInternalSensorId] = useState<number>(BS2_SENSOR_ID.BMM350);
  const [status, setStatus] = useState<SensorTestUiStatus>({ tone: "idle", message: "Ready." });
  const [roundtripResult, setRoundtripResult] = useState<string[]>([]);
  const [internalWindowMs, setInternalWindowMs] = useState<number>(3000);

  const activeSensorId = props.activeSensorId ?? internalSensorId;
  const setActiveSensorId = useCallback(
    (id: number) => {
      if (props.onActiveSensorIdChange) {
        props.onActiveSensorIdChange(id);
      } else {
        setInternalSensorId(id);
      }
    },
    [props.onActiveSensorIdChange],
  );

  const windowMs = props.windowMs ?? internalWindowMs;
  const setWindowMs = useCallback(
    (ms: number) => {
      if (props.onWindowMsChange) {
        props.onWindowMsChange(ms);
      } else {
        setInternalWindowMs(ms);
      }
    },
    [props.onWindowMsChange],
  );
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

  const reqPrefix = requestIdPrefix ?? "sensor-test";

  const setStatusOk = useCallback((message: string) => setStatus({ tone: "ok", message }), []);
  const setStatusWarn = useCallback((message: string) => setStatus({ tone: "warning", message }), []);
  const setStatusErr = useCallback((message: string) => setStatus({ tone: "error", message }), []);

  const resolveSetTimeoutMs = useCallback(
    (presetId?: string) => {
      if (!useUartLoadTimeouts) {
        return CFG_ACCESS_SET_TIMEOUT_MS;
      }
      return presetId === "quiet-bus"
        ? CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS
        : CFG_ACCESS_SET_TIMEOUT_MS;
    },
    [useUartLoadTimeouts],
  );

  const sendCfgSet = useCallback(
    async (cfg: Bs2SensorConfig, timeoutMs: number) => {
      const normalized = normalizeSensorCfg(cfg);
      const res = await sendReqAwait(
        {
          requestId: `${reqPrefix}-set-${normalized.sensorId}-${Date.now()}`,
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
      const applied = normalizeSensorCfg(ack);
      onCfgApplied?.(applied);
      return applied;
    },
    [onCfgApplied, reqPrefix, sendReqAwait],
  );

  const sendCfgGet = useCallback(
    async (sensorId: number, timeoutMs: number) => {
      const res = await sendReqAwait(
        {
          requestId: `${reqPrefix}-get-${sensorId}-${Date.now()}`,
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
      const got = normalizeSensorCfg(cfg);
      onCfgApplied?.(got);
      return got;
    },
    [onCfgApplied, reqPrefix, sendReqAwait],
  );

  const quietBus = useCallback(async () => {
    try {
      setStatusWarn("Quieting bus: disabling all sensors…");
      setRoundtripResult([]);
      const timeoutMs = useUartLoadTimeouts
        ? CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS
        : CFG_ACCESS_SET_TIMEOUT_MS;
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
  }, [useUartLoadTimeouts, sendCfgSet, setStatusErr, setStatusOk, setStatusWarn]);

  const applyPreset = useCallback(
    async (preset: (typeof SENSOR_TEST_PRESETS)[number]) => {
      try {
        setStatusWarn(`Applying preset: ${preset.label}…`);
        setRoundtripResult([]);
        const timeoutMs = resolveSetTimeoutMs(preset.id);
        const base = cfgBySensorId[activeSensorId] ?? defaultSensorTestCfg(activeSensorId);
        const next = normalizeSensorCfg({ ...base, ...preset.cfgPatch, sensorId: activeSensorId });
        const ack = await sendCfgSet(next, timeoutMs);
        await sleep(CFG_ACCESS_POST_SET_SETTLE_MS);
        setStatusOk(`Applied: ${formatSensorTestCfg(ack)}`);
      } catch (e) {
        setStatusErr(e instanceof Error ? e.message : String(e));
      }
    },
    [
      activeSensorId,
      cfgBySensorId,
      resolveSetTimeoutMs,
      sendCfgSet,
      setStatusErr,
      setStatusOk,
      setStatusWarn,
    ],
  );

  const roundtripSetGetCompare = useCallback(async () => {
    try {
      setStatusWarn("Round-trip: SET → ack → GET → compare…");
      setRoundtripResult([]);

      const expected = cfgBySensorId[activeSensorId] ?? defaultSensorTestCfg(activeSensorId);
      const timeoutMs = useUartLoadTimeouts
        ? CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS
        : CFG_ACCESS_SET_TIMEOUT_MS;
      const ack = await sendCfgSet(expected, timeoutMs);
      const got = await sendCfgGet(activeSensorId, timeoutMs);

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
  }, [
    activeSensorId,
    cfgBySensorId,
    useUartLoadTimeouts,
    sendCfgGet,
    sendCfgSet,
    setStatusErr,
    setStatusOk,
    setStatusWarn,
  ]);

  useEffect(() => {
    const listenerId = `${reqPrefix}:evt-sensor`;
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
  }, [addMessageListener, removeMessageListener, reqPrefix]);

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

  useImperativeHandle(
    ref,
    () => ({
      quietBus,
      roundtripSetGetCompare,
    }),
    [quietBus, roundtripSetGetCompare],
  );

  useEffect(() => {
    props.onStatusChange?.(status, roundtripResult);
  }, [props.onStatusChange, roundtripResult, status]);

  useEffect(() => {
    props.onMetricsUpdate?.(measuredHzBySensorId, lastSampleBySensorId);
  }, [props.onMetricsUpdate, measuredHzBySensorId, lastSampleBySensorId]);

  const payloadIssues = useMemo(
    () =>
      checkPayloadMaskIssues(
        activeSensorId,
        cfgBySensorId[activeSensorId],
        lastSampleBySensorId[activeSensorId],
      ),
    [activeSensorId, cfgBySensorId, lastSampleBySensorId],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
      {!isDashboard ? (
        <div className="flex shrink-0 flex-col gap-2">
          <TRNHintText tone="neutral" className="text-[11px]">
            {backendHint} {cfgAccessHint ?? null}
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
        </div>
      ) : (
        <TRNHintText tone="neutral" className="shrink-0 text-[11px]">
          {backendHint} {cfgAccessHint ?? null}
        </TRNHintText>
      )}

      <TRNTabs defaultValue="presets" lazyMount className="flex min-h-0 flex-1 flex-col gap-2">
        <TRNTabsList className="inline-flex w-full shrink-0 gap-1">
          <TRNTabsTrigger value="presets" className="flex-1">
            <div className="flex items-center justify-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Presets
            </div>
          </TRNTabsTrigger>
          {!isDashboard ? (
            <TRNTabsTrigger value="live" className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <Gauge className="h-4 w-4" />
                Live Hz
              </div>
            </TRNTabsTrigger>
          ) : null}
          <TRNTabsTrigger value="payload" className="flex-1">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Payload
            </div>
          </TRNTabsTrigger>
        </TRNTabsList>

        <TRNTabsContent value="presets">
          <TRNSectionContainer
            title="Apply preset"
            icon={SlidersHorizontal}
            description="Writes SENSOR_CFG_SET for the active sensor."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SENSOR_TEST_PRESETS.map((p) => (
                <TRNButton key={p.id} variant="secondary" size="sm" onClick={() => void applyPreset(p)}>
                  {p.label}
                </TRNButton>
              ))}
            </div>
          </TRNSectionContainer>
        </TRNTabsContent>

        {!isDashboard ? (
          <TRNTabsContent value="live">
            <TRNSectionContainer
              title="Measured Hz"
              icon={Gauge}
              description="Counts EVT_SENSOR over a sliding window."
            >
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
                      setWindowMs(
                        Math.max(500, Math.min(30000, Math.round(Number(e.target.value) || 3000))),
                      )
                    }
                  />
                </TRNFormField>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SENSOR_TEST_IDS.map((id) => (
                    <div key={id} className="rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-zinc-200">{SENSOR_TEST_LABEL[id]}</div>
                        <div className="text-sm text-zinc-100">
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
            </TRNSectionContainer>
          </TRNTabsContent>
        ) : null}

        <TRNTabsContent value="payload">
          <TRNSectionContainer
            title="Payload sanity"
            icon={ShieldCheck}
            description="Checks last EVT mask vs current cfg mask (best-effort)."
          >
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
          </TRNSectionContainer>
        </TRNTabsContent>
      </TRNTabs>
    </div>
  );
},
);
