import { useCallback, useState } from "react";
import { TRNButton } from "../ui/TRN";
import { ToolConsole } from "./ToolConsole";
import { runMonitorMockProbe } from "./tools/monitorMockProbeInApp";
import type { ToolLogLine } from "./tools/monitorToolTypes";

export function MonitorMockProbeTool() {
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<ToolLogLine[]>([]);

  const appendLog = useCallback((text: string, tone: ToolLogLine["tone"]) => {
    setLogs((prev) => [
      ...prev.slice(-399),
      { id: `${Date.now()}-${prev.length}`, atMs: Date.now(), text, tone },
    ]);
  }, []);

  const onRun = useCallback(async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setLogs([]);
    try {
      await runMonitorMockProbe(appendLog);
    } finally {
      setBusy(false);
    }
  }, [appendLog, busy]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
        In-browser only: <span className="font-mono text-zinc-200">BsMockFirmware</span> +{" "}
        <span className="font-mono text-zinc-200">BsSession</span> (no WebSocket). Same smoke as{" "}
        <span className="font-mono text-emerald-400/90">npm run bitstream2:mock-probe</span>.
      </div>
      <div className="flex shrink-0">
        <TRNButton variant="primary" size="sm" disabled={busy} onClick={() => void onRun()}>
          Run mock probe
        </TRNButton>
      </div>
      <ToolConsole lines={logs} emptyHint="HELLO → PING → BMI270 sample…" />
    </div>
  );
}
