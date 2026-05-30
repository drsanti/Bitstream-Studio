import type { Bs2SensorMonitorFeed } from "./useBs2SensorMonitorFeed";

type Props = Pick<
  Bs2SensorMonitorFeed,
  | "isConnected"
  | "wsUrl"
  | "loopbackEnabled"
  | "uartOpen"
  | "sampleCount"
  | "serialStatus"
  | "firmwareLiveness"
  | "hello"
>;

export function MonitorLinkBar(props: Props) {
  const backend =
    props.loopbackEnabled && !props.uartOpen
      ? "Loopback simulator"
      : props.uartOpen
        ? "Bitstream"
        : props.loopbackEnabled
          ? "Loopback + UART"
          : "Bridge only";

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-800 pb-3">
      <h1 className="text-base font-semibold text-zinc-100">BS2 Sensor Control Monitor</h1>
      <span className={props.isConnected ? "text-emerald-400" : "text-red-400"}>
        WS {props.isConnected ? "connected" : "disconnected"}
      </span>
      <span className="text-zinc-400">{backend}</span>
      <span className="text-zinc-500" title="Broker WebSocket URL">
        {props.wsUrl}
      </span>
      <span className="text-zinc-400">Samples {props.sampleCount}</span>
      <span className="text-zinc-500">
        Serial{" "}
        {props.uartOpen
          ? `open · ${props.serialStatus?.baudRate ?? "?"} baud`
          : "closed"}
      </span>
      <span className="text-zinc-500">
        FW {props.firmwareLiveness?.state ?? props.hello?.fwTag ?? "—"}
      </span>
    </header>
  );
}
