import { useCallback, type RefObject } from "react";
import { useProject4HudPanelVisibility } from "../../hooks/useProject4HudPanelVisibility";
import { Project4McuTelemetryCard } from "../Project4McuTelemetryCard";
import type { UseProject4TelemetryResult } from "../../hooks/useProject4Telemetry";
import { useProject4McuCommands } from "../../hooks/useProject4McuCommands";
import { useProject4ViewportDriveKeyboard } from "../../hooks/useProject4ViewportDriveKeyboard";
import type { Project4MoveDirection } from "../../lib/mcu-http";
import { useProject4SettingsStore } from "../../settings/project4-settings.store";
import { ConnectionIndicator } from "./ConnectionIndicator";
import {
  Project4DraggableOverlayPanel,
  type Project4HudPlacement,
} from "./Project4DraggableOverlayPanel";
import { DriveControlDeck } from "./DriveControlDeck";
import { SpeedControl } from "./SpeedControl";
import { TelemetryStrip } from "./TelemetryStrip";

const HUD_PL_CONNECTION: Project4HudPlacement = { kind: "northWest", margin: 12 };
const HUD_PL_TELEMETRY: Project4HudPlacement = { kind: "northEast", margin: 12 };
const HUD_PL_MOTION: Project4HudPlacement = { kind: "southCenter", marginBottom: 18 };
const HUD_PL_MCU_CARD: Project4HudPlacement = { kind: "southEast", margin: 14 };

export type Project4HudRootProps = {
  containerRef: RefObject<HTMLElement | null>;
  telemetry: UseProject4TelemetryResult;
  driveKeyboardEnabled: boolean;
};

export function Project4HudRoot(props: Project4HudRootProps) {
  const mcuBaseUrl = useProject4SettingsStore((s) => s.mcuBaseUrl);
  const scannerFrontAzimuthMinDeg = useProject4SettingsStore((s) => s.scannerFrontAzimuthMinDeg);
  const scannerFrontAzimuthMaxDeg = useProject4SettingsStore((s) => s.scannerFrontAzimuthMaxDeg);
  const scannerRearAzimuthMinDeg = useProject4SettingsStore((s) => s.scannerRearAzimuthMinDeg);
  const scannerRearAzimuthMaxDeg = useProject4SettingsStore((s) => s.scannerRearAzimuthMaxDeg);
  const scannerTelemetrySweepMinDeg = useProject4SettingsStore((s) => s.scannerTelemetrySweepMinDeg);
  const scannerTelemetrySweepMaxDeg = useProject4SettingsStore((s) => s.scannerTelemetrySweepMaxDeg);
  const reverseSafetyStopCmDisplay = useProject4SettingsStore((s) => s.reverseSafetyStopCmDisplay);

  const { hidePanel, isHidden } = useProject4HudPanelVisibility();

  const { sendMove, sendSetSpeed, moveBusy, speedBusy, lastFault, clearFault } =
    useProject4McuCommands();

  const onDrive = useCallback(
    (dir: Project4MoveDirection) => {
      void sendMove(dir);
    },
    [sendMove],
  );

  useProject4ViewportDriveKeyboard({
    enabled: props.driveKeyboardEnabled && !moveBusy && !speedBusy,
    onMove: onDrive,
  });

  const busy = moveBusy || speedBusy;
  const disabledMotion = busy || !mcuBaseUrl.trim();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      {!isHidden("connection") ? (
      <Project4DraggableOverlayPanel
        containerRef={props.containerRef}
        placement={HUD_PL_CONNECTION}
        hudPersistId="connection"
        title="Connection"
        zIndex={52}
        className="max-w-[min(100vw-24px,26rem)]"
        onDismiss={() => hidePanel("connection")}
      >
        <ConnectionIndicator
          status={props.telemetry.status}
          mcuBaseUrl={mcuBaseUrl}
          lastSampleAt={props.telemetry.lastSampleAt}
          lastError={props.telemetry.lastError}
        />
      </Project4DraggableOverlayPanel>
      ) : null}

      {!isHidden("telemetry") ? (
      <Project4DraggableOverlayPanel
        containerRef={props.containerRef}
        placement={HUD_PL_TELEMETRY}
        hudPersistId="telemetry"
        title="Telemetry"
        zIndex={51}
        className="w-56 max-w-[min(100vw-24px,14rem)]"
        onDismiss={() => hidePanel("telemetry")}
      >
        <TelemetryStrip
          snapshot={props.telemetry.snapshot}
          scannerFrontMinDeg={scannerFrontAzimuthMinDeg}
          scannerFrontMaxDeg={scannerFrontAzimuthMaxDeg}
          scannerRearMinDeg={scannerRearAzimuthMinDeg}
          scannerRearMaxDeg={scannerRearAzimuthMaxDeg}
          scannerTelemetrySweepMinDeg={scannerTelemetrySweepMinDeg}
          scannerTelemetrySweepMaxDeg={scannerTelemetrySweepMaxDeg}
          reverseSafetyStopCmDisplay={reverseSafetyStopCmDisplay}
        />
      </Project4DraggableOverlayPanel>
      ) : null}

      {!isHidden("motion") ? (
      <Project4DraggableOverlayPanel
        containerRef={props.containerRef}
        placement={HUD_PL_MOTION}
        hudPersistId="motion"
        title="Motion / speed"
        zIndex={50}
        className="max-w-[min(100vw-24px,22rem)]"
        onDismiss={() => hidePanel("motion")}
      >
        <div className="flex flex-col gap-0">
          {lastFault != null ? (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-md border border-rose-400/35 bg-rose-950/40 px-2 py-1.5 text-center text-[10px] text-rose-100 shadow-sm backdrop-blur-md">
              <span className="font-mono">{lastFault}</span>
              <button
                type="button"
                className="rounded border border-rose-500/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-rose-200 hover:bg-rose-900/40"
                onClick={clearFault}
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <SpeedControl onApply={(v) => void sendSetSpeed(v)} disabled={disabledMotion} />
          <div className="my-3 h-px shrink-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
          <DriveControlDeck onMove={onDrive} disabled={disabledMotion} />
        </div>
      </Project4DraggableOverlayPanel>
      ) : null}

      {!isHidden("mcuCard") ? (
      <Project4DraggableOverlayPanel
        containerRef={props.containerRef}
        placement={HUD_PL_MCU_CARD}
        hudPersistId="mcuCard"
        title="MCU telemetry"
        zIndex={49}
        className="w-[min(100vw-24px,28rem)] max-w-[min(100vw-24px,28rem)]"
        onDismiss={() => hidePanel("mcuCard")}
      >
        <Project4McuTelemetryCard telemetry={props.telemetry} />
      </Project4DraggableOverlayPanel>
      ) : null}
    </div>
  );
}
