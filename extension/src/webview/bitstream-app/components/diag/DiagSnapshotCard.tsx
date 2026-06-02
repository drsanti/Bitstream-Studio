import { TRNDragHandle, TRNInteractiveCard, TRNParameter } from "@/ui/TRN";
import {
  ArrowDownToLine,
  BarChart3,
  Cpu,
  Layers2,
  MemoryStick,
  Moon,
  Timer,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { toTrnIconPulseAnimationPreset } from "../../../ui/TRN/trnIconPulsePresets.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import type { DiagSnapshotCardProps } from "./types";

const iconProps = { className: "h-4 w-4", strokeWidth: 2.25, "aria-hidden": true as const };

function fmtPct(v: number): string {
  return (v / 100).toFixed(2);
}

const label = (text: string) => (
  <span className="text-xs font-semibold normal-case tracking-normal text-zinc-100">{text}</span>
);

export function DiagSnapshotCard(props: DiagSnapshotCardProps) {
  const {
    snapshot,
    error,
    updatedAt,
    collapsed,
    onCollapsedChange,
    diagnosticsStreamEnabled = false,
    snapshotUpdateSource = "off",
  } = props;

  const { iconPulseAnim, iconPulseColorOn } = useBitstreamConfigStore(
    useShallow((s) => ({
      iconPulseAnim: toTrnIconPulseAnimationPreset(s.sensorTelemetryIconPulseAnimationPreset),
      iconPulseColorOn: s.sensorTelemetryIconPulseColorAnimationEnabled,
    })),
  );

  return (
    <TRNInteractiveCard
      title="Global Diagnostics"
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
          <BarChart3 className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2.25} aria-hidden />
        </div>
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      shell="solid"
      className="h-auto"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      contentClassName="min-h-0"
    >
      {error ? <div className="mb-2 text-xs text-rose-300">{error}</div> : null}
      <div className="mb-2 flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1 text-[11px] font-semibold text-zinc-400">
        <span>
          Source:{" "}
          {snapshotUpdateSource === "stream"
            ? "streaming"
            : snapshotUpdateSource === "poll"
              ? "polling (2s)"
              : "off"}
        </span>
        <span>
          {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : "No snapshot yet"}
        </span>
      </div>
      {!diagnosticsStreamEnabled ? (
        <p className="text-xs text-zinc-400">
          Global snapshot can update via polling even when streaming is off. Turn on{" "}
          <span className="font-semibold text-zinc-300">Streaming mode</span> to increase update rate.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <TRNParameter
              name={label("CPU load")}
              value={snapshot ? fmtPct(snapshot.cpuLoadPctX100) : "--"}
              unit="%"
              nameColumnLayout="auto"
              valueColumnLayout="auto"
              positiveSignMode="omit"
              iconPulseOnValueChange
              iconPulseAnimationPreset={iconPulseAnim}
              iconPulseColorAnimationEnabled={iconPulseColorOn}
              icon={<Cpu {...iconProps} />}
            />
            <TRNParameter
              name={label("Idle")}
              value={snapshot ? fmtPct(snapshot.idlePctX100) : "--"}
              unit="%"
              nameColumnLayout="auto"
              valueColumnLayout="auto"
              positiveSignMode="omit"
              iconPulseOnValueChange
              iconPulseAnimationPreset={iconPulseAnim}
              iconPulseColorAnimationEnabled={iconPulseColorOn}
              icon={<Moon {...iconProps} />}
            />
            <TRNParameter
              name={label("Heap free")}
              value={snapshot ? String(snapshot.heapFreeBytes) : "--"}
              unit="B"
              nameColumnLayout="auto"
              valueColumnLayout="auto"
              positiveSignMode="omit"
              iconPulseOnValueChange
              iconPulseAnimationPreset={iconPulseAnim}
              iconPulseColorAnimationEnabled={iconPulseColorOn}
              icon={<MemoryStick {...iconProps} />}
            />
            <TRNParameter
              name={label("Heap min")}
              value={snapshot ? String(snapshot.heapMinEverFreeBytes) : "--"}
              unit="B"
              nameColumnLayout="auto"
              valueColumnLayout="auto"
              positiveSignMode="omit"
              iconPulseOnValueChange
              iconPulseAnimationPreset={iconPulseAnim}
              iconPulseColorAnimationEnabled={iconPulseColorOn}
              icon={<ArrowDownToLine {...iconProps} />}
            />
            <TRNParameter
              name={label("Task count")}
              value={snapshot ? String(snapshot.taskCount) : "--"}
              unit=""
              nameColumnLayout="auto"
              valueColumnLayout="auto"
              positiveSignMode="omit"
              iconPulseOnValueChange
              iconPulseAnimationPreset={iconPulseAnim}
              iconPulseColorAnimationEnabled={iconPulseColorOn}
              icon={<Layers2 {...iconProps} />}
            />
            <TRNParameter
              name={label("Runtime total")}
              value={snapshot ? String(snapshot.runtimeTotal) : "--"}
              unit="ms"
              nameColumnLayout="auto"
              valueColumnLayout="auto"
              positiveSignMode="omit"
              iconPulseOnValueChange
              iconPulseAnimationPreset={iconPulseAnim}
              iconPulseColorAnimationEnabled={iconPulseColorOn}
              icon={<Timer {...iconProps} />}
            />
          </div>
        </>
      )}
    </TRNInteractiveCard>
  );
}
