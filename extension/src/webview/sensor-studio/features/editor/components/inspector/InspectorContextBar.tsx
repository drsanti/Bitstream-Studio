import type { ReactNode } from "react";
import { TRNHintTooltip } from "../../../../../ui/TRN";
import type {
  SensorHardwareStreamLive,
  SensorHealthStatus,
} from "../../store/flow-editor.store";
import { formatInspectorUpdatedAt } from "./inspector-format-time";
import type { InspectorMainTab } from "./node-inspector-ui-persistence";
import {
  InspectorCategoryIcon,
  type InspectorStreamStatusKind,
} from "./InspectorCategoryIcon";

export type InspectorContextBarProps = {
  label: string;
  nodeId: string;
  catalogTitle?: string;
  catalogDescription?: string;
  /** Catalog `icon` slug — thermometer, gauge, etc. */
  catalogIconSlug?: string;
  category: string;
  categoryTint: string;
  activeTab: InspectorMainTab;
  lastUpdatedAt?: string;
  sensorStreamMode?: SensorHardwareStreamLive;
  sensorHealth?: SensorHealthStatus;
};

function formatCategoryLabel(category: string): string {
  const trimmed = category.trim();
  if (trimmed.length === 0) {
    return "—";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

type StreamStatusKind = InspectorStreamStatusKind;

function resolveStreamHealthVisual(props: {
  sensorStreamMode?: SensorHardwareStreamLive;
  sensorHealth?: SensorHealthStatus;
}): StreamStatusKind | null {
  const { sensorStreamMode, sensorHealth } = props;
  if (sensorHealth === "offline") {
    return "offline";
  }
  if (sensorHealth === "stale") {
    return "stale";
  }
  if (sensorHealth === "sim") {
    return "sim";
  }
  if (sensorHealth === "live" || sensorStreamMode === "live") {
    return "live";
  }
  if (sensorHealth != null) {
    return "idle";
  }
  return null;
}

function resolveStreamStatus(props: {
  activeTab: InspectorContextBarProps["activeTab"];
  sensorStreamMode?: SensorHardwareStreamLive;
  sensorHealth?: SensorHealthStatus;
}): StreamStatusKind | null {
  const { activeTab, sensorStreamMode, sensorHealth } = props;
  const isStreaming = sensorStreamMode === "live";

  if (sensorHealth === "offline") {
    return "offline";
  }
  if (sensorHealth === "stale") {
    return "stale";
  }
  if (sensorHealth === "sim") {
    return "sim";
  }
  if (activeTab === "live" && isStreaming) {
    return "live";
  }
  if (sensorHealth === "live" && activeTab === "live") {
    return "live";
  }
  if (activeTab === "live" && sensorHealth != null) {
    return "idle";
  }
  return null;
}

function InspectorStreamStatus(props: { kind: StreamStatusKind }) {
  const { kind } = props;

  if (kind === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-300/95">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.55)]"
          aria-hidden
        />
        Live
      </span>
    );
  }

  const toneClass =
    kind === "offline"
      ? "text-rose-300/90"
      : kind === "stale"
        ? "text-amber-300/90"
        : kind === "sim"
          ? "text-sky-300/85"
          : "text-zinc-500";

  const label =
    kind === "offline"
      ? "Offline"
      : kind === "stale"
        ? "Stale"
        : kind === "sim"
          ? "Simulated"
          : "Idle";

  return (
    <span className={`text-[10px] font-medium tracking-wide ${toneClass}`}>{label}</span>
  );
}

function MetaSeparator() {
  return <span className="shrink-0 text-zinc-700" aria-hidden>·</span>;
}

function NodeInstanceHint(props: { nodeId: string; children: ReactNode }) {
  const { nodeId, children } = props;
  return (
    <TRNHintTooltip
      trigger={children}
      content={
        <>
          <span className="font-medium text-zinc-200">Catalog node id</span>
          <span className="mt-1 block font-mono text-[10px] text-zinc-400">{nodeId}</span>
          <span className="mt-2 block text-zinc-400">
            Instance type for this graph node. Edit the display label under Node → Node label.
          </span>
        </>
      }
      triggerAriaLabel={`Catalog node id ${nodeId}`}
      placement="bottom-start"
    />
  );
}

/**
 * Sticky selection header — title, category, instance id, clock, and a single stream status.
 */
export function InspectorContextBar(props: InspectorContextBarProps) {
  const {
    label,
    nodeId,
    catalogTitle,
    catalogDescription,
    catalogIconSlug,
    category,
    categoryTint,
    activeTab,
    lastUpdatedAt,
    sensorStreamMode,
    sensorHealth,
  } = props;

  const typeLabel =
    catalogTitle != null && catalogTitle.trim().length > 0
      ? catalogTitle.trim()
      : nodeId;
  const categoryLabel = formatCategoryLabel(category);
  const customLabel = label.trim();
  const showCustomLabel =
    customLabel.length > 0 &&
    customLabel !== typeLabel &&
    customLabel !== nodeId;
  const updatedClock = formatInspectorUpdatedAt(lastUpdatedAt);
  const streamHealthVisual = resolveStreamHealthVisual({
    sensorStreamMode,
    sensorHealth,
  });
  const streamStatus = resolveStreamStatus({ activeTab, sensorStreamMode, sensorHealth });

  const titleNode =
    catalogDescription != null && catalogDescription.trim().length > 0 ? (
      <TRNHintTooltip
        className="min-w-0 truncate text-[13px] font-semibold leading-tight text-zinc-50"
        trigger={<span className="truncate">{typeLabel}</span>}
        content={catalogDescription.trim()}
        triggerAriaLabel={`About ${typeLabel}`}
        placement="bottom-start"
        wide
      />
    ) : (
      <span className="min-w-0 truncate text-[13px] font-semibold leading-tight text-zinc-50">
        {typeLabel}
      </span>
    );

  return (
    <header className="sticky top-0 z-2 shrink-0 border-b border-zinc-800/60 bg-zinc-950/80 px-3 py-2 backdrop-blur-sm supports-backdrop-filter:bg-zinc-950/70">
      <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-start gap-x-2 gap-y-1">
        <InspectorCategoryIcon
          className="row-span-2 mt-0.5"
          category={category}
          categoryTint={categoryTint}
          categoryLabel={categoryLabel}
          catalogIconSlug={catalogIconSlug}
          streamStatus={streamHealthVisual}
        />
        <div className="min-w-0">{titleNode}</div>
        <time
          className="shrink-0 self-start text-[10px] leading-none text-zinc-500"
          dateTime={lastUpdatedAt}
          title={lastUpdatedAt ?? "Last update"}
        >
          {updatedClock}
        </time>

        <div className="col-start-2 col-end-4 flex min-w-0 items-center gap-1.5 text-[10px] leading-snug">
          <span className="shrink-0 text-zinc-500">{categoryLabel}</span>
          <MetaSeparator />
          <NodeInstanceHint nodeId={nodeId}>
            <span className="min-w-0 truncate text-zinc-600 hover:text-zinc-400">
              {nodeId}
            </span>
          </NodeInstanceHint>
          {showCustomLabel ? (
            <>
              <MetaSeparator />
              <span className="min-w-0 truncate text-zinc-400" title={customLabel}>
                {customLabel}
              </span>
            </>
          ) : null}
          {streamStatus != null ? (
            <span className="ml-auto shrink-0 pl-2">
              <InspectorStreamStatus kind={streamStatus} />
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
