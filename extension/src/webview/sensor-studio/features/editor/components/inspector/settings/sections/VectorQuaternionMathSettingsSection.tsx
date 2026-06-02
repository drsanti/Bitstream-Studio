import { Sigma } from "lucide-react";
import { TRNFormField, TRNSelect } from "../../../../../../../ui/TRN";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const HINT_BY_NODE_ID: Record<string, string> = {
  "vector-length": "Outputs |v| = √(x² + y² + z²).",
  "vector-length-squared": "Outputs x² + y² + z² (use with Compare for thresholds).",
  "vector-normalize": "Unit vector; outputs zero when length is 0.",
  "vector-scale": "Multiplies each axis by Scale.",
  "vector-add": "Add or subtract B from A.",
  "vector-distance": "|A − B|.",
  "vector-dot": "Scalar dot product.",
  "vector-cross": "Vector cross product A × B.",
  "vector-lerp":
    "Linear blend of vectors (lerp). For quaternion rotation blending use Quaternion Slerp. Factor clamps 0–1.",
  "vector-project": "Component of V along Onto.",
  "vector-reject": "Component of V perpendicular to Onto.",
  "vector-angle": "Angle in radians between A and B.",
  "compare-vector-length": "Boolean compare on |Vector| vs Threshold.",
  "tilt-from-accel": "Roll (x) and pitch (y) from gravity vector; z = 0.",
  "euler-heading": "Yaw / heading (z) from wire Euler radians.",
  "accel-near-1g": "True when magnitude is 9–10.5 m/s².",
  "degrees-to-radians": "Degrees × π/180.",
  "radians-to-degrees": "Radians × 180/π.",
  "quaternion-normalize": "Unit quaternion.",
  "quaternion-multiply": "Hamilton product A × B.",
  "quaternion-conjugate": "Flip vector part sign.",
  "quaternion-inverse": "Inverse rotation.",
  "quaternion-slerp": "Spherical blend; Factor clamps 0–1.",
  "axis-angle-to-quaternion": "Axis (any length) + angle in radians.",
  "euler-to-quaternion":
    "Wire Euler x=roll, y=pitch, z=heading (rad) → quaternion (intrinsic ZYX).",
  "quaternion-to-euler":
    "Quaternion → wire Euler x=roll, y=pitch, z=heading (rad). Not firmware fusion remap.",
  "rotate-vector-by-quaternion": "Rotates V by Q.",
};

const TITLE_BY_NODE_ID: Record<string, string> = {
  "vector-add": "Vector Add / Subtract",
  "compare-vector-length": "Compare Vector Length",
};

const VECTOR_ADD_OPS = [
  { value: "add", label: "Add" },
  { value: "sub", label: "Subtract" },
];

const COMPARE_OPS = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
];

export function VectorQuaternionMathSettingsSection(
  props: NodeInspectorSettingsSectionProps,
) {
  const { selectedNode, onUpdateConfigField } = props;
  const nodeId = selectedNode.data.nodeId;
  const title = TITLE_BY_NODE_ID[nodeId] ?? selectedNode.data.label;
  const hint = HINT_BY_NODE_ID[nodeId] ?? "Vector / quaternion utility node.";
  const cfg = selectedNode.data.defaultConfig;

  return (
    <InspectorCollapsibleSection
      title={title}
      icon={<Sigma className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint={hint}
      defaultExpanded
    >
      {nodeId === "vector-add" ? (
        <TRNFormField label="Operation" id="vector-add-operation" className="space-y-1.5">
          <TRNSelect
            ariaLabel="Vector add or subtract"
            value={cfg.operation === "sub" ? "sub" : "add"}
            options={VECTOR_ADD_OPS}
            triggerClassName="w-full"
            onValueChange={(next) => {
              onUpdateConfigField("operation", next);
            }}
          />
        </TRNFormField>
      ) : null}
      {nodeId === "compare-vector-length" ? (
        <TRNFormField label="Operator" id="compare-vector-length-op" className="space-y-1.5">
          <TRNSelect
            ariaLabel="Compare vector length operator"
            value={typeof cfg.operation === "string" ? cfg.operation : ">"}
            options={COMPARE_OPS}
            triggerClassName="w-full"
            onValueChange={(next) => {
              onUpdateConfigField("operation", next);
            }}
          />
        </TRNFormField>
      ) : null}
    </InspectorCollapsibleSection>
  );
}
