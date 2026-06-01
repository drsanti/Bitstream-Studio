import { Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { useBitstreamTransportActions } from "../../bitstream-app/context/bitstreamTransportActions.context";
import { BitstreamSensorSampleRxBadge } from "./BitstreamTelemetryRxBadges";
import { useLinkLifecycleBarInputs } from "../hooks/useLinkLifecycleBarInputs";
import { useLinkLifecycleHeaderStatus } from "./LinkLifecycleStrip";
import { isLinkLifecycleReady } from "./link-lifecycle-model";
import { LinkLifecycleStrip } from "./LinkLifecycleStrip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import {
  BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS,
} from "./workspace-chrome-chip";

export type WorkspaceChromeBarProps = {
  title: string;
  actions: ReactNode;
  borderColor?: string;
};

/**
 * Merged workspace header: title, center (lifecycle strip or FPS), and actions on one row.
 */
export function WorkspaceChromeBar(props: WorkspaceChromeBarProps) {
  const { title, actions, borderColor } = props;
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
          <div className="shrink-0 text-sm font-semibold text-zinc-100">{title}</div>
          {linkReady ? (
            <TRNTooltip
              content="UART, broker, handshake, and sensor config are ready."
              placement="bottom-start"
              openDelayMs={TRN_HINT_HOVER_DELAY_MS}
              disableHoverFx
              triggerWrapper="span"
              triggerAriaLabel="Link ready"
              triggerClassName="!p-0"
              trigger={
                <button
                  type="button"
                  className={`${BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS} border-emerald-400/35 bg-emerald-500/15 ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS} text-emerald-100/95 hover:brightness-110`}
                  onClick={() => lifecycleInputs.onOpenConnection?.()}
                >
                  <Link2
                    size={12}
                    aria-hidden
                    className={`${BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS} text-emerald-200/95`}
                  />
                  <span className="shrink-0">Link ready</span>
                </button>
              }
            />
          ) : null}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden px-1">
          {linkReady ? (
            <BitstreamSensorSampleRxBadge
              variant="chip"
              chipMetric="aggregateFps"
              onReconnectTelemetry={reconnectTelemetry}
            />
          ) : (
            <LinkLifecycleStrip
              {...lifecycleInputs}
              wrapPills={false}
              showStatusText={false}
              showConnectionButton={false}
              className="flex min-w-0 w-full flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide"
            />
          )}
        </div>

        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 overflow-x-auto scrollbar-hide">
          {actions}
        </div>
      </div>
    </header>
  );
}
