import type { StagePresentationPreferences } from "../../../stage/stage-presentation-preferences";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";

export type StageMeshesOnlyScenePreferencesSectionProps = {
  preferences: StagePresentationPreferences;
  onPreferencesChange: (patch: Partial<StagePresentationPreferences>) => void;
  /** When true, show the section heading (default true). */
  showHeading?: boolean;
};

export function StageMeshesOnlyScenePreferencesSection(
  props: StageMeshesOnlyScenePreferencesSectionProps,
) {
  const { preferences, onPreferencesChange, showHeading = true } = props;

  return (
    <div className="space-y-2">
      {showHeading ? (
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Meshes-only scene
        </div>
      ) : null}
      <InspectorCompactToggleRow
        label="Hide spawn until meshes"
        hint="Box/Sphere/Plane toolbar icons stay hidden until Scene Output has at least one wired mesh."
        checked={preferences.hideSpawnWhenNoMeshes}
        onCheckedChange={(next) => onPreferencesChange({ hideSpawnWhenNoMeshes: next })}
        ariaLabel="Hide procedural spawn toolbar until meshes are wired"
      />
      <InspectorCompactToggleRow
        label="Auto-disconnect Models wires"
        hint="While the committed scene is meshes-only, remove Scene Output Models edges from model-select (and other model sources)."
        checked={preferences.autoDisconnectOrphanModelSources}
        onCheckedChange={(next) =>
          onPreferencesChange({ autoDisconnectOrphanModelSources: next })
        }
        ariaLabel="Auto-disconnect orphan Scene Output model wires when meshes-only"
      />
    </div>
  );
}
