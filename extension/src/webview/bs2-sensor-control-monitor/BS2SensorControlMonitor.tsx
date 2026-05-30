import { useCallback, useMemo, useRef, useState } from "react";
import { CFG_ACCESS_UI_HINT } from "../../bitstream2/domains/config/sensor-cfg-access-policy";
import { BS2_SENSOR_ID } from "../../bitstream2/domains/sensors/sensor-ids";
import type { MatrixTier } from "../../bitstream2/dev/uart-sensor-test-matrix";
import {
  SensorTestWorkbench,
  type SensorTestWorkbenchHandle,
} from "../shared/SensorTestWorkbench";
import type { SensorTestLastSample, SensorTestUiStatus } from "../shared/sensorTestShared";
import { useSerialPortStore } from "../serialport/serial-port-store";
import { TRNTabs, TRNTabsContent, TRNTabsList, TRNTabsTrigger } from "../ui/TRN";
import { MonitorActivityLog, type LogLine } from "./MonitorActivityLog";
import { MonitorMatrixTool } from "./MonitorMatrixTool";
import { MonitorRateCheckTool } from "./MonitorRateCheckTool";
import { MonitorSidebar } from "./MonitorSidebar";
import { MonitorToolTabBar } from "./MonitorToolTabBar";
import { MonitorUartProbeTool } from "./MonitorUartProbeTool";
import { SensorHzMeterStrip } from "./SensorHzMeterStrip";
import { listScenarioIds } from "../../bitstream2/dev/scenarios";
import {
  buildMonitorCommandPreview,
  type MatrixToolOptions,
  type ProbeToolOptions,
  type RateCheckToolOptions,
  type SimToolOptions,
} from "./tools/monitorToolCmd";
import { MonitorMockProbeTool } from "./MonitorMockProbeTool";
import { MonitorSimScenarioTool } from "./MonitorSimScenarioTool";
import { MonitorWsInjectorTool } from "./MonitorWsInjectorTool";
import type { MonitorToolId } from "./tools/monitorToolTypes";
import { useBs2SensorMonitorFeed } from "./useBs2SensorMonitorFeed";

const DEFAULT_MATRIX: MatrixToolOptions = {
  tier: "standard",
  caseId: "",
  soakMs: 12_000,
  settleMs: 600,
  minPassRatio: 0.6,
  disabledMaxEvt: 0,
  continueOnFail: false,
  printFailSamples: false,
  resumeFrom: "",
};

const DEFAULT_PROBE: ProbeToolOptions = {
  soakMs: 90_000,
  skipSet: false,
};

const DEFAULT_RATE: RateCheckToolOptions = {
  targetHz: 20,
  soakMs: 15_000,
  settleMs: 600,
  minPassRatio: 0.6,
  enabledBmi270: true,
  enabledBmm350: true,
  enabledSht40: true,
  enabledDps368: true,
};

const DEFAULT_SIM: SimToolOptions = {
  scenarioId: "boot",
};

/**
 * Standalone BS2 sensor cfg + rate monitor (dashboard layout).
 * Top tool tabs: Control, Matrix, UART Probe, Rate Check, Sim Scenarios, WS Injector, Mock Probe.
 */
