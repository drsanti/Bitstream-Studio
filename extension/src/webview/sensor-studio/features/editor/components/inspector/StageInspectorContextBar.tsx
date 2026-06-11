import { LayoutGrid, MonitorPlay, SlidersHorizontal } from "lucide-react";
import { TRNInspectorContextBar } from "../../../../../ui/TRN";
import type { StageInspectorTab } from "./stage-inspector-ui-persistence";

export type StageInspectorContextBarProps = {
  activeTab: StageInspectorTab;
  modelCount: number;
  focusedModelLabel: string | null;
  envLabel: string;
  envWired: boolean;
  showGrid: boolean;
};

export function StageInspectorContextBar(props: StageInspectorContextBarProps) {
  const { activeTab, modelCount, focusedModelLabel, envLabel, envWired, showGrid } = props;

  if (activeTab === "scene3d") {
    return (
      <TRNInspectorContextBar
        title="Scene3D"
        subtitle={`${envLabel}${envWired ? " · wired environment" : ""} · grid ${showGrid ? "on" : "off"}`}
        icon={MonitorPlay}
        iconShellClass="border-violet-500/30 bg-violet-950/25 text-violet-300/95"
      />
    );
  }

  if (activeTab === "toolbar") {
    return (
      <TRNInspectorContextBar
        title="Toolbar"
        subtitle="Stage viewport navigation and presentation"
        icon={SlidersHorizontal}
        iconShellClass="border-zinc-600/35 bg-zinc-900/45 text-zinc-300/95"
      />
    );
  }

  const modelSubtitle =
    modelCount === 0
      ? "No models committed"
      : modelCount === 1
        ? `1 model${focusedModelLabel != null ? ` · ${focusedModelLabel}` : ""}`
        : `${modelCount} models${focusedModelLabel != null ? ` · focus ${focusedModelLabel}` : ""}`;

  return (
    <TRNInspectorContextBar
      title="Overview"
      subtitle={`${modelSubtitle} · ${envLabel}`}
      icon={LayoutGrid}
      iconShellClass="border-violet-500/30 bg-violet-950/25 text-violet-300/95"
    />
  );
}
