import { RotateCw } from "lucide-react";
import {
  TRNFormField,
  TRNHintText,
  TRNSelect,
  type TRNSelectOption,
} from "../../../../../../../ui/TRN";
import { readFlowWireTransformEulerMapping } from "../../../../nodes/transform/flow-wire-transform";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const MAPPING_OPTIONS: TRNSelectOption[] = [
  {
    value: "fusion",
    label: "IMU / fusion (BMI270)",
  },
  {
    value: "literal",
    label: "Literal scene XYZ",
  },
];

export function TransformFromEulerSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const mapping = readFlowWireTransformEulerMapping(selectedNode.data.defaultConfig.eulerMapping);

  return (
    <InspectorCollapsibleSection
      title="Euler mapping"
      icon={<RotateCw className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Choose how incoming Euler radians (roll, pitch, heading on x, y, z) are converted into the Transform wire consumed by Model Viewer and 3D Rotation nodes."
      defaultExpanded
    >
      <TRNFormField label="Rotation interpretation" id="transform-from-euler-mapping" className="space-y-1.5">
        <TRNSelect
          ariaLabel="Euler rotation interpretation"
          value={mapping}
          options={MAPPING_OPTIONS}
          size="sm"
          className="min-w-0"
          buttonClassName="min-h-7 text-[10px]"
          panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
          onValueChange={(next) => {
            onUpdateConfigField("eulerMapping", next);
          }}
        />
      </TRNFormField>
      <TRNHintText className="text-[10px]">
        {mapping === "fusion"
          ? "Matches BMI270 fusion taps and 3D Rotation · Euler (rad): roll→Three Y, pitch→Three X, heading→Three Z, ZYX order, plus firmware GLB axis remap. Use for IMU-driven models."
          : "Maps wire x→scene X, y→scene Y, z→scene Z in degrees (Three.js XYZ on the model root). Use for authored scene transforms or non-fusion math."}
      </TRNHintText>
    </InspectorCollapsibleSection>
  );
}
