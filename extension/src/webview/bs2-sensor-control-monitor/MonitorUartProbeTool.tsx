import { useCallback, useRef, useState } from "react";
import { TRNButton } from "../ui/TRN";
import { ToolConsole } from "./ToolConsole";
import type { Bs2SensorMonitorFeed } from "./useBs2SensorMonitorFeed";
import {
  runMonitorUartProbe,
  UART_PROBE_STEPS,
  type ProbeStepState,
} from "./tools/monitorProbeRunner";
import type { ProbeToolOptions } from "./tools/monitorToolCmd";
import type { ToolLogLine } from "./tools/monitorToolTypes";

type Props = {
  feed: Bs2SensorMonitorFeed;
  options: ProbeToolOptions;
};

function stepIconClass(state: ProbeStepState): string {
  if (state === "running") {
    return "bg-sky-700 text-white animate-pulse";
  }
  if (state === "ok") {
    return "bg-emerald-950 text-emerald-400";
  }
  if (state === "fail") {
    return "bg-red-950 text-red-400";
  }
  if (state === "warn") {
    return "bg-amber-950 text-amber-300";
  }
  return "bg-zinc-800 text-zinc-500";
}

function stepIconChar(state: ProbeStepState, stepN: number): string {
  if (state === "ok") {
    return "✓";
  }
  if (state === "fail") {
    return "✗";
  }
  if (state === "warn") {
    return "!";
  }
  return String(stepN);
}

export function MonitorUartProbeTool(props: Props) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<ToolLogLine[]>([]);
  const [stepState, setStepState] = useState<Record<number, ProbeStepState>>({});
  const [stepDetail, setStepDetail] = useState<Record<number, string>>({});
  const abortRef = useRef<AbortController | null>(null);

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
    setStepState({});
    setStepDetail({});

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await runMonitorUartProbe({
        soakMs: props.options.soakMs,
        skipSet: props.options.skipSet,
        hello: props.feed.hello,
        uartOpen: props.feed.uartOpen,
        signal: ac.signal,
        onLog: appendLog,
        onStep: (stepN, state, detail) => {
          setStepState((prev) => ({ ...prev, [stepN]: state }));
          if (detail != null) {
            setStepDetail((prev) => ({ ...prev, [stepN]: detail }));
          }
        },
      });
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [appendLog, props.feed.hello, props.feed.uartOpen, props.options, running]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    appendLog("Stopped by user", "warn");
    setRunning(false);
  }, [appendLog]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex shrink-0 justify-end gap-2">
        <TRNButton variant="primary" size="sm" disabled={running || !props.feed.uartOpen} onClick={() => void onRun()}>
          Run probe
        </TRNButton>
        <TRNButton variant="secondary" size="sm" disabled={!running} onClick={onStop}>
          Stop
        </TRNButton>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          {UART_PROBE_STEPS.map((step) => {
            const state = stepState[step.n] ?? "idle";
            return (
              <div
                key={step.n}
                className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${stepIconClass(state)}`}
                >
                  {stepIconChar(state, step.n)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-zinc-200">{step.name}</div>
                  <div className="text-[11px] text-zinc-500">{stepDetail[step.n] ?? step.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        <ToolConsole lines={logs} emptyHint="Run UART probe checklist (§9.2)…" />
      </div>
    </div>
  );
}
