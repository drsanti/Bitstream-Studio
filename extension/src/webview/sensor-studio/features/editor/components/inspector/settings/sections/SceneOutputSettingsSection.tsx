import {
  applyStageScene3dPresentation,
  STAGE_DEFAULT_SHOW_GRID,
  stageSceneOutputDefaultScene3d,
} from "../../../../../../core/stage/stage-scene-defaults";
import {
  coerceScene3DConfigV1,
  persistScene3DConfig,
} from "../../../../../../core/scene3d/scene3d-config";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { useStagePresentationPreferences } from "../../../../../stage/stage-presentation-preferences";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import { StageMeshesOnlyScenePreferencesSection } from "../../StageMeshesOnlyScenePreferencesSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

function formatStudioEnvironmentLabel(studioAssetId: unknown): string {
  if (typeof studioAssetId !== "string" || studioAssetId.trim().length === 0) {
    return "Engine preset";
  }
  const parts = studioAssetId.trim().split(".");
  const tail = parts[parts.length - 1] ?? studioAssetId;
  if (tail.length === 0) {
    return studioAssetId;
  }
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

export function SceneOutputSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const { preferences: stagePreferences, patchPreferences: patchStagePreferences } =
    useStagePresentationPreferences();
  const liveEnv = selectedNode.data.liveEnvironmentWire;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const showGrid =
    typeof dc.showGrid === "boolean" ? dc.showGrid : STAGE_DEFAULT_SHOW_GRID;
  const baseScene =
    dc.scene3d != null
      ? coerceScene3DConfigV1(dc.scene3d)
      : stageSceneOutputDefaultScene3d();
  const envId =
    liveEnv?.studioAssetId != null && liveEnv.studioAssetId.length > 0
      ? liveEnv.studioAssetId
      : baseScene.environment.studioAssetId;
  const envLabel = formatStudioEnvironmentLabel(envId);

  const patchShowGrid = (next: boolean) => {
    onUpdateConfigField("showGrid", next);
    onUpdateConfigField(
      "scene3d",
      persistScene3DConfig(
        applyStageScene3dPresentation(baseScene, { showGrid: next }),
      ),
    );
    useFlowEditorStore.getState().tickSimulation({ forceStageSnapshot: true });
  };

  return (
    <>
    <InspectorSettingsSectionFrame title="Scene Output">
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
        Commits wired models and scene wires to the{" "}
        <span className="font-medium text-zinc-400">Stage</span> workbench pane (not this flow card).
        Open the Stage pane to preview the full application viewport. Model Viewer on the canvas is
        for authoring only.
      </p>
      <div className="space-y-2.5">
        <InspectorCompactToggleRow
          label="Floor grid"
          hint="Synced to scene3d.helpers.grid.enabled. Also toggled from the Stage toolbar."
          checked={showGrid}
          onCheckedChange={patchShowGrid}
          ariaLabel="Show floor grid on Stage"
        />
        <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-2.5 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Environment (committed)
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-zinc-200">{envLabel}</div>
          {liveEnv != null ? (
            <p className="mt-1 text-[10px] leading-snug text-zinc-500">
              From wired Environment node. Disconnect the wire to use Scene Output baked defaults.
            </p>
          ) : (
            <p className="mt-1 text-[10px] leading-snug text-zinc-500">
              Baked in scene3d when no Environment wire is connected.
            </p>
          )}
        </div>
      </div>
    </InspectorSettingsSectionFrame>
    <InspectorSettingsSectionFrame title="Meshes-only scene">
      <p className="mb-2.5 text-[11px] leading-relaxed text-zinc-500">
        When <span className="text-zinc-400">Meshes</span> is wired and{" "}
        <span className="text-zinc-400">Models</span> is empty, the Stage shows procedural content
        only (no baked demo GLB).
      </p>
      <StageMeshesOnlyScenePreferencesSection
        preferences={stagePreferences}
        onPreferencesChange={patchStagePreferences}
        showHeading={false}
      />
    </InspectorSettingsSectionFrame>
    </>
  );
}
