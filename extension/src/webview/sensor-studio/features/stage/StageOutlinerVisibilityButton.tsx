import { Eye, EyeOff } from "lucide-react";
import { TRNIconButton } from "../../../ui/TRN/TRNIconButton";
import type { SceneObjectRefV1 } from "../../core/stage/scene-object-ref";
import { sceneObjectSelectionKey } from "../../core/stage/scene-object-ref";
import { useStageOutlinerVisibilityStore } from "../../state/stage-outliner-visibility.store";

type Props = {
  sceneObjectRef: SceneObjectRefV1;
};

export function StageOutlinerVisibilityButton(props: Props) {
  const { sceneObjectRef } = props;
  const selectionKey = sceneObjectSelectionKey(sceneObjectRef);
  const hidden = useStageOutlinerVisibilityStore((s) => s.hiddenKeys.has(selectionKey));
  const toggleHidden = useStageOutlinerVisibilityStore((s) => s.toggleHidden);

  const label = hidden ? "Show on Stage" : "Hide on Stage";

  return (
    <TRNIconButton
      variant="ghost"
      nativeTitle={false}
      className="shrink-0"
      icon={
        hidden ? (
          <EyeOff size={14} className="opacity-70" aria-hidden />
        ) : (
          <Eye size={14} aria-hidden />
        )
      }
      label={label}
      hint={label}
      aria-pressed={hidden}
      onClick={(event) => {
        event.stopPropagation();
        toggleHidden(selectionKey);
      }}
    />
  );
}
