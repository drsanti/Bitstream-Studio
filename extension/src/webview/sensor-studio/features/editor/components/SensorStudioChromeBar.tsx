import { useBitstreamTransportActions } from "../../../../bitstream-app/context/bitstreamTransportActions.context";
import { BitstreamSensorSampleRxBadge } from "../../../../bitstream-shell/ui/BitstreamTelemetryRxBadges";
import { useLinkLifecycleBarInputs } from "../../../../bitstream-shell/hooks/useLinkLifecycleBarInputs";
import { useLinkLifecycleHeaderStatus } from "../../../../bitstream-shell/ui/LinkLifecycleStrip";
import { isLinkLifecycleReady } from "../../../../bitstream-shell/ui/link-lifecycle-model";
import { LinkLifecycleStrip } from "../../../../bitstream-shell/ui/LinkLifecycleStrip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../../../ui/TRN/TRNTooltip";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { StudioToolbarActions, type StudioToolbarActionsProps } from "./StudioToolbarActions";

export type SensorStudioChromeBarProps = StudioToolbarActionsProps & {
  borderColor?: string;
};

/**
 * Merged Sensor Studio header: studio actions + telemetry FPS + link lifecycle
 * (replaces separate `BitstreamBootLifecycleBar` + `StudioToolbar` in Sensor Studio mode).
 */
export function SensorStudioChromeBar(props: SensorStudioChromeBarProps) {
  const { borderColor, ...actionsProps } = props;
  const lifecycleInputs = useLinkLifecycleBarInputs();
  const headerStatus = useLinkLifecycleHeaderStatus(lifecycleInputs);
  const linkReady = isLinkLifecycleReady(headerStatus);
  const { reconnectTelemetry } = useBitstreamTransportActions();

  return (
    <header
      className="z-20 flex shrink-0 flex-col border-b border-white/10 bg-black/70 backdrop-blur-md"
      style={borderColor != null ? { borderColor } : undefined}
    >
      <div className="flex min-h-[42px] flex-nowrap items-center gap-2 px-3 py-1.5">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <div className="shrink-0 text-sm font-semibold text-zinc-100">Sensor Studio</div>
          {linkReady ? (
            <TRNTooltip
              content="UART, broker, handshake, and sensor config are ready."
              side="bottom"
              delayMs={TRN_HINT_HOVER_DELAY_MS}
            >
              <button
                type="button"
                className="flex min-w-0 items-center gap-1 rounded-md border border-emerald-400/35 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-emerald-100/95 hover:brightness-110"
                onClick={() => lifecycleInputs.onOpenConnection?.()}
              >
                Link ready
              </button>
            </TRNTooltip>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center px-2">
          <BitstreamSensorSampleRxBadge
            variant="chip"
            chipMetric="aggregateFps"
            onReconnectTelemetry={reconnectTelemetry}
          />
        </div>

        <StudioToolbarActions {...actionsProps} />
      </div>

      {!linkReady ? (
        <div className="border-t border-white/5 px-2 py-1">
          <LinkLifecycleStrip
            {...lifecycleInputs}
            className="flex min-w-0 w-full flex-wrap items-center gap-x-2 gap-y-1"
          />
        </div>
      ) : null}
    </header>
  );
}
