import { useCallback, useState } from "react";
import { Play, Square } from "lucide-react";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import { useSerialPortStore } from "../../../serialport/serial-port-store";
import { SerialDataViewer } from "../../../ui/components";
import { TRNGlassButton } from "../../../ui/TRN/TRNGlassButton";
import { useSerialMonitor } from "../hooks/useSerialMonitor";
import { useSerialMonitorStore } from "../store";

/** If true, outline rows and slots for layout debugging. */
const DEBUG_MODE = false;

const debugRing = DEBUG_MODE ? "ring-2 ring-lime-500/20 ring-inset" : "";

const toolbarGlassBtnClass =
  "justify-start gap-1.5 [&_svg]:!h-3.5 [&_svg]:!w-3.5";

export function SerialMonitorPanel() {
  const lines = useSerialMonitorStore((s) => s.lines);
  const autoScroll = useSerialMonitorStore((s) => s.autoScroll);
  const setAutoScroll = useSerialMonitorStore((s) => s.setAutoScroll);
  const clearLines = useSerialMonitorStore((s) => s.clearLines);
  const receivingEnabled = useSerialMonitorStore((s) => s.receivingEnabled);
  const setReceivingEnabled = useSerialMonitorStore(
    (s) => s.setReceivingEnabled,
  );

  const [sendText, setSendText] = useState("");
  const [startBusy, setStartBusy] = useState(false);

  const {
    connectionState,
    isConnected,
    status,
    selectedPath,
    baudRate,
    write,
    connect,
    listPorts,
    openPort,
    setSelectedPath,
  } = useSerialMonitor();

  const canSend = Boolean(isConnected && status?.isOpen);

  const handleSend = useCallback(async () => {
    if (!sendText.trim() || !canSend) {
      return;
    }
    try {
      await write(sendText);
      setSendText("");
    } catch (e) {
      console.error("[SerialMonitor] write:", e);
    }
  }, [write, sendText, canSend]);

  const handleStop = useCallback(() => {
    setReceivingEnabled(false);
  }, [setReceivingEnabled]);

  const handleStart = useCallback(async () => {
    if (receivingEnabled) {
      return;
    }
    setStartBusy(true);
    try {
      if (!isConnected) {
        await connect();
      }
      const portOpen = useSerialPortStore.getState().status?.isOpen === true;
      if (!portOpen) {
        let path = selectedPath.trim();
        if (!path) {
          const list = await listPorts();
          if (list.length > 0) {
            path = list[0]!.path;
            setSelectedPath(path);
          }
        }
        if (!path) {
          toast.warning(
            "No serial port selected. List ports in Serial Port Manager or connect the bridge.",
          );
          return;
        }
        await openPort({
          path,
          baudRate,
          mode: "line",
          readlineDelimiter: "\n",
        });
      }
      setReceivingEnabled(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[SerialMonitor] Start:", e);
      toast.error(`Start failed: ${msg}`);
    } finally {
      setStartBusy(false);
    }
  }, [
    receivingEnabled,
    isConnected,
    connect,
    selectedPath,
    baudRate,
    listPorts,
    openPort,
    setSelectedPath,
    setReceivingEnabled,
  ]);

  const statusLabel = (() => {
    const ws = `WS: ${connectionState}`;
    if (!status?.isOpen) {
      return `${ws} · Port: closed`;
    }
    const path = status.path ?? selectedPath ?? "?";
    const recv = receivingEnabled ? "receiving on" : "receiving paused";
    return `${ws} · Port: ${path} @ ${status.baudRate ?? baudRate} · ${recv}`;
  })();

  return (
    <div
      className={twMerge(
        "flex min-h-0 flex-1 flex-col gap-1 rounded-md p-1",
        debugRing,
      )}
      data-serial-monitor="panel"
    >
      <div
        className={twMerge(
          "flex shrink-0 flex-col gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-zinc-300 backdrop-blur-sm",
          debugRing,
        )}
        data-serial-monitor-row="toolbar"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-400">Serial</span>
          <span className="min-w-0 flex-1 truncate text-zinc-400/90">
            {statusLabel}
          </span>
          <TRNGlassButton
            type="button"
            tone="success"
            trnSize="compact"
            disabled={receivingEnabled || startBusy}
            className={toolbarGlassBtnClass}
            aria-label="Start receiving serial data"
            onClick={() => void handleStart()}
            icon={<Play className="shrink-0 opacity-90" aria-hidden />}
          >
            Start
          </TRNGlassButton>
          <TRNGlassButton
            type="button"
            tone="neutral"
            trnSize="compact"
            disabled={!receivingEnabled}
            className={toolbarGlassBtnClass}
            aria-label="Stop receiving serial data (port stays open)"
            onClick={handleStop}
            icon={<Square className="shrink-0 opacity-90" aria-hidden />}
          >
            Stop
          </TRNGlassButton>
        </div>
      </div>

      <div
        className={twMerge(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          debugRing,
        )}
        data-serial-monitor-row="log"
      >
        <SerialDataViewer
          lines={lines}
          autoScroll={autoScroll}
          onAutoScrollChange={setAutoScroll}
          onClear={() => clearLines()}
          onCopySuccess={() => toast.success("Log copied to clipboard")}
          onCopyError={(message) => toast.error(`Copy failed: ${message}`)}
        />
      </div>

      <div
        className={twMerge("flex shrink-0 items-stretch gap-2", debugRing)}
        data-serial-monitor-row="send"
      >
        <input
          type="text"
          value={sendText}
          onChange={(e) => setSendText(e.target.value)}
          placeholder="Outgoing data (sent as UTF-8)"
          disabled={!canSend}
          onKeyDown={(e) => e.key === "Enter" && void handleSend()}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 font-mono text-xs text-zinc-200 placeholder:text-zinc-500 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Serial send buffer"
        />
        <TRNGlassButton
          type="button"
          tone="info"
          trnSize="default"
          disabled={!canSend || !sendText.trim()}
          onClick={() => void handleSend()}
        >
          Send
        </TRNGlassButton>
      </div>
    </div>
  );
}
