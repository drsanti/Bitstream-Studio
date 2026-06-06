import { useEffect, useState } from "react";
import {
  TRNBadgedScrubNumberField,
  TRNBadgedScrubNumberFieldGrid,
} from "../../../../../ui/TRN";
import { INSPECTOR_SCRUB_SETTINGS_KEY } from "./inspector-scrub-field-presets";
import { STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX } from "../../nodes/flow-node/studio-node-layout-size";

const LAYOUT_SIZE_MAX_PX = 4096;

const LAYOUT_AXIS_META = [
  {
    key: "width" as const,
    badge: { kind: "text" as const, text: "W", tone: "violet" as const },
    aria: "Node width in pixels",
  },
  {
    key: "height" as const,
    badge: { kind: "text" as const, text: "H", tone: "amber" as const },
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
    <TRNBadgedScrubNumberFieldGrid columns={2}>
      {LAYOUT_AXIS_META.map((axis) => {
        const locked = locks[axis.key];
        const v = values[axis.key];
        return (
          <TRNBadgedScrubNumberField
            key={axis.key}
            badge={axis.badge}
            ariaLabel={axis.aria}
            value={v}
            min={STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX}
            max={LAYOUT_SIZE_MAX_PX}
            step={1}
            fractionDigits={0}
            disabled={disabled}
            locked={locked}
            onLockedChange={(next) => {
              setLocks((prev) => ({ ...prev, [axis.key]: next }));
            }}
            density="compact"
            settingsKey={INSPECTOR_SCRUB_SETTINGS_KEY}
            onChange={(next) => {
              onCommit(axis.key === "width" ? { width: next } : { height: next });
            }}
          />
        );
      })}
    </TRNBadgedScrubNumberFieldGrid>
  );
}
