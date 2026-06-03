import { Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { TRNScrubNumberInput, TRNTooltip } from "../../../../../ui/TRN";
import { STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX } from "../../nodes/flow-node/studio-node-layout-size";

const LAYOUT_SIZE_MAX_PX = 4096;

const AXIS_META = [
  {
    key: "width" as const,
    label: "W",
    ring: "border-violet-500/70 text-violet-200",
    aria: "Node width in pixels",
  },
  {
    key: "height" as const,
    label: "H",
    ring: "border-amber-500/70 text-amber-200",
    aria: "Node height in pixels",
  },
] as const;

export type InspectorNodeLayoutSizeFieldsProps = {
  /** Resets per-axis locks when the selected canvas node changes. */
  nodeId: string;
  width: number;
  height: number;
  disabled?: boolean;
  onCommit: (patch: { width?: number; height?: number }) => void;
};

export function InspectorNodeLayoutSizeFields(props: InspectorNodeLayoutSizeFieldsProps) {
  const { nodeId, width, height, disabled = false, onCommit } = props;
  const [locks, setLocks] = useState({ width: false, height: false });

  useEffect(() => {
    setLocks({ width: false, height: false });
  }, [nodeId]);

  const values = { width, height };

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {AXIS_META.map((axis) => {
        const locked = locks[axis.key];
        const v = values[axis.key];
        return (
          <label
            key={axis.key}
            className={
              "flex min-w-0 items-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-0.5 " +
              (disabled ? "opacity-60 " : "") +
              (locked && !disabled ? "opacity-80 " : "")
            }
          >
            <span
              className={
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-semibold " +
                axis.ring
              }
              aria-hidden
            >
              {axis.label}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              <TRNScrubNumberInput
                aria-label={axis.aria}
                value={v}
                min={STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX}
                max={LAYOUT_SIZE_MAX_PX}
                step={1}
                fractionDigits={0}
                disabled={disabled}
                locked={locked}
                pointerScrubEnabled={!disabled && !locked}
                onChange={(next) => {
                  if (locked) {
                    return;
                  }
                  onCommit(axis.key === "width" ? { width: next } : { height: next });
                }}
              />
              <TRNTooltip
                placement="top-start"
                openDelayMs={450}
                triggerWrapper="span"
                triggerAriaLabel={
                  locked ? `Unlock ${axis.label} dimension` : `Lock ${axis.label} dimension`
                }
                content={
                  locked
                    ? `${axis.label}: unlock to edit`
                    : `${axis.label}: lock from edits`
                }
                trigger={
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={
                      locked ? `Unlock ${axis.label} dimension` : `Lock ${axis.label} dimension`
                    }
                    aria-pressed={locked}
                    className={
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 outline-none transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-400/45 disabled:pointer-events-none disabled:opacity-40 " +
                      (locked
                        ? "text-amber-300/95"
                        : "text-zinc-500 hover:text-zinc-300")
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setLocks((prev) => ({ ...prev, [axis.key]: !prev[axis.key] }));
                    }}
                  >
                    {locked ? (
                      <Lock className="h-3 w-3" aria-hidden strokeWidth={2.25} />
                    ) : (
                      <Unlock className="h-3 w-3" aria-hidden strokeWidth={2.25} />
                    )}
                  </button>
                }
              />
            </div>
          </label>
        );
      })}
    </div>
  );
}
