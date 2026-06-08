import { MonitorPlay } from "lucide-react";
import type {
  Stage3DOverridePolicy,
  StagePresentationPreferences,
} from "../../../stage/stage-presentation-preferences";
import { CanvasInspectorCard } from "./CanvasInspectorCard";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { StageMeshesOnlyScenePreferencesSection } from "./StageMeshesOnlyScenePreferencesSection";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import {
  InspectorSegmentButtonGroup,
  type InspectorSegmentOption,
} from "./InspectorSegmentButtonGroup";

const POLICY_OPTIONS: InspectorSegmentOption<Stage3DOverridePolicy>[] = [
  {
    value: "sync-wired-nodes",
    label: "Sync nodes",
    hint: "Stage toolbar updates Scene Output and wired source nodes.",
  },
  {
    value: "scene-output-only",
    label: "Scene only",
    hint: "Toolbar updates Scene Output committed scene3d only.",
  },
  {
    value: "toolbar-readonly",
    label: "Off",
    hint: "Use flow nodes only; hide Stage presentation toolbar controls.",
  },
];

export type CanvasInspectorStage3dCardProps = {
  preferences: StagePresentationPreferences;
  onPreferencesChange: (patch: Partial<StagePresentationPreferences>) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function CanvasInspectorStage3dCard(props: CanvasInspectorStage3dCardProps) {
  const { preferences, onPreferencesChange, collapsed, onCollapsedChange } = props;
  const syncMode = preferences.policy === "sync-wired-nodes";

  return (
    <CanvasInspectorCard
      id="canvas-inspector-card-stage-3d"
      title="3D Scene (Stage)"
      hint="How the Stage toolbar overrides Scene Output and wired flow nodes."
      collapsible
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <p className="mb-2.5 text-[10px] leading-snug text-zinc-500">
        Matches toolbar icons: model, cubemap, backdrop, IBL, grid, fog. Grid and fog always
        commit to Scene Output.
      </p>
      <InspectorPropertyRow label="Override policy">
        <InspectorSegmentButtonGroup
          ariaLabel="Stage 3D Scene override policy"
          layout="stack"
          value={preferences.policy}
          options={POLICY_OPTIONS}
          onChange={(next) =>
            onPreferencesChange({ policy: next as Stage3DOverridePolicy })
          }
        />
      </InspectorPropertyRow>
      {syncMode ? (
        <div className="mt-2.5 space-y-2 border-t border-zinc-800/60 pt-2.5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Sync wired node
          </div>
          <InspectorCompactToggleRow
            label="Studio model"
            hint="Box icon — patches focused model-select node."
            checked={preferences.syncStudioModel}
            onCheckedChange={(next) => onPreferencesChange({ syncStudioModel: next })}
            ariaLabel="Sync Studio model from Stage toolbar"
          />
          <InspectorCompactToggleRow
            label="Cubemap / HDRI"
            hint="Image icon — patches Environment preset on wired env."
            checked={preferences.syncCubemap}
            onCheckedChange={(next) => onPreferencesChange({ syncCubemap: next })}
            ariaLabel="Sync cubemap from Stage toolbar"
          />
          <InspectorCompactToggleRow
            label="Backdrop"
            hint="Cloud icon — Background texture on wired Environment."
            checked={preferences.syncBackdrop}
            onCheckedChange={(next) => onPreferencesChange({ syncBackdrop: next })}
            ariaLabel="Sync backdrop from Stage toolbar"
          />
          <InspectorCompactToggleRow
            label="IBL"
            hint="Sparkles icon — Use IBL on wired Environment."
            checked={preferences.syncIbl}
            onCheckedChange={(next) => onPreferencesChange({ syncIbl: next })}
            ariaLabel="Sync IBL from Stage toolbar"
          />
        </div>
      ) : (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-zinc-700/55 bg-zinc-900/35 px-2 py-1.5">
          <MonitorPlay className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/80" aria-hidden />
          <p className="text-[10px] leading-snug text-zinc-500">
            {preferences.policy === "toolbar-readonly"
              ? "Open the Stage pane for view-only orbit; edit presentation on flow nodes or Scene Output inspector."
              : "Stage toolbar writes Scene Output scene3d only — Environment and model-select cards stay unchanged."}
          </p>
        </div>
      )}
      <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5">
        <StageMeshesOnlyScenePreferencesSection
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
        />
      </div>
    </CanvasInspectorCard>
  );
}
