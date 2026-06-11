import { TRNFormField, TRNInput, TRNTextarea } from "../../../../../../../ui/TRN";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";

export function DashboardFormattedTextSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const label = typeof dc.label === "string" ? dc.label : "";
  const template = typeof dc.template === "string" ? dc.template : "{{value}} {{unit}}";
  const unit = typeof dc.unit === "string" ? dc.unit : "";
  const fallback = typeof dc.fallback === "string" ? dc.fallback : "—";
  const decimals =
    typeof dc.decimals === "number" && Number.isFinite(dc.decimals) ? dc.decimals : 1;

  return (
    <>
      <InspectorSettingsSectionFrame title="Dashboard Formatted Text">
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Template readout on the Dashboard. Use <span className="text-zinc-300">{"{{value}}"}</span>{" "}
          and <span className="text-zinc-300">{"{{unit}}"}</span> placeholders; wire a number into{" "}
          **Value**.
        </p>
        <TRNFormField label="Label">
          <TRNInput
            value={label}
            onChange={(e) => {
              onUpdateConfigField("label", e.target.value);
              onUpdateLabel(e.target.value);
            }}
          />
        </TRNFormField>
        <div className="mt-3">
          <TRNFormField label="Template">
            <TRNTextarea
              value={template}
              rows={2}
              onChange={(e) => onUpdateConfigField("template", e.target.value)}
            />
          </TRNFormField>
        </div>
        <div className="mt-3">
          <TRNFormField label="Unit suffix">
            <TRNInput value={unit} onChange={(e) => onUpdateConfigField("unit", e.target.value)} />
          </TRNFormField>
        </div>
        <InspectorNumericScrubRow
          label="Decimals"
          ariaLabel="Formatted text decimal places"
          value={decimals}
          min={0}
          max={6}
          step={1}
          fractionDigits={0}
          onCommit={(next) => onUpdateConfigField("decimals", Math.round(next))}
        />
        <div className="mt-3">
          <TRNFormField label="Fallback">
            <TRNInput value={fallback} onChange={(e) => onUpdateConfigField("fallback", e.target.value)} />
          </TRNFormField>
        </div>
      </InspectorSettingsSectionFrame>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
