import { useState } from "react";
import type { StagePresentationPreferences } from "../../../stage/stage-presentation-preferences";
import { CanvasInspectorStage3dCard } from "./CanvasInspectorStage3dCard";
import {
  readStageToolbarCardCollapsed,
  writeStageToolbarCardCollapsed,
} from "./stage-inspector-ui-persistence";

export type StageInspectorToolbarTabProps = {
  stagePresentationPreferences: StagePresentationPreferences;
  onStagePresentationPreferencesChange: (
    patch: Partial<StagePresentationPreferences>,
  ) => void;
};

export function StageInspectorToolbarTab(props: StageInspectorToolbarTabProps) {
  const { stagePresentationPreferences, onStagePresentationPreferencesChange } = props;

  const [collapsed, setCollapsed] = useState(
    () => readStageToolbarCardCollapsed()["presentation-policy"] ?? false,
  );

  const setCardCollapsed = (next: boolean) => {
    setCollapsed(next);
    writeStageToolbarCardCollapsed({ "presentation-policy": next });
  };

  return (
    <CanvasInspectorStage3dCard
      preferences={stagePresentationPreferences}
      onPreferencesChange={onStagePresentationPreferencesChange}
      collapsed={collapsed}
      onCollapsedChange={setCardCollapsed}
    />
  );
}
