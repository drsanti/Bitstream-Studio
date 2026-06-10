import { Plus, Trash2 } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNIconButton } from "../../../ui/TRN/TRNIconButton";
import {
  COURSE_TITLE_ICON_ANIMATION_DEFAULTS,
  COURSE_TITLE_ICON_COLOR_CYCLE_MAX,
  COURSE_TITLE_ICON_COLOR_CYCLE_MIN,
  defaultIconAnimationColorCycleSeed,
} from "../../schemas/courseTitleIconAnimation";
import { CourseBlockColorRow } from "./CourseBlockColorRow";

export function resolveIconAnimationColorCycleForEditor(
  colors: string[] | undefined,
  defaultHex: string,
): string[] {
  if (colors != null && colors.length >= COURSE_TITLE_ICON_COLOR_CYCLE_MIN) {
    return colors;
  }
  if (colors != null && colors.length === 1) {
    return [colors[0]!, COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customColorPeak];
  }
  return defaultIconAnimationColorCycleSeed(defaultHex);
}

export function CourseTitleIconColorCycleEditor({
  blockId,
  colors,
  defaultHex,
  onChange,
}: {
  blockId: string;
  colors: string[] | undefined;
  defaultHex: string;
  onChange: (colors: string[]) => void;
}) {
  const list = resolveIconAnimationColorCycleForEditor(colors, defaultHex);

  const patchAt = (index: number, hex: string | undefined) => {
    const next = [...list];
    if (hex == null || hex.length === 0) {
      return;
    }
    next[index] = hex;
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (list.length <= COURSE_TITLE_ICON_COLOR_CYCLE_MIN) {
      return;
    }
    onChange(list.filter((_, i) => i !== index));
  };

  const addColor = () => {
    if (list.length >= COURSE_TITLE_ICON_COLOR_CYCLE_MAX) {
      return;
    }
    onChange([...list, COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customColorPeak]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] text-zinc-400">
        Color cycle — fades A → B → C → A (duration = seconds per step)
      </div>
      {list.map((hex, index) => (
        <div key={`${blockId}-icon-color-${index}`} className="flex min-w-0 items-center gap-0.5">
          <div className="min-w-0 flex-1">
            <CourseBlockColorRow
              label={`Color ${index + 1}`}
              value={hex}
              defaultHex={defaultHex}
              onChange={(next) => patchAt(index, next ?? hex)}
            />
          </div>
          {list.length > COURSE_TITLE_ICON_COLOR_CYCLE_MIN ? (
            <TRNIconButton
              variant="ghost"
              className="mt-0.5 h-6 w-6 shrink-0"
              icon={<Trash2 size={12} strokeWidth={2.25} aria-hidden />}
              label={`Remove color ${index + 1}`}
              nativeTitle={false}
              hint="Remove from cycle"
              onClick={() => removeAt(index)}
            />
          ) : null}
        </div>
      ))}
      {list.length < COURSE_TITLE_ICON_COLOR_CYCLE_MAX ? (
        <TRNButton size="compact" className="w-fit" onClick={addColor}>
          <Plus size={12} strokeWidth={2.25} aria-hidden />
          Add color
        </TRNButton>
      ) : null}
    </div>
  );
}
