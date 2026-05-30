import { useCallback, useState, type ReactNode } from "react";
import { useWsClientStore } from "../ws-client-store";
import { useSerialPortStore } from "../serialport/serial-port-store";
import { SENSOR_TEST_IDS, SENSOR_TEST_LABEL } from "../shared/sensorTestShared";
import { TRNButton } from "../ui/TRN";

type Props = {
  isConnected: boolean;
  loopbackEnabled: boolean;
  uartOpen: boolean;
  sampleCount: number;
  activeSensorId: number;
  windowMs: number;
  onActiveSensorIdChange: (id: number) => void;
  onWindowMsChange: (ms: number) => void;
  onQuietBus: () => void;
  onRoundtrip: () => void;
  busy?: boolean;
  showSensorActions?: boolean;
  toolConfigSection?: ReactNode;
  commandPreview?: string;
};

export function MonitorSidebar(props: Props) {
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const setWsUrl = useWsClientStore((s) => s.setWsUrl);
  const connect = useWsClientStore((s) => s.connect);
  const selectedPath = useSerialPortStore((s) => s.selectedPath);
  const setSelectedPath = useSerialPortStore((s) => s.setSelectedPath);
  const baudRate = useSerialPortStore((s) => s.baudRate);
  const setBaudRate = useSerialPortStore((s) => s.setBaudRate);
  const openPort = useSerialPortStore((s) => s.openPort);
  const closePort = useSerialPortStore((s) => s.closePort);
  const serialConnect = useSerialPortStore((s) => s.connect);

  const [serialBusy, setSerialBusy] = useState(false);
  const showControl = props.showSensorActions !== false;

  const onReconnectWs = useCallback(async () => {
    await connect();
  }, [connect]);

  const onOpenSerial = useCallback(async () => {
    setSerialBusy(true);
    try {
      await serialConnect();
      await openPort({ path: selectedPath || "COM3", baudRate: baudRate || 921600 });
    } finally {
      setSerialBusy(false);
    }
  }, [baudRate, openPort, selectedPath, serialConnect]);

  const onCloseSerial = useCallback(async () => {
    setSerialBusy(true);
    try {
      await closePort();
    } finally {
      setSerialBusy(false);
    }
  }, [closePort]);

  const connDotClass = props.isConnected
    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
    : "bg-zinc-600";

  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-900/50">
      <section className="border-b border-zinc-800 p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Connection</div>
        <div className="mb-3 flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${connDotClass}`} />
          <span className="text-xs text-zinc-400">
            {props.isConnected ? "WebSocket connected" : "WebSocket disconnected"}
          </span>
        </div>
        <label className="mb-1 block text-[11px] text-zinc-500">WS URL</label>
        <input
          className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
        />
        <TRNButton variant="secondary" size="sm" className="w-full" onClick={() => void onReconnectWs()}>
          Reconnect WS
        </TRNButton>
        <div className="mt-2 text-[10px] text-zinc-500">
          Loopback {props.loopbackEnabled ? "on" : "off"} · Samples {props.sampleCount}
        </div>
      </section>

      <section className="border-b border-zinc-800 p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Serial (UART)</div>
        <label className="mb-1 block text-[11px] text-zinc-500">COM port</label>
        <input
          className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
          placeholder="COM3"
        />
        <label className="mb-1 block text-[11px] text-zinc-500">Baud</label>
        <select
          className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
          value={String(baudRate)}
          onChange={(e) => setBaudRate(Number(e.target.value))}
        >
          <option value="921600">921600</option>
          <option value="460800">460800</option>
          <option value="115200">115200</option>
        </select>
        <div className="flex gap-2">
          <TRNButton
            variant="primary"
            size="sm"
            className="flex-1"
            disabled={serialBusy || !props.isConnected}
            onClick={() => void onOpenSerial()}
          >
            Open
          </TRNButton>
          <TRNButton
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={serialBusy || !props.uartOpen}
            onClick={() => void onCloseSerial()}
          >
            Close
          </TRNButton>
        </div>
        <div className="mt-2 text-[10px] text-zinc-500">
          Serial {props.uartOpen ? `open · ${baudRate} baud` : "closed"}
        </div>
      </section>

      {props.toolConfigSection != null && (
        <section className="border-b border-zinc-800 p-3">{props.toolConfigSection}</section>
      )}

      {props.commandPreview != null && props.commandPreview !== "" && (
        <section className="border-b border-zinc-800 p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Command preview
          </div>
          <div className="break-all rounded border border-zinc-800 bg-[#0d1117] p-2 font-mono text-[10px] leading-relaxed text-emerald-400">
            {props.commandPreview}
          </div>
        </section>
      )}

      {showControl && (
        <>
          <section className="border-b border-zinc-800 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active sensor</div>
            <div className="grid grid-cols-2 gap-1.5">
              {SENSOR_TEST_IDS.map((id) => (
                <TRNButton
                  key={id}
                  variant={id === props.activeSensorId ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => props.onActiveSensorIdChange(id)}
                >
                  {SENSOR_TEST_LABEL[id]}
                </TRNButton>
              ))}
            </div>
          </section>

          <section className="border-b border-zinc-800 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Hz window</div>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
              type="number"
              min={500}
              max={30000}
              step={500}
              value={props.windowMs}
              onChange={(e) =>
                props.onWindowMsChange(
                  Math.max(500, Math.min(30000, Math.round(Number(e.target.value) || 3000))),
                )
              }
            />
          </section>

          <section className="p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Actions</div>
            <div className="flex flex-col gap-2">
              <TRNButton variant="secondary" size="sm" disabled={props.busy} onClick={props.onQuietBus}>
                Quiet bus
              </TRNButton>
              <TRNButton variant="secondary" size="sm" disabled={props.busy} onClick={props.onRoundtrip}>
                Round-trip SET/GET
              </TRNButton>
            </div>
          </section>
        </>
      )}
    </aside>
  );
}
