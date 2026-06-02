import { Blend } from "lucide-react";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function LerpSettingsSection(props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Scalar Lerp"
      icon={<Blend className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Scalar Out = A + (B − A) × Factor. Factor clamps to 0–1. Unwired defaults: A = 0, B = 1, Factor = 0. Use Vector Lerp or Quaternion Slerp for typed wires."
      defaultExpanded
    />
  );
}
