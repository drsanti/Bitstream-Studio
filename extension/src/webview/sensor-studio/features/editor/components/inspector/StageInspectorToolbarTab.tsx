import { useState } from "react";
import type { StudioViewportMousePreset } from "../../../../core/viewport/studio-viewport-mouse-preset";
import type { StudioViewportViewSnapMode } from "../../../../core/viewport/studio-viewport-view-snaps";
import type { StagePresentationPreferences } from "../../../stage/stage-presentation-preferences";
import { CanvasInspectorStage3dCard } from "./CanvasInspectorStage3dCard";
import { StageInspectorNavigationCard } from "./StageInspectorNavigationCard";
import {
  readStageToolbarCardCollapsed,
  writeStageToolbarCardCollapsed,
} from "./stage-inspector-ui-persistence";

export type StageInspectorToolbarTabProps = {
  stagePresentationPreferences: StagePresentationPreferences;
  onStagePresentationPreferencesChange: (
    patch: Partial<StagePresentationPreferences>,
  ) => void;
  viewportMousePreset: StudioViewportMousePreset;
  viewportViewSnapMode: StudioViewportViewSnapMode;
  onViewportMousePresetChange: (preset: StudioViewportMousePreset) => void;
  onViewportViewSnapModeChange: (mode: StudioViewportViewSnapMode) => void;
};

export function StageInspectorToolbarTab(props: StageInspectorToolbarTabProps) {
  const {
    stagePresentationPreferences,
    onStagePresentationPreferencesChange,
    viewportMousePreset,
    viewportViewSnapMode,
    onViewportMousePresetChange,
    onViewportViewSnapModeChange,
  } = props;

  const [collapsed, setCollapsed] = useState(
    () => readStageToolbarCardCollapsed()["presentation-policy"] ?? false,
  );

  const setCardCollapsed = (next: boolean) => {
    setCollapsed(next);
    writeStageToolbarCardCollapsed({ "presentation-policy": next });
  };

  return (
    <div className="space-y-2">
      <StageInspectorNavigationCard
        mousePreset={viewportMousePreset}
        viewSnapMode={viewportViewSnapMode}
        onMousePresetChange={onViewportMousePresetChange}
        onViewSnapModeChange={onViewportViewSnapModeChange}
      />
      <CanvasInspectorStage3dCard
        preferences={stagePresentationPreferences}
        onPreferencesChange={onStagePresentationPreferencesChange}
        collapsed={collapsed}
        onCollapsedChange={setCardCollapsed}
      />
    </div>
  );
}
