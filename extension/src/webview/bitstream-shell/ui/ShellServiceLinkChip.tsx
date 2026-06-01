import { Plug, RefreshCcw, Unplug } from "lucide-react";
import { SHELL_SERVICE_LINK_CHIP_CLASS } from "./shell-control-deck-ui";
import {
  SHELL_DECK_PILL_HOVER,
  SHELL_DECK_PILL_INTERACTIVE_CLASS,
} from "./shell-deck-pill-hover";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";

export type ShellServiceLinkChipProps = {
  linkConnected: boolean;
  linkConnecting: boolean;
  sourceIsUart: boolean;
  linkStatusLabel: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

/**
 * Broker/session control for the shell deck — labeled chip (not icon-only).
 */
export function ShellServiceLinkChip(props: ShellServiceLinkChipProps) {
  const {
    linkConnected,
    linkConnecting,
    sourceIsUart,
    linkStatusLabel,
    onConnect,
    onDisconnect,
  } = props;

  const actionLabel = linkConnecting
    ? "Connecting…"
    : linkConnected
      ? "Disconnect"
      : "Connect";

  const surfaceClass = linkConnecting
    ? "border-amber-700/55 bg-amber-950/25 text-amber-100/95 hover:bg-amber-900/20"
    : linkConnected
      ? "border-rose-700/55 bg-rose-950/20 text-rose-100/95 hover:bg-rose-900/15"
      : "border-emerald-700/55 bg-emerald-950/15 text-emerald-100/95 hover:bg-emerald-900/15";

  const Icon = linkConnecting ? RefreshCcw : linkConnected ? Unplug : Plug;
  const iconClass = linkConnecting
    ? "text-amber-300"
    : linkConnected
      ? "text-rose-300"
      : "text-emerald-300";

  const hoverClass = linkConnecting
    ? SHELL_DECK_PILL_HOVER.serviceConnecting
    : linkConnected
      ? SHELL_DECK_PILL_HOVER.serviceDisconnect
      : SHELL_DECK_PILL_HOVER.serviceConnect;

  const trigger = (
    <button
      type="button"
      aria-pressed={linkConnected || linkConnecting}
      disabled={linkConnected || linkConnecting ? !onDisconnect : !onConnect}
      className={`${SHELL_DECK_PILL_INTERACTIVE_CLASS} ${hoverClass} ${SHELL_SERVICE_LINK_CHIP_CLASS} disabled:cursor-not-allowed disabled:opacity-50 ${surfaceClass}`}
      onClick={() => {
        if (linkConnected || linkConnecting) {
          onDisconnect?.();
        } else {
          onConnect?.();
        }
      }}
    >
      <Icon
        className={`size-3.5 shrink-0 ${iconClass}${linkConnecting ? " animate-spin" : ""}`}
        strokeWidth={2.25}
        aria-hidden
      />
      <span className="truncate">{actionLabel}</span>
    </button>
  );

  return (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={650}
      disableHoverFx
      triggerWrapper="span"
      triggerClassName="!p-0"
      triggerAriaLabel={`Service — ${linkStatusLabel}`}
      content={
        <div className="min-w-0 max-w-xs whitespace-pre-line text-left">
          <div className="font-semibold text-zinc-100">Service connection</div>
          <div className="text-zinc-300">Status: {linkStatusLabel}</div>
          {linkConnected ? (
            <div className="mt-1 text-zinc-400">
              Linked to the TESAIoT broker on this computer. Telemetry and settings can flow
              between this app and your data source.
            </div>
          ) : (
            <div className="mt-1 text-zinc-400">
              Connect to start. Run the project bridge if the service stays offline (
              <span className="font-mono text-[10px]">npm run start:bridge</span>).
            </div>
          )}
          <div className="mt-1 text-zinc-500">
            {sourceIsUart
              ? linkConnected
                ? "Hardware mode: disconnect releases USB when the port was opened. Board setup continues after connect."
                : "Hardware mode: plug in the MCU via USB, then Connect."
              : linkConnected
                ? "Simulator mode: synthetic BS2 stream — no USB cable."
                : "Simulator mode: start the bitstream-simulator extension, then Connect."}
          </div>
        </div>
      }
      trigger={trigger}
    />
  );
}
