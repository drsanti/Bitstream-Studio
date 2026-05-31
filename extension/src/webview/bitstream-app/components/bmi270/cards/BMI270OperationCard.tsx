import { Orbit, SlidersHorizontal } from "lucide-react";
import {
  TRNToggleSwitch,
  TRNButton,
  TRNDragHandle,
  TRNInteractiveCard,
} from "@/ui/TRN";
import {
  SensorCfgCardHeaderTrailing,
  type SensorCfgCardApplyProps,
} from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";
import type { Bmi270AckState, SensorPublishMode } from "../types";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels";

export function BMI270OperationCard(props: {
  collapsed: boolean;
  enabled: boolean;
  publishMode: SensorPublishMode;
  controlsDisabled: boolean;
  ack: Bmi270AckState;
  onToggleCollapsed: () => void;
  onEnabledChange: (next: boolean) => void;
  onPublishModeChange: (nextMode: SensorPublishMode) => void;
  cardApply?: SensorCfgCardApplyProps;
}) {
  const {
    collapsed,
    enabled,
    publishMode,
    controlsDisabled,
    ack,
    onToggleCollapsed,
    onEnabledChange,
    onPublishModeChange,
    cardApply,
  } = props;

  return (
    <TRNInteractiveCard
      title="BMI270 Operation"
      titleLeadingSlot={<div className="inline-flex items-center gap-1"><TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" /></div>}
      titleTrailingSlot={
        <SensorCfgCardHeaderTrailing
          dirty={cardApply?.dirty ?? false}
          applyDisabled={cardApply?.disabled}
          applyTitle={cardApply?.title}
          onApply={cardApply?.onApply}
          ack={ack}
        />
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="h-auto rounded-md border-zinc-700/80 bg-black/40 p-2"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={(nextCollapsed) => {
        if (nextCollapsed !== collapsed) {
          onToggleCollapsed();
        }
      }}
      contentClassName="min-h-0"
    >
      <div className="mb-2 flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1 text-sm">
        <div className="flex items-center gap-2">
          <Orbit className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
          <span className="text-xs font-semibold normal-case tracking-normal text-zinc-100">Sensor Enabled</span>
        </div>
        <TRNToggleSwitch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          ariaLabel="Toggle BMI270 sensor enabled"
        />
      </div>

      <div
        className={`${controlsDisabled ? "opacity-50" : ""} rounded border border-zinc-700/80 bg-transparent px-2 pt-1 pb-2 text-sm`}
      >
        <div className="group mb-1 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
          <span className="min-w-0 truncate text-xs font-semibold normal-case tracking-normal text-zinc-100">
            {SENSOR_CFG_UI.telemetryMode}
          </span>
        </div>
        <div role="radiogroup" aria-label="BMI270 telemetry mode" className="flex w-full flex-row flex-wrap justify-between gap-2">
          <TRNButton
            className="min-w-14 flex-1 border-zinc-700/80"
            size="compact"
            selected={publishMode === 0}
            disabled={controlsDisabled}
            hint={SENSOR_CFG_UI.publishModePeriodicHint}
            onClick={() => onPublishModeChange(0)}
          >
            Periodic
          </TRNButton>
          <TRNButton
            className="min-w-14 flex-1 border-zinc-700/80"
            size="compact"
            selected={publishMode === 1}
            disabled={controlsDisabled}
            hint={SENSOR_CFG_UI.publishModeChangeHint}
            onClick={() => onPublishModeChange(1)}
          >
            Change
          </TRNButton>
          <TRNButton
            className="min-w-14 flex-1 border-zinc-700/80"
            size="compact"
            selected={publishMode === 2}
            disabled={controlsDisabled}
            hint={SENSOR_CFG_UI.publishModeBothHint}
            onClick={() => onPublishModeChange(2)}
          >
            {SENSOR_CFG_UI.publishModeBoth}
          </TRNButton>
        </div>
      </div>
    </TRNInteractiveCard>
  );
}
