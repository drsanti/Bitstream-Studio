import { Ban, Sparkles } from "lucide-react";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNSelect, type TRNSelectOption } from "../../../ui/TRN/TRNSelect";
import type { PresentationCalloutVariant } from "../../../presentation/components/callout-tokens";
import type { CardBlockColors } from "../../schemas/cardBlockColors";
import { patchCardBlockColor } from "../../schemas/cardBlockColors";
import type { CourseTitleIconAnimation } from "../../schemas/courseTitleIconAnimation";
import {
  COURSE_CALLOUT_ICON_DEFAULT,
  COURSE_TITLE_ICON_CATALOG,
  COURSE_TITLE_ICON_COLOR_DEFAULT_HEX,
  COURSE_TITLE_ICON_NONE,
  calloutDefaultIconColorHex,
  calloutIconSelectValue,
  optionalTitleIconSelectValue,
  patchTitleIconFromSelect,
  resolveCourseLucideIcon,
} from "../../schemas/courseTitleIcon";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";
import { CourseBlockColorRow } from "./CourseBlockColorRow";
import { CourseTitleIconAnimationFields } from "./CourseTitleIconAnimationFields";

const ICON_PREVIEW_CLASS = "size-4 shrink-0 text-zinc-300";

function iconOption(value: string, label: string): TRNSelectOption {
  const Icon = resolveCourseLucideIcon(value);
  return {
    value,
    label,
    icon: Icon != null ? <Icon className={ICON_PREVIEW_CLASS} strokeWidth={2} aria-hidden /> : undefined,
  };
}

function buildOptionalOptions(): TRNSelectOption[] {
  return [
    {
      value: "",
      label: "None",
      icon: <Ban className={ICON_PREVIEW_CLASS} strokeWidth={2} aria-hidden />,
    },
    ...COURSE_TITLE_ICON_CATALOG.map((entry) =>
      iconOption(entry.value, entry.label),
    ),
  ];
}

function buildCalloutOptions(): TRNSelectOption[] {
  return [
    {
      value: COURSE_CALLOUT_ICON_DEFAULT,
      label: "Variant default",
      icon: <Sparkles className={ICON_PREVIEW_CLASS} strokeWidth={2} aria-hidden />,
    },
    {
      value: COURSE_TITLE_ICON_NONE,
      label: "None",
      icon: <Ban className={ICON_PREVIEW_CLASS} strokeWidth={2} aria-hidden />,
    },
    ...COURSE_TITLE_ICON_CATALOG.map((entry) =>
      iconOption(entry.value, entry.label),
    ),
  ];
}

const OPTIONAL_OPTIONS = buildOptionalOptions();
const CALLOUT_OPTIONS = buildCalloutOptions();

export type CourseTitleIconColorTarget =
  | { kind: "block" }
  | { kind: "card"; colors: CardBlockColors | undefined };

export function CourseTitleIconField({
  blockId,
  icon,
  iconColor,
  iconAnimation,
  mode,
  id,
  hint,
  colorTarget,
  defaultIconColorHex,
  calloutVariant,
  showAnimation = true,
}: {
  blockId: string;
  icon?: string;
  iconColor?: string;
  iconAnimation?: CourseTitleIconAnimation;
  mode: "optional" | "callout";
  id: string;
  hint?: string;
  colorTarget: CourseTitleIconColorTarget;
  defaultIconColorHex?: string;
  calloutVariant?: PresentationCalloutVariant;
  /** When false, prefix icon + color only (animation lives in a sibling inspector card). */
  showAnimation?: boolean;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const options = mode === "callout" ? CALLOUT_OPTIONS : OPTIONAL_OPTIONS;
  const value =
    mode === "callout" ? calloutIconSelectValue(icon) : optionalTitleIconSelectValue(icon);

  const resolvedDefaultHex =
    calloutVariant != null
      ? calloutDefaultIconColorHex(calloutVariant)
      : (defaultIconColorHex ?? COURSE_TITLE_ICON_COLOR_DEFAULT_HEX.heading);

  const effectiveIconColor =
    colorTarget.kind === "card" ? colorTarget.colors?.icon : iconColor;

  const handleIconColorChange = (next: string | undefined) => {
    if (colorTarget.kind === "card") {
      updateBlock(blockId, {
        colors: patchCardBlockColor(colorTarget.colors, "icon", next),
      });
      return;
    }
    updateBlock(blockId, { iconColor: next });
  };

  return (
    <div className="flex flex-col gap-2">
      <TRNFormField id={id} label="Prefix icon">
        <TRNSelect
          value={value}
          ariaLabel="Title prefix icon"
          options={options}
          showSelectedIconInTrigger
          variant="field"
          size="sm"
          className="w-full"
          onValueChange={(next) => {
            updateBlock(blockId, patchTitleIconFromSelect(next, mode));
          }}
        />
        {hint != null ? <TRNHintText>{hint}</TRNHintText> : null}
      </TRNFormField>
      <CourseBlockColorRow
        label="Icon color"
        value={effectiveIconColor}
        defaultHex={resolvedDefaultHex}
        onChange={handleIconColorChange}
      />
      {showAnimation ? (
        <CourseTitleIconAnimationFields
          blockId={blockId}
          iconAnimation={iconAnimation}
          defaultPeakColorHex={effectiveIconColor ?? resolvedDefaultHex}
        />
      ) : null}
    </div>
  );
}
