import { TRNFormField, TRNInput, TRNSelect } from "../../../../../../../ui/TRN";
import {
  coerceDashboardSelectOptions,
  readDashboardSelectValue,
  type DashboardSelectOptionV1,
} from "../../../../../../core/dashboard/dashboard-select-options";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";

function updateOptionAt(
  options: readonly DashboardSelectOptionV1[],
  index: number,
  patch: Partial<DashboardSelectOptionV1>,
  onUpdateConfigField: NodeInspectorSettingsSectionProps["onUpdateConfigField"],
) {
  const next = options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt));
  onUpdateConfigField("options", next);
}

export function DashboardSelectSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const label = typeof dc.label === "string" ? dc.label : "";
  const options = coerceDashboardSelectOptions(dc.options);
  const value = readDashboardSelectValue(dc, options);

  return (
    <>
      <InspectorSettingsSectionFrame title="Dashboard Select">
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Dropdown on the Dashboard pane. Wire <span className="font-medium text-zinc-400">Out</span>{" "}
          into string consumers.
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
          <TRNFormField label="Default selection">
            <TRNSelect
              variant="field"
              size="sm"
              ariaLabel="Dashboard select default value"
              value={value}
              options={options.map((opt) => ({ value: opt.value, label: opt.label }))}
              triggerClassName="w-full"
              onValueChange={(next) => onUpdateConfigField("value", next)}
            />
          </TRNFormField>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Options</p>
          {options.map((opt, index) => (
            <div key={`${index}-${opt.value}`} className="grid grid-cols-2 gap-2">
              <TRNFormField label="Value">
                <TRNInput
                  value={opt.value}
                  onChange={(e) => updateOptionAt(options, index, { value: e.target.value }, onUpdateConfigField)}
                />
              </TRNFormField>
              <TRNFormField label="Label">
                <TRNInput
                  value={opt.label}
                  onChange={(e) => updateOptionAt(options, index, { label: e.target.value }, onUpdateConfigField)}
                />
              </TRNFormField>
            </div>
          ))}
        </div>
      </InspectorSettingsSectionFrame>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
