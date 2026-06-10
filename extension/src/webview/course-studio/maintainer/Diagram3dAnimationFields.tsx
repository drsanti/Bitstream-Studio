import { Clapperboard } from "lucide-react";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNToggleSwitch } from "../../ui/TRN/TRNToggleSwitch";
import type { Diagram3dModelNodeV1 } from "../schemas/diagram.v1";
import type { Diagram3dNodePatch } from "../runtime/diagram/diagram3dNodeMutations";
import { isProceduralDiagram3dModelId } from "../runtime/diagram/diagram3dModelId";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";

export function Diagram3dAnimationFields({
  node,
  onPatch,
}: {
  node: Diagram3dModelNodeV1;
  onPatch: (patch: Pick<
    Diagram3dNodePatch,
    "animationClip" | "animationLoop" | "animationPlaying"
  >) => void;
}) {
  if (isProceduralDiagram3dModelId(node.modelId)) {
    return null;
  }

  return (
    <CourseInspectorCard
      title="Animation"
      hint="Play a named clip from the catalog GLB (design-time preview)."
      titleIcon={<Clapperboard className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-3">
        <TRNHintText className="text-[10px]!">
          Enter the clip name exported with the GLB (e.g. <code className="text-2xs">Idle</code>).
          Leave empty to disable playback.
        </TRNHintText>

        <TRNFormField id={`${node.id}-anim-clip`} label="Clip name">
          <TRNInput
            id={`${node.id}-anim-clip`}
            variant="outlined"
            size="sm"
            className="w-full"
            placeholder="Idle"
            value={node.animationClip ?? ""}
            onChange={(event) => {
              const value = event.target.value.trim();
              onPatch({ animationClip: value.length > 0 ? value : null });
            }}
          />
        </TRNFormField>

        <TRNFormField id={`${node.id}-anim-loop`} label="Loop">
          <TRNToggleSwitch
            checked={node.animationLoop !== false}
            ariaLabel="Loop animation clip"
            onCheckedChange={(checked) => onPatch({ animationLoop: checked })}
          />
        </TRNFormField>

        <TRNFormField id={`${node.id}-anim-playing`} label="Playing">
          <TRNToggleSwitch
            checked={node.animationPlaying !== false}
            ariaLabel="Play animation clip"
            onCheckedChange={(checked) => onPatch({ animationPlaying: checked })}
          />
        </TRNFormField>
      </div>
    </CourseInspectorCard>
  );
}
