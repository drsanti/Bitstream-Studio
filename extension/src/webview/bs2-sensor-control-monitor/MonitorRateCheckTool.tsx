import { useCallback, useRef, useState } from "react";
import { BS2_SENSOR_ID } from "../../bitstream2/domains/sensors/sensor-ids";
import { SENSOR_TEST_LABEL } from "../shared/sensorTestShared";
import { TRNButton } from "../ui/TRN";
import { ToolConsole } from "./ToolConsole";
import type { Bs2SensorMonitorFeed } from "./useBs2SensorMonitorFeed";
import { runMonitorRateCheck } from "./tools/monitorRateRunner";
import type { RateCheckToolOptions } from "./tools/monitorToolCmd";
import type { ToolLogLine } from "./tools/monitorToolTypes";

type Props = {
  feed: Bs2SensorMonitorFeed;
  options: RateCheckToolOptions;
};

const SENSOR_IDS = [
  BS2_SENSOR_ID.BMI270,
  BS2_SENSOR_ID.BMM350,
  BS2_SENSOR_ID.SHT40,
  BS2_SENSOR_ID.DPS368,
] as const;

export function MonitorRateCheckTool(props: Props) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<ToolLogLine[]>([]);
  const [hzBySensor, setHzBySensor] = useState<Record<number, number | null>>({});
  const [passBySensor, setPassBySensor] = useState<Record<number, boolean | null>>({});
  const abortRef = useRef<AbortController | null>(null);

  const enabledIds = SENSOR_IDS.filter((id) => {
    if (id === BS2_SENSOR_ID.BMI270) {
      return props.options.enabledBmi270;
    }
    if (id === BS2_SENSOR_ID.BMM350) {
      return props.options.enabledBmm350;
    }
    if (id === BS2_SENSOR_ID.SHT40) {
      return props.options.enabledSht40;
    }
    return props.options.enabledDps368;
  });

  const appendLog = useCallback((text: string, tone: ToolLogLine["tone"]) => {
    setLogs((prev) => [
      ...prev.slice(-399),
      { id: `${Date.now()}-${prev.length}`, atMs: Date.now(), text, tone },
    ]);
  }, []);

  const onRun = useCallback(async () => {
    if (running) {
      return;
    }
    setRunning(true);
    setLogs([]);
    setHzBySensor({});
    setPassBySensor({});

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await runMonitorRateCheck({
        targetHz: props.options.targetHz,
        soakMs: props.options.soakMs,
        settleMs: props.options.settleMs,
        minPassRatio: props.options.minPassRatio,
        enabledSensorIds: enabledIds,
        hello: props.feed.hello,
        uartOpen: props.feed.uartOpen,
        signal: ac.signal,
        onLog: appendLog,
        onSensorResult: (sensorId, hz, passed) => {
          setHzBySensor((prev) => ({ ...prev, [sensorId]: hz }));
          setPassBySensor((prev) => ({ ...prev, [sensorId]: passed }));
        },
      });
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [appendLog, enabledIds, props.feed.hello, props.feed.uartOpen, props.options, running]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    appendLog("Stopped by user", "warn");
    setRunning(false);
  }, [appendLog]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex shrink-0 justify-end gap-2">
        <TRNButton variant="primary" size="sm" disabled={running || !props.feed.uartOpen || enabledIds.length === 0} onClick={() => void onRun()}>
          Run rate check
        </TRNButton>
        <TRNButton variant="secondary" size="sm" disabled={!running} onClick={onStop}>
          Stop
        </TRNButton>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2">
        {SENSOR_IDS.map((id) => {
          const enabled =
            id === BS2_SENSOR_ID.BMI270
              ? props.options.enabledBmi270
              : id === BS2_SENSOR_ID.BMM350
                ? props.options.enabledBmm350
                : id === BS2_SENSOR_ID.SHT40
                  ? props.options.enabledSht40
                  : props.options.enabledDps368;
          const hz = hzBySensor[id];
          const passed = passBySensor[id];
          const hzClass =
            !enabled || hz == null
              ? "text-zinc-600"
              : passed
                ? "text-emerald-400"
                : passed === false
                  ? "text-red-400"
                  : "text-zinc-300";

          return (
            <div key={id} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">{SENSOR_TEST_LABEL[id]}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    enabled ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {enabled ? "enabled" : "disabled"}
                </span>
              </div>
              <div className={`py-2 text-center font-mono text-3xl font-bold ${hzClass}`}>
                {enabled ? (hz != null ? hz.toFixed(1) : "…") : "—"}
              </div>
              <div className="text-center text-[11px] text-zinc-500">
                {enabled ? `target: ${props.options.targetHz} Hz` : "disabled"}
              </div>
            </div>
          );
        })}
      </div>

      <ToolConsole lines={logs} emptyHint="Run rate check to measure EVT_SENSOR Hz…" />
    </div>
  );
}
