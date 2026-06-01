import { ArrowDownToLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { isTelemetryDecodePipelineActive } from "../../bitstream-app/utils/bitstreamTelemetryTransport";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import {
  formatThroughputBps,
  type TelemetryRxBadgeVariant,
} from "./BitstreamTelemetryRxBadges";
import {
  BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS,
} from "./workspace-chrome-chip";

/** Wire RX throughput chip (broker main + priority lanes, ~1 s window). */
export function BitstreamWireRxThroughputChip(props: {
  variant?: TelemetryRxBadgeVariant;
}) {
  const variant = props.variant ?? "chip";
  const wire = useBitstreamConnectionStore((s) => s.serialRxWireStats);
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 400);
    return () => window.clearInterval(id);
  }, []);

  const visible = isTelemetryDecodePipelineActive(
    { connected, transportState, serialBridgeStatus },
    handshakeState,
  );

  const bps = useMemo(() => {
    if (wire == null) {
      return null;
    }
    const total = wire.bytesMainPerSec + wire.bytesPriorityPerSec;
    return Number.isFinite(total) ? Math.max(0, total) : null;
  }, [wire]);

  const statsStale =
    wire != null && nowMs - wire.updatedAtMs > Math.max(2000, wire.windowMs * 2);

  const toneClass =
    !visible || wire == null
      ? "text-zinc-500"
      : statsStale
        ? "text-rose-400"
        : bps != null && bps >= 512
          ? "text-emerald-400"
          : bps != null && bps >= 64
            ? "text-emerald-300/90"
            : bps != null && bps > 0
              ? "text-amber-400"
              : "text-zinc-500";

  const borderClass =
    !visible || wire == null
      ? "border-zinc-600/50 bg-white/4"
      : statsStale
        ? "border-rose-500/40 bg-rose-500/10"
        : bps != null && bps >= 64
          ? "border-emerald-500/35 bg-emerald-500/10"
          : bps != null && bps > 0
            ? "border-amber-500/35 bg-amber-500/10"
            : "border-zinc-600/50 bg-white/4";

  const label =
    !visible
      ? "RX …"
      : wire == null
        ? "RX …"
        : formatThroughputBps(bps ?? 0);

  const triggerAriaLabel = useMemo(() => {
    if (!visible) {
      return "Wire receive rate: hidden until link is ready.";
    }
    if (wire == null || bps == null) {
      return "Wire receive rate: waiting for broker window.";
    }
    return `Wire receive rate ${formatThroughputBps(bps)} (main + priority lanes). See tooltip.`;
  }, [bps, visible, wire]);

  const tooltip = (
    <div className="min-w-0 max-w-[280px] whitespace-pre-line text-left">
      <div className="font-semibold text-zinc-100">Wire RX throughput</div>
      <div className="text-zinc-300">
        Broker → webview estimated JSON size on{" "}
        <span className="font-mono">bitstream2/evt/sensor</span> (~{wire?.windowMs ?? 1000} ms
        window). Not raw UART <span className="font-mono">serialport/data</span> bytes.
      </div>
      {wire != null ? (
        <div className="mt-1 font-mono text-[11px] text-zinc-300">
          Main: {formatThroughputBps(wire.bytesMainPerSec)}
          {" · "}
          Priority: {formatThroughputBps(wire.bytesPriorityPerSec)}
          {"\n"}
          Total: {bps != null ? formatThroughputBps(bps) : "—"}
        </div>
      ) : null}
      <div className="mt-1 text-zinc-400">
        Compare with decode FPS: high wire rate with low FPS can mean decode or routing issues.
      </div>
    </div>
  );

  if (variant !== "chip") {
    return null;
  }

  if (!visible) {
    return null;
  }

  const chipSurfaceClass = `${BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS} ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS} ${borderClass} text-zinc-200/95 select-none`;

  return (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={650}
      disableHoverFx
      triggerWrapper="span"
      triggerClassName="!p-0 max-w-full"
      triggerAriaLabel={triggerAriaLabel}
      content={tooltip}
      trigger={
        <span className={chipSurfaceClass}>
          <ArrowDownToLine
            size={12}
            aria-hidden
            className={`${BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS} ${toneClass}`}
          />
          <span className={`min-w-0 truncate ${toneClass}`}>{label}</span>
        </span>
      }
    />
  );
}
