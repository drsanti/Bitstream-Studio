import "./shell-control-deck.css";
import { Play } from "lucide-react";
import { ensureBitstreamSimulatorReady } from "../../bitstream-app/bridge/requestBitstreamSimulatorHost";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import { useCallback, useState } from "react";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { BitstreamTelemetrySourceField } from "./BitstreamTelemetrySourceField";
import { BitstreamWorkspaceSwitcher } from "./BitstreamWorkspaceSwitcher";
import { ShellControlDeckZone } from "./ShellControlDeckZone";
import { ShellServiceLinkChip, type ShellServiceLinkChipProps } from "./ShellServiceLinkChip";
import {
  SHELL_CONTROL_DECK_CLASS,
  SHELL_CONTROL_DECK_DIVIDER_CLASS,
} from "./shell-control-deck-ui";

export type ShellControlDeckProps = Pick<
  ShellServiceLinkChipProps,
  | "linkConnected"
  | "linkConnecting"
  | "sourceIsUart"
  | "linkStatusLabel"
  | "onConnect"
  | "onDisconnect"
>;

/**
 * Center toolbar deck: workspace (what) · data source (how) · service (connect).
 */
export function ShellControlDeck(props: ShellControlDeckProps) {
  const {
    linkConnected,
    linkConnecting,
    sourceIsUart,
    linkStatusLabel,
    onConnect,
    onDisconnect,
  } = props;

  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const loopbackAvailable = useBitstreamTelemetrySourceStore((s) => s.loopbackAvailable);
  const showStartSimulator =
    telemetryBackend === "simulator" &&
    !loopbackAvailable &&
    isVsCodeExtensionWebview();

  const [simulatorStartBusy, setSimulatorStartBusy] = useState(false);
  const startSimulator = useCallback(async () => {
    if (simulatorStartBusy) {
      return;
    }
    setSimulatorStartBusy(true);
    try {
      await ensureBitstreamSimulatorReady();
    } finally {
      setSimulatorStartBusy(false);
    }
  }, [simulatorStartBusy]);

  return (
    <div
      className={`${SHELL_CONTROL_DECK_CLASS} scrollbar-hide overflow-x-auto`}
      role="region"
      aria-label="Workspace, data source, and service"
    >
      <ShellControlDeckZone ariaLabel="Workspace">
        <BitstreamWorkspaceSwitcher />
      </ShellControlDeckZone>

      <div className={SHELL_CONTROL_DECK_DIVIDER_CLASS} aria-hidden />

      <ShellControlDeckZone ariaLabel="Data source">
        <BitstreamTelemetrySourceField />
        {showStartSimulator ? (
          <TRNTooltip
            content="Start the bitstream-simulator VS Code extension and connect to the bridge."
            placement="bottom-start"
            openDelayMs={TRN_HINT_HOVER_DELAY_MS}
            disableHoverFx
            triggerWrapper="span"
            triggerClassName="!p-0"
            triggerAriaLabel="Start simulator"
            trigger={
              <TRNIconButton
                icon={
                  <Play size={16} className="text-violet-200/90" strokeWidth={2.25} />
                }
                label={simulatorStartBusy ? "Starting simulator…" : "Start simulator"}
                nativeTitle={false}
                disabled={simulatorStartBusy}
                onClick={() => void startSimulator()}
                className="!h-6 !w-6 !rounded-full border border-violet-700/60 bg-violet-950/25 text-zinc-200 hover:bg-violet-900/15"
              />
            }
          />
        ) : null}
      </ShellControlDeckZone>

      <div className={SHELL_CONTROL_DECK_DIVIDER_CLASS} aria-hidden />

      <ShellControlDeckZone ariaLabel="Service connection">
        <ShellServiceLinkChip
          linkConnected={linkConnected}
          linkConnecting={linkConnecting}
          sourceIsUart={sourceIsUart}
          linkStatusLabel={linkStatusLabel}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </ShellControlDeckZone>
    </div>
  );
}
