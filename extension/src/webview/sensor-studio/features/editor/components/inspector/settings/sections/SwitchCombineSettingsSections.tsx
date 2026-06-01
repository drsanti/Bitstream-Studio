import { GitBranch, ToggleLeft } from "lucide-react";
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

export function CombineXyzSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Combine XYZ"
      icon={<GitBranch className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Builds a vector3 on Out from wired X, Y, and Z numbers. Unwired inputs count as 0."
      defaultExpanded
    />
  );
}
