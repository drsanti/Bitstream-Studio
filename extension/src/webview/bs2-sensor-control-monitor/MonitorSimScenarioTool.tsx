import { useCallback, useMemo, useRef, useState } from "react";
import { getScenario } from "../../bitstream2/dev/scenarios";
import { TRNButton } from "../ui/TRN";
import { ToolConsole } from "./ToolConsole";
import type { Bs2SensorMonitorFeed } from "./useBs2SensorMonitorFeed";
import { runMonitorSimScenarioWs } from "./tools/monitorSimScenarioRunner";
import type { ToolLogLine } from "./tools/monitorToolTypes";

type Props = {
  feed: Bs2SensorMonitorFeed;
  scenarioId: string;
};

type StepUiState = "pending" | "running" | "ok" | "fail";

export function MonitorSimScenarioTool(props: Props) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<ToolLogLine[]>([]);
  const [stepStates, setStepStates] = useState<StepUiState[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const scenario = useMemo(() => getScenario(props.scenarioId), [props.scenarioId]);
  const steps = scenario?.steps ?? [];

  const appendLog = useCallback((text: string, tone: ToolLogLine["tone"]) => {
    setLogs((prev) => [
      ...prev.slice(-399),
      { id: `${Date.now()}-${prev.length}`, atMs: Date.now(), text, tone },
    ]);
  }, []);

  const onRun = useCallback(async () => {
    if (running || scenario == null) {
      return;
    }
    setRunning(true);
    setLogs([]);
    setStepStates(steps.map(() => "pending"));

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await runMonitorSimScenarioWs({
        scenarioId: props.scenarioId,
        signal: ac.signal,
        onLog: appendLog,
        onStep: (index, _total, _label, state) => {
          setStepStates((prev) => {
            const next = [...prev];
            while (next.length < steps.length) {
              next.push("pending");
            }
            if (state === "running") {
              next[index] = "running";
            } else if (state === "ok") {
              next[index] = "ok";
            } else if (state === "fail") {
              next[index] = "fail";
            }
            return next;
          });
        },
      });
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [appendLog, props.scenarioId, running, scenario, steps.length]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    appendLog("Stopped by user", "warn");
    setRunning(false);
  }, [appendLog]);

  const loopback = props.feed.loopbackEnabled;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
        WS scenario runner (same as <span className="font-mono text-zinc-200">bitstream2:sim-scenario --ws</span>).
        Loopback should be <strong className="text-emerald-400">on</strong>. Offline in-process:{" "}
        <span className="font-mono text-emerald-400/90">npm run bitstream2:sim-scenario -- --offline {props.scenarioId}</span>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="text-xs text-zinc-500">
          <span className="font-semibold text-zinc-300">{props.scenarioId}</span>
          {scenario ? ` — ${scenario.description}` : ""}
        </div>
        <div className="flex gap-2">
          <TRNButton
            variant="primary"
            size="sm"
            disabled={running || !props.feed.isConnected || !loopback || scenario == null}
            onClick={() => void onRun()}
          >
            Run scenario
          </TRNButton>
          <TRNButton variant="secondary" size="sm" disabled={!running} onClick={onStop}>
            Stop
          </TRNButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/40 p-2">
        {steps.length === 0 ? (
          <div className="text-xs text-zinc-500">Unknown scenario.</div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {steps.map((step, i) => {
              const st = stepStates[i] ?? "pending";
              const border =
                st === "ok"
                  ? "border-emerald-800"
                  : st === "fail"
                    ? "border-red-800"
                    : st === "running"
                      ? "border-sky-700"
                      : "border-zinc-800";
              return (
                <li
                  key={`${i}-${step.kind}`}
                  className={`rounded border px-2 py-1.5 text-xs ${border} bg-zinc-900/50 text-zinc-300`}
                >
                  <span className="font-mono text-[10px] text-zinc-500">{i + 1}.</span> {step.kind}
                  {step.kind === "wait" ? ` ${step.ms}ms` : ""}
                  {step.kind === "cfgGet" ? ` sensor ${step.sensorId}` : ""}
                  {step.kind === "expectSamples" ? ` ≥${step.minCount} sid=${step.sensorId ?? "any"}` : ""}
                  <span className={`ml-2 text-[10px] uppercase ${st === "ok" ? "text-emerald-500" : st === "fail" ? "text-red-500" : st === "running" ? "text-sky-400" : "text-zinc-600"}`}>
                    {st}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ToolConsole lines={logs} emptyHint="Run scenario to see broker / mock traffic…" />
    </div>
  );
}
