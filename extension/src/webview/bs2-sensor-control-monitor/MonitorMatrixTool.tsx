import { useCallback, useMemo, useRef, useState } from "react";
import {
  buildMatrixCases,
  type MatrixTier,
} from "../../bitstream2/dev/uart-sensor-test-matrix";
import { UART_SENSOR_NAMES } from "../../bitstream2/dev/uart-sensor-assert";
import { TRNButton } from "../ui/TRN";
import { TRNTabs, TRNTabsContent, TRNTabsList, TRNTabsTrigger } from "../ui/TRN";
import { ToolConsole } from "./ToolConsole";
import type { Bs2SensorMonitorFeed } from "./useBs2SensorMonitorFeed";
import { runMonitorMatrix } from "./tools/monitorMatrixRunner";
import type { CaseRunStatus, ToolLogLine } from "./tools/monitorToolTypes";
import type { MatrixToolOptions } from "./tools/monitorToolCmd";

type Props = {
  feed: Bs2SensorMonitorFeed;
  options: MatrixToolOptions;
  onSummary: (passed: number, failed: number, skipped: number) => void;
};

function tierBadgeClass(tier: string): string {
  if (tier === "smoke") {
    return "bg-emerald-950 text-emerald-400";
  }
  if (tier === "exhaustive") {
    return "bg-purple-950 text-purple-300";
  }
  return "bg-cyan-950 text-cyan-300";
}

function statusBadgeClass(status: CaseRunStatus): string {
  if (status === "pass") {
    return "bg-emerald-950 text-emerald-400";
  }
  if (status === "fail") {
    return "bg-red-950 text-red-400";
  }
  if (status === "running") {
    return "bg-sky-950 text-sky-400";
  }
  if (status === "skip") {
    return "bg-zinc-800 text-zinc-500";
  }
  return "bg-zinc-800 text-zinc-500";
}

export function MonitorMatrixTool(props: Props) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ToolLogLine[]>([]);
  const [caseStatus, setCaseStatus] = useState<Record<string, CaseRunStatus>>({});
  const [summary, setSummary] = useState({ passed: 0, failed: 0, skipped: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const cases = useMemo(
    () => buildMatrixCases(props.options.tier),
    [props.options.tier],
  );

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
    setProgress(0);
    setLogs([]);
    setCaseStatus({});
    setSummary({ passed: 0, failed: 0, skipped: 0 });

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const result = await runMonitorMatrix({
        tier: props.options.tier,
        caseId: props.options.caseId,
        soakMs: props.options.soakMs,
        settleMs: props.options.settleMs,
        minPassRatio: props.options.minPassRatio,
        disabledMaxEvt: props.options.disabledMaxEvt,
        continueOnFail: props.options.continueOnFail,
        printFailSamples: props.options.printFailSamples,
        resumeFrom: props.options.resumeFrom,
        hello: props.feed.hello,
        uartOpen: props.feed.uartOpen,
        signal: ac.signal,
        onLog: appendLog,
        onProgress: setProgress,
        onCaseStatus: (caseId, status) => {
          setCaseStatus((prev) => ({ ...prev, [caseId]: status }));
        },
      });
      setSummary({ passed: result.passed, failed: result.failed, skipped: result.skipped });
      props.onSummary(result.passed, result.failed, result.skipped);
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e), "fail");
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [appendLog, props, running]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    appendLog("Stopped by user", "warn");
    setRunning(false);
  }, [appendLog]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="h-1 shrink-0 bg-zinc-800">
        <div
          className="h-full bg-sky-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <TRNTabs defaultValue="console" className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <TRNTabsList className="inline-flex gap-1 border border-zinc-800 bg-[#161b22] p-1">
            <TRNTabsTrigger value="console">Console</TRNTabsTrigger>
            <TRNTabsTrigger value="cases">Cases</TRNTabsTrigger>
            <TRNTabsTrigger value="summary">Summary</TRNTabsTrigger>
          </TRNTabsList>
          <div className="flex gap-2">
            <TRNButton variant="primary" size="sm" disabled={running || !props.feed.uartOpen} onClick={() => void onRun()}>
              Run
            </TRNButton>
            <TRNButton variant="secondary" size="sm" disabled={!running} onClick={onStop}>
              Stop
            </TRNButton>
          </div>
        </div>

        <TRNTabsContent value="console" className="flex min-h-0 flex-1 flex-col">
          <ToolConsole lines={logs} emptyHint="Run matrix to see console output…" />
        </TRNTabsContent>

        <TRNTabsContent value="cases" className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-500">
                <th className="px-2 py-1.5 text-left">ID</th>
                <th className="px-2 py-1.5 text-left">Tier</th>
                <th className="px-2 py-1.5 text-left">Active</th>
                <th className="px-2 py-1.5 text-left">Soak</th>
                <th className="px-2 py-1.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const status = caseStatus[c.id] ?? "idle";
                return (
                  <tr key={c.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                    <td className="px-2 py-1 font-mono text-zinc-300">{c.id}</td>
                    <td className="px-2 py-1">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tierBadgeClass(c.tiers[0] ?? "standard")}`}>
                        {c.tiers.join(",")}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-zinc-400">
                      {c.activeSensorIds.map((id) => UART_SENSOR_NAMES[id]).join(", ")}
                    </td>
                    <td className="px-2 py-1 text-zinc-500">{c.soakMs ?? props.options.soakMs}</td>
                    <td className="px-2 py-1">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass(status)}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TRNTabsContent>

        <TRNTabsContent value="summary" className="flex flex-col gap-3 p-1">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pass", value: summary.passed, className: "text-emerald-400" },
              { label: "Fail", value: summary.failed, className: "text-red-400" },
              { label: "Not run", value: summary.skipped, className: "text-zinc-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-center">
                <div className={`font-mono text-2xl font-bold ${s.className}`}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-400">
            Tier <strong className="text-zinc-200">{props.options.tier}</strong> · {cases.length} cases ·
            soak {props.options.soakMs}ms
          </div>
        </TRNTabsContent>
      </TRNTabs>
    </div>
  );
}
