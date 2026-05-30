/*******************************************************************************
 * File Name : LabLinkBar.tsx
 *
 * Description : WS URL, connect controls, and layout reset for Bitstream Lab.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { TRNButton, TRNSegmentedControl } from "../../ui/TRN";
import { useLabWorkbenchShell } from "../workbench/lab-workbench-context";
import { SensorConfigDialog } from "./SensorConfigDialog";

export function LabLinkBar() {
  const { session, onResetLayout, telemetryMode, setTelemetryMode, health } = useLabWorkbenchShell();
  const [busy, setBusy] = useState(false);
  const [sensorSetupOpen, setSensorSetupOpen] = useState(false);

  const options = useMemo(
    () => [
      { value: "uart", label: "UART" },
      { value: "simulator", label: "Simulator" },
    ],
    [],
  );

  const onConnect = useCallback(async () => {
    setBusy(true);
    try
    {
      await session.connect();
    }
    catch
    {
      /* session.lastError */
    }
    finally
    {
      setBusy(false);
    }
  }, [session]);

  const onDisconnect = useCallback(async () => {
    setBusy(true);
    try
    {
      await session.disconnect();
    }
    finally
    {
      setBusy(false);
    }
  }, [session]);

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-800 px-3 py-2">
      <h1 className="mr-2 text-sm font-semibold text-zinc-100">Bitstream Lab</h1>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="hidden shrink-0 sm:inline">Telemetry</span>
        <TRNSegmentedControl
          value={telemetryMode}
          onValueChange={(v) => {
            if (v === "uart" || v === "simulator") {
              setTelemetryMode(v);
            }
          }}
          options={options}
          size="sm"
          variant="outline"
          ariaLabel="Telemetry mode"
          showFocusRing
        />
        {!health.loopbackOn && telemetryMode === "simulator" ? (
          <span className="text-[10px] text-amber-400">
            Loopback is off (start <code className="text-amber-300">bitstream-simulator</code> extension)
          </span>
        ) : null}
      </div>
      <label className="flex min-w-48 flex-1 items-center gap-2 text-xs text-zinc-400">
        <span className="shrink-0">WS</span>
        <input
          type="text"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-200"
          value={session.wsUrl}
          onChange={(e) => session.setWsUrl(e.target.value)}
          spellCheck={false}
        />
      </label>
      <TRNButton
        type="button"
        size="compact"
        selected
        disabled={busy || session.isConnected}
        onClick={() => void onConnect()}
      >
        Connect
      </TRNButton>
      <TRNButton
        type="button"
        size="compact"
        disabled={busy || !session.isConnected}
        onClick={() => setSensorSetupOpen(true)}
        prefixIcon={<SlidersHorizontal className="size-3.5" aria-hidden />}
      >
        Sensors
      </TRNButton>
      <TRNButton
        type="button"
        size="compact"
        disabled={busy || !session.isConnected}
        onClick={() => void onDisconnect()}
      >
        Disconnect
      </TRNButton>
      <TRNButton type="button" size="compact" onClick={onResetLayout}>
        Reset layout
      </TRNButton>
      <span className="font-mono text-[10px] text-zinc-500">
        RX {(session.wsBytesReceived / 1024).toFixed(1)} KiB · TX {(session.wsBytesSent / 1024).toFixed(1)} KiB
      </span>
      {session.lastError ? (
        <span className="text-xs text-amber-400">{session.lastError}</span>
      ) : null}
      <span className="w-full text-[10px] text-zinc-600 sm:w-auto">
        Legacy note: standalone <code className="text-zinc-500">dev:bitstream-lab</code> entry was removed
        (2026-05-28). This module is archived until its tools move into the Sensor Lab workspace.
      </span>
      <SensorConfigDialog open={sensorSetupOpen} onClose={() => setSensorSetupOpen(false)} />
    </header>
  );
}
