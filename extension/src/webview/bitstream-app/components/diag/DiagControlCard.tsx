import {
  TRNDragHandle,
  TRNInteractiveCard,
  TRNParameterSlider,
  TRNTransientStatusBadge,
  TRNToggleSwitch,
  TRNSegmentedControl,
} from "@/ui/TRN";
import { Radio } from "lucide-react";
import {
  DIAG_STREAM_SLIDER_MAX_MS,
  DIAG_STREAM_SLIDER_MIN_MS,
  DIAG_STREAM_SLIDER_STEP_MS,
  DIAG_STREAM_SLIDER_THROTTLE_MS,
} from "../../constants/diagStreamIntervals";
import type { DiagControlCardProps } from "./types";

export function DiagControlCard(props: DiagControlCardProps) {
  const {
    streamEnabled,
    globalPeriodMs,
    taskPeriodMs,
    maxRowsPerBatch,
    resyncPeriodMs,
    priorityMode,
    loading,
    ackState,
    ackMessage,
    onToggleStream,
    onGlobalPeriodChange,
    onTaskPeriodChange,
    onMaxRowsPerBatchChange,
    onResyncPeriodChange,
    onPriorityModeChange,
    collapsed,
    onCollapsedChange,
  } = props;

  return (
    <TRNInteractiveCard
      title="Diagnostics Control"
      titleLeadingSlot={
        <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
      }
      titleTrailingSlot={
        <TRNTransientStatusBadge
          state={ackState}
          message={ackMessage}
          autoHideMs={6000}
        />
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="h-auto rounded-md border-zinc-700/80 bg-black/40 p-2"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      contentClassName="min-h-0"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Radio className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2.25} aria-hidden />
            <span className="text-xs font-semibold normal-case tracking-normal text-zinc-100">
              Streaming mode (Global + Task)
            </span>
          </div>
          <TRNToggleSwitch
            checked={streamEnabled}
            onCheckedChange={onToggleStream}
            disabled={loading}
            ariaLabel="Toggle diagnostics streaming"
          />
        </div>
        <div className="text-[11px] text-zinc-400">
          When streaming is off, Global snapshot may still update via polling (low bandwidth). Task table streaming is
          controlled by the Task Diagnostics panel.
        </div>

        {/* Do not tie sliders to `loading`: ACK pending disables the range input and interrupts drag. */}
        <TRNParameterSlider
          name="Global snapshot interval (stream)"
          value={globalPeriodMs}
          min={DIAG_STREAM_SLIDER_MIN_MS}
          max={DIAG_STREAM_SLIDER_MAX_MS}
          step={DIAG_STREAM_SLIDER_STEP_MS}
          unit="ms"
          throttleMs={DIAG_STREAM_SLIDER_THROTTLE_MS}
          onChange={onGlobalPeriodChange}
          disabled={!streamEnabled}
        />

        <TRNParameterSlider
          name="Task diagnostics interval (stream)"
          value={taskPeriodMs}
          min={DIAG_STREAM_SLIDER_MIN_MS}
          max={DIAG_STREAM_SLIDER_MAX_MS}
          step={DIAG_STREAM_SLIDER_STEP_MS}
          unit="ms"
          throttleMs={DIAG_STREAM_SLIDER_THROTTLE_MS}
          onChange={onTaskPeriodChange}
          disabled={!streamEnabled}
        />
        <TRNParameterSlider
          name="Task rows per batch (stream)"
          value={maxRowsPerBatch}
          min={1}
          max={24}
          step={1}
          unit=""
          throttleMs={DIAG_STREAM_SLIDER_THROTTLE_MS}
          onChange={onMaxRowsPerBatchChange}
          disabled={!streamEnabled}
        />
        <TRNParameterSlider
          name="Resync Period"
          value={resyncPeriodMs}
          min={250}
          max={60000}
          step={50}
          unit="ms"
          throttleMs={DIAG_STREAM_SLIDER_THROTTLE_MS}
          onChange={onResyncPeriodChange}
          disabled={!streamEnabled}
        />
        <TRNSegmentedControl
          value={priorityMode}
          onValueChange={(v) => {
            if (v === "sensor" || v === "diagnostics") onPriorityModeChange(v);
          }}
          options={[
            { value: "sensor", label: "Sensor" },
            { value: "diagnostics", label: "Diag" },
          ]}
          ariaLabel="Task priority mode"
          size="sm"
          variant="outline"
          tone="accent"
          allowDeselect={false}
        />
      </div>
    </TRNInteractiveCard>
  );
}