export function BS2SensorControlMonitor() {
  const feed = useBs2SensorMonitorFeed();
  const workbenchRef = useRef<SensorTestWorkbenchHandle>(null);
  const serialPath = useSerialPortStore((s) => s.selectedPath);

  const [activeTool, setActiveTool] = useState<MonitorToolId>("control");
  const [activeSensorId, setActiveSensorId] = useState<number>(BS2_SENSOR_ID.BMM350);
  const [windowMs, setWindowMs] = useState(3000);
  const [busy, setBusy] = useState(false);
  const [hzBySensorId, setHzBySensorId] = useState<Record<number, number>>({});
  const [lastBySensorId, setLastBySensorId] = useState<Record<number, SensorTestLastSample>>({});
  const [logLines, setLogLines] = useState<LogLine[]>([]);

  const [matrixOpts, setMatrixOpts] = useState<MatrixToolOptions>(DEFAULT_MATRIX);
  const [probeOpts, setProbeOpts] = useState<ProbeToolOptions>(DEFAULT_PROBE);
  const [rateOpts, setRateOpts] = useState<RateCheckToolOptions>(DEFAULT_RATE);
  const [simOpts, setSimOpts] = useState<SimToolOptions>(DEFAULT_SIM);
  const [matrixSummary, setMatrixSummary] = useState({ passed: 0, failed: 0, skipped: 0 });

  const commandPreview = useMemo(
    () => buildMonitorCommandPreview(activeTool, serialPath, matrixOpts, probeOpts, rateOpts, simOpts),
    [activeTool, matrixOpts, probeOpts, rateOpts, serialPath, simOpts],
  );

  const backendHint = useMemo(() => {
    if (!feed.isConnected) {
      return "WebSocket disconnected — start bridge (npm run start:bridge).";
    }
    if (feed.loopbackEnabled && !feed.uartOpen) {
      return "Backend: loopback simulator.";
    }
    if (feed.uartOpen) {
      return "Backend: UART (BS2).";
    }
    return "Backend: bridge only — open COM for UART tools.";
  }, [feed.isConnected, feed.loopbackEnabled, feed.uartOpen]);

  const appendLog = useCallback((text: string, tone: SensorTestUiStatus["tone"]) => {
    setLogLines((prev) => [
      ...prev.slice(-199),
      { id: `${Date.now()}-${prev.length}`, atMs: Date.now(), text, tone },
    ]);
  }, []);

  const onStatusChange = useCallback(
    (status: SensorTestUiStatus, roundtrip: string[]) => {
      if (status.tone !== "idle") {
        appendLog(status.message, status.tone);
      }
      for (const line of roundtrip) {
        appendLog(line, "warning");
      }
    },
    [appendLog],
  );

  const onMetricsUpdate = useCallback(
    (hz: Record<number, number>, last: Record<number, SensorTestLastSample>) => {
      setHzBySensorId(hz);
      setLastBySensorId(last);
    },
    [],
  );

  const runQuiet = useCallback(async () => {
    setBusy(true);
    try {
      await workbenchRef.current?.quietBus();
    } finally {
      setBusy(false);
    }
  }, []);

  const runRoundtrip = useCallback(async () => {
    setBusy(true);
    try {
      await workbenchRef.current?.roundtripSetGetCompare();
    } finally {
      setBusy(false);
    }
  }, []);

  const toolConfigSection = useMemo(() => {
    if (activeTool === "matrix") {
      return (
        <MatrixToolConfig options={matrixOpts} onChange={setMatrixOpts} />
      );
    }
    if (activeTool === "probe") {
      return (
        <ProbeToolConfig options={probeOpts} onChange={setProbeOpts} />
      );
    }
    if (activeTool === "ratecheck") {
      return (
        <RateToolConfig options={rateOpts} onChange={setRateOpts} />
      );
    }
    if (activeTool === "sim") {
      return (
        <SimToolConfig options={simOpts} onChange={setSimOpts} />
      );
    }
    return null;
  }, [activeTool, matrixOpts, probeOpts, rateOpts, simOpts]);

  return (
    <div className="t3d-shell-overlay pointer-events-auto flex h-full min-h-screen w-full flex-col overflow-hidden bg-[#0d1117] text-zinc-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-[#161b22] px-4 py-2">
        <h1 className="text-sm font-semibold text-zinc-100">BS2 Sensor Control Monitor</h1>
        <span className="text-xs text-zinc-500">Standalone · {feed.wsUrl}</span>
      </header>

      <MonitorToolTabBar activeTool={activeTool} onChange={setActiveTool} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <MonitorSidebar
          isConnected={feed.isConnected}
          loopbackEnabled={feed.loopbackEnabled}
          uartOpen={feed.uartOpen}
          sampleCount={feed.sampleCount}
          activeSensorId={activeSensorId}
          windowMs={windowMs}
          onActiveSensorIdChange={setActiveSensorId}
          onWindowMsChange={setWindowMs}
          onQuietBus={() => void runQuiet()}
          onRoundtrip={() => void runRoundtrip()}
          busy={busy}
          showSensorActions={activeTool === "control"}
          toolConfigSection={toolConfigSection}
          commandPreview={commandPreview}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0d1117]">
          {activeTool === "control" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
              <TRNTabs defaultValue="control" lazyMount className="flex min-h-0 flex-1 flex-col gap-2">
                <TRNTabsList className="inline-flex w-full shrink-0 gap-1 border-b border-zinc-800 bg-[#161b22] p-1">
                  <TRNTabsTrigger value="control" className="flex-1">
                    Presets / Hz
                  </TRNTabsTrigger>
                  <TRNTabsTrigger value="log" className="flex-1">
                    Activity log
                  </TRNTabsTrigger>
                </TRNTabsList>

                <TRNTabsContent value="control" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <SensorTestWorkbench
                    ref={workbenchRef}
                    layout="dashboard"
                    backendHint={backendHint}
                    cfgAccessHint={feed.uartOpen ? CFG_ACCESS_UI_HINT : null}
                    cfgBySensorId={feed.cfgBySensorId}
                    onCfgApplied={feed.applyLocalCfg}
                    requestIdPrefix="bs2-monitor"
                    useUartLoadTimeouts={feed.uartOpen}
                    activeSensorId={activeSensorId}
                    onActiveSensorIdChange={setActiveSensorId}
                    windowMs={windowMs}
                    onWindowMsChange={setWindowMs}
                    onStatusChange={onStatusChange}
                    onMetricsUpdate={onMetricsUpdate}
                  />
                </TRNTabsContent>

                <TRNTabsContent value="log" className="flex min-h-0 flex-1 flex-col">
                  <MonitorActivityLog lines={logLines} />
                </TRNTabsContent>
              </TRNTabs>
            </div>
          )}

          {activeTool === "matrix" && (
            <MonitorMatrixTool
              feed={feed}
              options={matrixOpts}
              onSummary={(passed, failed, skipped) => setMatrixSummary({ passed, failed, skipped })}
            />
          )}

          {activeTool === "probe" && <MonitorUartProbeTool feed={feed} options={probeOpts} />}

          {activeTool === "ratecheck" && <MonitorRateCheckTool feed={feed} options={rateOpts} />}

          {activeTool === "sim" && <MonitorSimScenarioTool feed={feed} scenarioId={simOpts.scenarioId} />}

          {activeTool === "injector" && <MonitorWsInjectorTool feed={feed} />}

          {activeTool === "mock" && <MonitorMockProbeTool />}

          <SensorHzMeterStrip
            hzBySensorId={hzBySensorId}
            lastBySensorId={lastBySensorId}
            cfgBySensorId={feed.cfgBySensorId}
          />
        </div>
      </div>

      {activeTool === "matrix" && matrixSummary.passed + matrixSummary.failed > 0 && (
        <div className="sr-only" aria-live="polite">
          Matrix summary pass {matrixSummary.passed} fail {matrixSummary.failed}
        </div>
      )}
    </div>
  );
}

