import { Activity } from "lucide-react";
import { useMemo } from "react";
import { SparklineNodePanel } from "../../../../nodes/sparkline/SparklineNodePanel";
import {
  buildSparklinePolylinePoints,
  coerceSparklineConfig,
} from "../../../../nodes/display/sparkline-display-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorColorRow } from "../../InspectorDenseControls";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const PREVIEW_WAVE = [
  -0.6, -0.2, 0.1, 0.45, 0.8, 0.55, 0.2, -0.15, -0.4, -0.7, -0.35, 0.05,
  0.35, 0.65, 0.9, 0.5, 0.1, -0.25, -0.55, -0.3, 0.15, 0.5, 0.75, 0.4,
];

export function SparklineSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = useMemo(
    () => coerceSparklineConfig(selectedNode.data.defaultConfig),
    [selectedNode.data.defaultConfig],
  );
  const previewConfig = useMemo(
    () => ({ ...selectedNode.data.defaultConfig, ...cfg }),
    [cfg, selectedNode.data.defaultConfig],
  );
  const previewPoints = useMemo(
    () => buildSparklinePolylinePoints(PREVIEW_WAVE, cfg.historySize),
    [cfg.historySize],
  );

  return (
    <>
      <InspectorCollapsibleSection
        title="Preview"
        icon={<Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Sample wave — live canvas uses the wired input history."
        defaultExpanded
      >
        <div className="overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/80">
          <SparklineNodePanel history={PREVIEW_WAVE} defaultConfig={previewConfig} />
        </div>
        {previewPoints.length === 0 ? (
          <p className="text-[11px] text-zinc-500">Increase history size to see the preview wave.</p>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Trend line"
        icon={<Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Buffer length and stroke styling on the canvas mini chart."
        defaultExpanded
      >
        <InspectorNumericScrubRow
          label="History size"
          description="Number of samples kept for the mini plot."
          ariaLabel="Sparkline history size"
          value={cfg.historySize}
          min={4}
          max={512}
          step={1}
          onCommit={(next) => {
            onUpdateConfigField("historySize", Math.round(next));
          }}
        />
        <InspectorColorRow
          label="Stroke color"
          description="Polyline color on the canvas."
          ariaLabel="Sparkline stroke color"
          value={cfg.strokeColor}
          onChange={(next) => {
            onUpdateConfigField("strokeColor", next);
          }}
        />
        <InspectorNumericScrubRow
          label="Stroke width"
          description="Line thickness in CSS pixels (non-scaling stroke)."
          ariaLabel="Sparkline stroke width"
          value={cfg.strokeWidth}
          min={1}
          max={8}
          step={0.5}
          onCommit={(next) => {
            onUpdateConfigField("strokeWidth", next);
          }}
        />
      </InspectorCollapsibleSection>
    </>
  );
}
