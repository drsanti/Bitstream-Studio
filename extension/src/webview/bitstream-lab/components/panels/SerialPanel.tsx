/*******************************************************************************
 * File Name : SerialPanel.tsx
 *
 * Description : List/open/close COM for BS2 UART via serialport bridge topics.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useMemo, useState } from "react";
import { TRNButton } from "../../../ui/TRN";
import { LAB_BAUD_OPTIONS } from "../../lib/labSerialDefaults";
import { JsonBlock } from "../shared/JsonBlock";
import { useLabWorkbenchShell } from "../../workbench/lab-workbench-context";

export function SerialPanel() {
  const { serial, telemetryMode, setTelemetryMode, health } = useLabWorkbenchShell();
  const [localBusy, setLocalBusy] = useState(false);
  const [showAdvancedSerial, setShowAdvancedSerial] = useState(false);
  const busy = localBusy || serial.serialBusy;
  const isOpen = serial.displayStatus?.isOpen === true;

  const isSimulatorMode = telemetryMode === "simulator";
  const shouldShowSerialControls = !isSimulatorMode || showAdvancedSerial;

  const simulatorHint = useMemo(() => {
    if (!isSimulatorMode) return null;
    if (health.loopbackOn) {
      return "Simulator mode: UART is not required. Loopback is active.";
    }
    return "Simulator mode selected, but loopback is off. Start loopback to receive mock BS2 samples.";
  }, [health.loopbackOn, isSimulatorMode]);

  const onList = useCallback(async () => {
    setLocalBusy(true);
    try
    {
      await serial.listPorts();
    }
    catch
    {
      /* logged to activity */
    }
    finally
    {
      setLocalBusy(false);
    }
  }, [serial]);

  const onOpen = useCallback(async () => {
    setLocalBusy(true);
    try
    {
      await serial.openSelectedPort();
    }
    catch
    {
      /* logged */
    }
    finally
    {
      setLocalBusy(false);
    }
  }, [serial]);

  const onClose = useCallback(async () => {
    setLocalBusy(true);
    try
    {
      await serial.closePort();
    }
    catch
    {
      /* logged */
    }
    finally
    {
      setLocalBusy(false);
    }
  }, [serial]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      {isSimulatorMode ? (
        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-zinc-200">Simulator mode</p>
              <p className={health.loopbackOn ? "text-[11px] text-emerald-300/90" : "text-[11px] text-amber-300/90"}>
                {simulatorHint}
              </p>
              {!health.loopbackOn ? (
                <p className="mt-1 text-[10px] text-zinc-500">
                  Run <code className="text-zinc-400">npm run start:bridge</code> and start the{" "}
                  <code className="text-zinc-400">bitstream-simulator</code> extension.
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <TRNButton type="button" size="compact" onClick={() => setTelemetryMode("uart")}>
                Switch to UART
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                disabled={!serial.isWsConnected}
                onClick={() => setShowAdvancedSerial((v) => !v)}
              >
                {showAdvancedSerial ? "Hide serial controls" : "Show serial controls"}
              </TRNButton>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <TRNButton
          type="button"
          size="compact"
          disabled={busy || !serial.isWsConnected || !shouldShowSerialControls}
          onClick={() => void onList()}
        >
          List ports
        </TRNButton>
        <label className="flex min-w-28 flex-1 items-center gap-1 text-[10px] text-zinc-500">
          <span className="shrink-0">Path</span>
          <input
            type="text"
            list="lab-serial-port-list"
            className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-200"
            value={serial.selectedPath}
            onChange={(e) => serial.setSelectedPath(e.target.value)}
            placeholder="COM3"
            spellCheck={false}
            disabled={!serial.isWsConnected || !shouldShowSerialControls}
          />
          <datalist id="lab-serial-port-list">
            {serial.ports.map((p) => (
              <option key={p.path} value={p.path}>
                {p.manufacturer ? `${p.path} — ${p.manufacturer}` : p.path}
              </option>
            ))}
          </datalist>
        </label>
        <label className="flex items-center gap-1 text-[10px] text-zinc-500">
          <span>Baud</span>
          <select
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-200"
            value={String(serial.baudRate)}
            onChange={(e) => serial.setBaudRate(Number(e.target.value))}
            disabled={!serial.isWsConnected || isOpen || !shouldShowSerialControls}
          >
            {LAB_BAUD_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <TRNButton
          type="button"
          size="compact"
          selected
          disabled={busy || !serial.isWsConnected || isOpen || !shouldShowSerialControls}
          onClick={() => void onOpen()}
        >
          Open
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          disabled={busy || !serial.isWsConnected || !isOpen || !shouldShowSerialControls}
          onClick={() => void onClose()}
        >
          Close
        </TRNButton>
      </div>
      {!serial.isWsConnected ? (
        <p className="text-[11px] text-amber-400/90">Connect WebSocket in the link bar before opening COM.</p>
      ) : null}
      <p className="text-[10px] text-zinc-600">
        {isSimulatorMode ? (
          <>
            Simulator: <code className="text-zinc-500">npm run dev:bitstream2-loopback</code>
          </>
        ) : (
          <>
            BS2 firmware: bridge without loopback · <code className="text-zinc-500">npm run start:bridge</code>
          </>
        )}
      </p>
      {serial.bridgeStillReportsOpen ? (
        <p className="text-[11px] text-amber-300/90">
          Bridge still reports COM open — UART may still be active. Stop{" "}
          <code className="text-amber-200/80">bitstream2:uart-probe</code> / other tools on this port, click Close
          again, or restart <code className="text-amber-200/80">npm run start:bridge</code>.
        </p>
      ) : null}
      <p className="text-[10px] uppercase tracking-wide text-zinc-600">
        serialport/status{" "}
        {isOpen ? (
          <span className="normal-case text-emerald-500/80">· live</span>
        ) : (
          <span className="normal-case text-zinc-500">· closed (Lab view)</span>
        )}
      </p>
      <div className="min-h-0 flex-1 overflow-auto">
        <JsonBlock value={serial.displayStatus} />
      </div>
    </div>
  );
}
