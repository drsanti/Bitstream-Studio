import type { Bitstream2SimulatorFeed } from "../hooks/useBitstream2SimulatorFeed";

type Props = Pick<
  Bitstream2SimulatorFeed,
  "isConnected" | "devStatus" | "sampleCount" | "serialStatus" | "firmwareLiveness" | "lastError"
>;

export function SimLinkBar(props: Props) {
  const loopback = props.devStatus?.loopbackEnabled === true;
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-zinc-800 pb-3 text-sm">
      <h1 className="text-base font-semibold text-zinc-100">BS Firmware Simulator</h1>
      <span className={props.isConnected ? "text-emerald-400" : "text-red-400"}>
        WS {props.isConnected ? "connected" : "disconnected"}
      </span>
      <span className={loopback ? "text-emerald-400/90" : "text-amber-400"}>
        Loopback {loopback ? "on" : "off"}
      </span>
      <span
        className="text-zinc-400"
        title="Total EVT_SENSOR events received (all applied streams)"
      >
        Samples {props.sampleCount}
      </span>
      <span className="text-zinc-500">
        Serial{" "}
        {props.serialStatus?.isOpen
          ? `open · ${props.serialStatus.baudRate ?? "?"} baud`
          : "closed (WS sim OK)"}
      </span>
      <span className="text-zinc-500">
        Firmware {props.firmwareLiveness?.state ?? "unknown"}
      </span>
      {props.lastError ? (
        <span className="text-amber-400">Error: {props.lastError}</span>
      ) : null}
    </header>
  );
}
