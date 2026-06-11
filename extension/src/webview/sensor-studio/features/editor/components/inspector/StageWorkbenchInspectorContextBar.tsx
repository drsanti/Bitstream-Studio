import { Box, MonitorPlay } from "lucide-react";
import { TRNInspectorContextBar } from "../../../../../ui/TRN";
import type { StageWorkbenchInspectorTab } from "./stage-inspector-ui-persistence";

export type StageWorkbenchInspectorContextBarProps = {
  activeTab: StageWorkbenchInspectorTab;
  selectionTitle: string | null;
  flowNodeLabel: string | null;
  modelCount: number;
};

export function StageWorkbenchInspectorContextBar(
  props: StageWorkbenchInspectorContextBarProps,
) {
  const { activeTab, selectionTitle, flowNodeLabel, modelCount } = props;

  if (activeTab === "scene") {
    return (
      <TRNInspectorContextBar
        title="Scene"
        subtitle={`${modelCount} committed model${modelCount === 1 ? "" : "s"} · Scene Output settings`}
        icon={MonitorPlay}
        iconShellClass="border-violet-500/30 bg-violet-950/25 text-violet-300/95"
      />
    );
  }

  const subtitle =
    selectionTitle != null
      ? selectionTitle
      : flowNodeLabel != null
        ? `Flow · ${flowNodeLabel}`
        : "Pick a Stage object or flow node";

  return (
    <TRNInspectorContextBar
      title="Selection"
      subtitle={subtitle}
      icon={Box}
      iconShellClass="border-sky-500/25 bg-sky-950/25 text-sky-300/95"
    />
  );
}
