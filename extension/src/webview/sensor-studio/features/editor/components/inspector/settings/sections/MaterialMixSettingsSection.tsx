import { TRNFormField, TRNParameterSlider } from "../../../../../../../ui/TRN";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function MaterialMixSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig;
  const factor =
    typeof dc.factor === "number" && Number.isFinite(dc.factor) ? dc.factor : 0.5;

  return (
    <TRNFormField
      label="Mix factor"
      id="material-mix-factor"
      description="0 = input A only, 1 = input B only."
      className="space-y-1.5"
    >
      <TRNParameterSlider
        name="Factor"
        value={factor}
        min={0}
        max={1}
        step={0.01}
        valueFormatter={(v) => v.toFixed(2)}
        onChange={(v) => {
          onUpdateConfigField("factor", v);
        }}
      />
    </TRNFormField>
  );
}
