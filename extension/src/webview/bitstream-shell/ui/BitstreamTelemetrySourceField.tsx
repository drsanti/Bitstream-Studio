import { Cpu, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  BITSTREAM_TELEMETRY_SOURCE_LABELS,
  useBitstreamTelemetrySourceStore,
  type BitstreamTelemetryBackend,
} from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import {
  SHELL_CONTROL_DECK_ZONE_CLASS,
  SHELL_DECK_PILL_ACTIVE_BASE_CLASS,
  SHELL_DECK_PILL_INACTIVE_CLASS,
  SHELL_DECK_PILL_LABEL_CLASS,
} from "./shell-control-deck-ui";
import {
  SHELL_DECK_PILL_HOVER,
  SHELL_DECK_PILL_INTERACTIVE_CLASS,
} from "./shell-deck-pill-hover";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";

type SourceSegment = {
  id: BitstreamTelemetryBackend;
  label: string;
  Icon: LucideIcon;
  activeSurfaceClass: string;
  activeIconClass: string;
};

const SOURCE_SEGMENTS: readonly SourceSegment[] = [
  {
    id: "uart",
    label: BITSTREAM_TELEMETRY_SOURCE_LABELS.uart,
    Icon: Cpu,
    activeSurfaceClass:
      "border-sky-500/45 bg-sky-500/15 text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    activeIconClass: "text-sky-300",
  },
  {
    id: "simulator",
    label: BITSTREAM_TELEMETRY_SOURCE_LABELS.simulator,
    Icon: FlaskConical,
    activeSurfaceClass:
      "border-violet-500/45 bg-violet-500/15 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    activeIconClass: "text-violet-300",
  },
];

function sourceHint(
  segmentId: BitstreamTelemetryBackend,
  loopbackAvailable: boolean,
): string {
  if (segmentId === "simulator") {
    return loopbackAvailable
      ? "Simulator — synthetic BS2 via bitstream-simulator; USB serial stays closed. Applies to both workspaces."
      : "Simulator — start the bitstream-simulator extension and bridge (npm run start:bridge). Applies to both workspaces.";
  }
  return "Hardware — live MCU on USB (BS2 UART). Simulator stays idle. Applies to both workspaces.";
}

/** Data source segmented control — Hardware (UART) vs Simulator. */
export function BitstreamTelemetrySourceField() {
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const loopbackAvailable = useBitstreamTelemetrySourceStore((s) => s.loopbackAvailable);
  const setBackend = useBitstreamTelemetrySourceStore((s) => s.setBackend);

  return (
    <div className={SHELL_CONTROL_DECK_ZONE_CLASS} role="group" aria-label="Data source">
      {SOURCE_SEGMENTS.map((segment) => {
        const active = backend === segment.id;
        const { Icon } = segment;
        const simOffline = segment.id === "simulator" && !loopbackAvailable;
        const hoverClass =
          segment.id === "uart"
            ? SHELL_DECK_PILL_HOVER.sourceHardware
            : simOffline
              ? SHELL_DECK_PILL_HOVER.sourceSimulatorOffline
              : SHELL_DECK_PILL_HOVER.sourceSimulator;
        const iconClass = active
          ? simOffline && segment.id === "simulator"
            ? "text-amber-300"
            : segment.activeIconClass
          : "text-zinc-500 opacity-85";
        const trigger = (
          <button
            type="button"
            aria-pressed={active}
            className={`${SHELL_DECK_PILL_INTERACTIVE_CLASS} ${hoverClass} ${
              active
                ? `${SHELL_DECK_PILL_ACTIVE_BASE_CLASS} ${segment.activeSurfaceClass}`
                : SHELL_DECK_PILL_INACTIVE_CLASS
            }`}
            onClick={() => {
              if (!active) {
                setBackend(segment.id);
              }
            }}
          >
            <Icon className={`size-3.5 shrink-0 ${iconClass}`} strokeWidth={2.25} aria-hidden />
            <span className={SHELL_DECK_PILL_LABEL_CLASS}>{segment.label}</span>
          </button>
        );

        return (
          <TRNTooltip
            key={segment.id}
            content={sourceHint(segment.id, loopbackAvailable)}
            placement="bottom-start"
            openDelayMs={TRN_HINT_HOVER_DELAY_MS}
            disableHoverFx
            triggerWrapper="span"
            triggerClassName="!p-0"
            triggerAriaLabel={segment.label}
            trigger={trigger}
          />
        );
      })}
    </div>
  );
}