type MatrixConfigProps = {
  options: MatrixToolOptions;
  onChange: (next: MatrixToolOptions) => void;
};

function MatrixToolConfig(props: MatrixConfigProps) {
  const set = (patch: Partial<MatrixToolOptions>): void => {
    props.onChange({ ...props.options, ...patch });
  };

  return (
    <>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Matrix options</div>
      <label className="mb-1 block text-[11px] text-zinc-500">Tier</label>
      <select
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.tier}
        onChange={(e) => set({ tier: e.target.value as MatrixTier })}
      >
        <option value="smoke">smoke</option>
        <option value="standard">standard</option>
        <option value="exhaustive">exhaustive</option>
      </select>
      <label className="mb-1 block text-[11px] text-zinc-500">Single case ID</label>
      <input
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.caseId}
        placeholder="only-bmi270"
        onChange={(e) => set({ caseId: e.target.value })}
      />
      <label className="mb-1 block text-[11px] text-zinc-500">Soak (ms)</label>
      <input
        type="number"
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.soakMs}
        onChange={(e) => set({ soakMs: Number(e.target.value) || 12_000 })}
      />
      <label className="mb-1 block text-[11px] text-zinc-500">Min pass ratio</label>
      <input
        type="number"
        step="0.1"
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.minPassRatio}
        onChange={(e) => set({ minPassRatio: Number(e.target.value) || 0.6 })}
      />
      <label className="flex items-center gap-2 text-[11px] text-zinc-400">
        <input
          type="checkbox"
          checked={props.options.continueOnFail}
          onChange={(e) => set({ continueOnFail: e.target.checked })}
        />
        continue-on-fail
      </label>
    </>
  );
}

type ProbeConfigProps = {
  options: ProbeToolOptions;
  onChange: (next: ProbeToolOptions) => void;
};

function ProbeToolConfig(props: ProbeConfigProps) {
  return (
    <>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Probe options</div>
      <label className="mb-1 block text-[11px] text-zinc-500">Soak (ms)</label>
      <input
        type="number"
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.soakMs}
        onChange={(e) => props.onChange({ ...props.options, soakMs: Number(e.target.value) || 90_000 })}
      />
      <label className="flex items-center gap-2 text-[11px] text-zinc-400">
        <input
          type="checkbox"
          checked={props.options.skipSet}
          onChange={(e) => props.onChange({ ...props.options, skipSet: e.target.checked })}
        />
        skip SET step
      </label>
    </>
  );
}

type SimConfigProps = {
  options: SimToolOptions;
  onChange: (next: SimToolOptions) => void;
};

function SimToolConfig(props: SimConfigProps) {
  const ids = listScenarioIds();
  return (
    <>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sim scenario</div>
      <label className="mb-1 block text-[11px] text-zinc-500">Scenario ID</label>
      <select
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.scenarioId}
        onChange={(e) => props.onChange({ ...props.options, scenarioId: e.target.value })}
      >
        {ids.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </>
  );
}

type RateConfigProps = {
  options: RateCheckToolOptions;
  onChange: (next: RateCheckToolOptions) => void;
};

function RateToolConfig(props: RateConfigProps) {
  const set = (patch: Partial<RateCheckToolOptions>): void => {
    props.onChange({ ...props.options, ...patch });
  };

  return (
    <>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rate check</div>
      <label className="mb-1 block text-[11px] text-zinc-500">Target Hz</label>
      <input
        type="number"
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.targetHz}
        onChange={(e) => set({ targetHz: Number(e.target.value) || 20 })}
      />
      <label className="mb-1 block text-[11px] text-zinc-500">Soak (ms)</label>
      <input
        type="number"
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
        value={props.options.soakMs}
        onChange={(e) => set({ soakMs: Number(e.target.value) || 15_000 })}
      />
      {(
        [
          ["enabledBmi270", "BMI270"],
          ["enabledBmm350", "BMM350"],
          ["enabledSht40", "SHT40"],
          ["enabledDps368", "DPS368"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="mb-1 flex items-center gap-2 text-[11px] text-zinc-400">
          <input
            type="checkbox"
            checked={props.options[key]}
            onChange={(e) => set({ [key]: e.target.checked })}
          />
          {label}
        </label>
      ))}
    </>
  );
}

