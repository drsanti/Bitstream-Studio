import { TRNButton } from "../../ui/TRN/index.js";

export type ConnectionUartAllowStripProps = {
  nextLinkPick: string | null;
  portCount: number;
  comOpen: boolean;
  openComPath: string | null;
  onOpenAllowedPort: () => void;
  onSwitchToAllowedPort?: () => void;
};

/**
 * Compact Allow / Next Link port preview for Connection panel step 4 (UART).
 */
export function ConnectionUartAllowStrip(props: ConnectionUartAllowStripProps) {
  const {
    nextLinkPick,
    portCount,
    comOpen,
    openComPath,
    onOpenAllowedPort,
    onSwitchToAllowedPort,
  } = props;

  const comMismatch =
    comOpen &&
    openComPath != null &&
    openComPath.length > 0 &&
    nextLinkPick != null &&
    openComPath !== nextLinkPick;

  return (
    <div className="space-y-1.5 rounded border border-zinc-700/55 bg-zinc-950/35 px-2 py-1.5 text-[11px]">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-zinc-500">Next Link port</span>
        <span className="font-mono font-semibold text-cyan-200/95">
          {nextLinkPick ?? (portCount > 0 ? "— (none allowed)" : "refresh list")}
        </span>
      </div>

      {comMismatch ? (
        <div className="flex flex-wrap items-center gap-2 rounded border border-amber-500/35 bg-amber-950/25 px-2 py-1 text-amber-100/95">
          <span>
            Open <span className="font-mono font-semibold">{openComPath}</span> is not allowed (
            <span className="font-mono font-semibold">{nextLinkPick}</span>).
          </span>
          {onSwitchToAllowedPort != null ? (
            <TRNButton
              size="compact"
              className="h-6 border-amber-600/50 bg-amber-950/40 text-[10px] text-amber-50 hover:bg-amber-900/40"
              onClick={onSwitchToAllowedPort}
            >
              Switch to {nextLinkPick}
            </TRNButton>
          ) : null}
        </div>
      ) : null}

      {nextLinkPick != null && !comOpen ? (
        <TRNButton size="compact" onClick={onOpenAllowedPort}>
          Open {nextLinkPick}
        </TRNButton>
      ) : null}
    </div>
  );
}
