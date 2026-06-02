import { Box, Merge, Orbit, Split, ToggleLeft } from "lucide-react";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function SwitchSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Switch"
      icon={<ToggleLeft className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="When Condition is true, Out passes If True; otherwise If False. Unwired number inputs count as 0. Condition accepts boolean wires or numbers (> 0 is true)."
      defaultExpanded
    />
  );
}

export function CombineVectorSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Combine Vector"
      icon={<Merge className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Builds a vector3 on Vector from wired X, Y, and Z numbers. Unwired inputs count as 0."
      defaultExpanded
    />
  );
}

/** @deprecated Registry alias — use {@link CombineVectorSettingsSection}. */
export const CombineXyzSettingsSection = CombineVectorSettingsSection;

export function CombineQuaternionSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Combine Quaternion"
      icon={<Merge className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Builds a quaternion on Quaternion from wired W, X, Y, and Z numbers. Unwired inputs count as 0."
      defaultExpanded
    />
  );
}

export function SplitVectorSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Split Vector"
      icon={<Split className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Passes X, Y, and Z from the wired Vector input. Socket rows show live scalars when values are visible."
      defaultExpanded
    />
  );
}

export function SplitQuaternionSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Split Quaternion"
      icon={<Split className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Passes W, X, Y, and Z from the wired Quaternion input. Display order matches BMI270 fusion rows (w x y z)."
      defaultExpanded
    />
  );
}

export function VectorConstantSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Vector"
      icon={<Box className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Outputs a vector3 from wired X, Y, Z numbers. Unwired axes use Node tab defaults (0). Socket row shows live components."
      defaultExpanded
    />
  );
}

export function QuaternionConstantSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Quaternion"
      icon={<Orbit className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Outputs a quaternion from wired W, X, Y, Z numbers. Unwired axes use Node tab defaults (W = 1, others 0)."
      defaultExpanded
    />
  );
}
