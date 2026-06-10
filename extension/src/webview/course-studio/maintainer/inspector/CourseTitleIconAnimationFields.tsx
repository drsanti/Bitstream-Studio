import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";
import {
  COURSE_TITLE_ICON_ANIMATION_DEFAULTS,
  COURSE_TITLE_ICON_ANIMATION_EASES,
  COURSE_TITLE_ICON_ANIMATION_PRESETS,
  defaultIconAnimationColorCycleSeed,
  type CourseTitleIconAnimation,
  normalizeCourseTitleIconAnimationPreset,
  patchCourseTitleIconAnimation,
} from "../../schemas/courseTitleIconAnimation";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";
import { CourseBlockColorRow } from "./CourseBlockColorRow";
import { CourseTitleIconColorCycleEditor } from "./CourseTitleIconColorCycleEditor";

const PRESET_OPTIONS = [
  { value: "none", label: "None" },
  { value: "pulse", label: "Pulse (scale)" },
  { value: "spin", label: "Spin" },
  { value: "swing", label: "Swing (rotation)" },
  { value: "float", label: "Float (position)" },
  { value: "color-breathe", label: "Color breathe (single peak)" },
  { value: "color-cycle", label: "Color cycle (multi)" },
  { value: "custom", label: "Custom" },
] as const;

const EASE_OPTIONS = COURSE_TITLE_ICON_ANIMATION_EASES.map((ease) => ({
  value: ease,
  label: ease === "none" ? "Linear" : ease,
}));

export function CourseTitleIconAnimationFields({
  blockId,
  iconAnimation,
  defaultPeakColorHex,
}: {
  blockId: string;
  iconAnimation?: CourseTitleIconAnimation;
  defaultPeakColorHex: string;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const preset = normalizeCourseTitleIconAnimationPreset(iconAnimation?.preset);
  const isCustom = preset === "custom";
  const isColorCyclePreset = preset === "color-cycle";
  const isColorBreathePreset = preset === "color-breathe";
  const showColorCycle =
    isColorCyclePreset ||
    (isColorBreathePreset &&
      (iconAnimation?.color?.colors?.length ?? 0) >= 2) ||
    (isCustom && iconAnimation?.color?.enabled !== false);
  const showSinglePeak =
    isColorBreathePreset && (iconAnimation?.color?.colors?.length ?? 0) < 2;

  const patchAnimation = (patch: Partial<NonNullable<CourseTitleIconAnimation>>) => {
    updateBlock(blockId, {
      iconAnimation: patchCourseTitleIconAnimation(iconAnimation, patch),
    });
  };

  const patchColorCycle = (colors: string[]) => {
    patchAnimation({
      color: {
        enabled: true,
        colors,
      },
    });
  };

  const durationLabel = isColorCyclePreset || showColorCycle ? "Step (s)" : "Duration (s)";
  const durationValue = iconAnimation?.duration ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.duration;

  return (
    <div className="flex flex-col gap-2">
      <TRNFormField id={`${blockId}-icon-anim-preset`} label="Preset">
        <TRNSelect
          value={preset}
          ariaLabel="Icon animation preset"
          options={PRESET_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          variant="field"
          size="sm"
          className="w-full"
          onValueChange={(value) => {
            const nextPreset = value as (typeof COURSE_TITLE_ICON_ANIMATION_PRESETS)[number];
            if (nextPreset === "none") {
              updateBlock(blockId, { iconAnimation: undefined });
              return;
            }
            if (nextPreset === "color-cycle") {
              patchAnimation({
                preset: nextPreset,
                color: {
                  enabled: true,
                  colors: defaultIconAnimationColorCycleSeed(defaultPeakColorHex),
                },
              });
              return;
            }
            patchAnimation({ preset: nextPreset });
          }}
        />
      </TRNFormField>

      {preset !== "none" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <TRNFormField id={`${blockId}-icon-anim-duration`} label={durationLabel}>
              <CourseMaintainerScrubNumberField
                ariaLabel={`Icon animation ${durationLabel.toLowerCase()}`}
                value={durationValue}
                min={0.15}
                max={30}
                step={0.05}
                fractionDigits={2}
                defaultValue={COURSE_TITLE_ICON_ANIMATION_DEFAULTS.duration}
                onChange={(duration) => patchAnimation({ duration })}
              />
            </TRNFormField>
            <TRNFormField id={`${blockId}-icon-anim-ease`} label="Ease">
              <TRNSelect
                value={iconAnimation?.ease ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.ease}
                ariaLabel="Icon animation ease"
                options={EASE_OPTIONS}
                variant="field"
                size="sm"
                className="w-full"
                onValueChange={(ease) =>
                  patchAnimation({
                    ease: ease as (typeof COURSE_TITLE_ICON_ANIMATION_EASES)[number],
                  })
                }
              />
            </TRNFormField>
          </div>

          {!isColorCyclePreset ? (
            <>
              <TRNInlineToggleRow
                label="Yoyo"
                hint="Reverse the tween on each repeat so motion returns to the start."
                checked={iconAnimation?.yoyo ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.yoyo}
                onCheckedChange={(yoyo) => patchAnimation({ yoyo })}
              />
              <TRNInlineToggleRow
                label="Loop"
                hint="Repeat the animation while the block is visible."
                checked={
                  (iconAnimation?.repeat ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.repeat) === -1
                }
                onCheckedChange={(loop) => patchAnimation({ repeat: loop ? -1 : 0, loop })}
              />
            </>
          ) : null}

          {isCustom ? (
            <div className="flex flex-col gap-2 border-t border-white/6 pt-2">
              <TRNInlineToggleRow
                label="Motion"
                hint="Tween scale, rotation, and position on the prefix icon."
                checked={iconAnimation?.motion?.enabled !== false}
                onCheckedChange={(enabled) =>
                  patchAnimation({
                    motion: { ...(iconAnimation?.motion ?? {}), enabled },
                  })
                }
              />
              {iconAnimation?.motion?.enabled !== false ? (
                <div className="grid grid-cols-2 gap-2">
                  <TRNFormField id={`${blockId}-icon-anim-x`} label="X (px)">
                    <CourseMaintainerScrubNumberField
                      ariaLabel="Icon motion X offset in pixels"
                      value={iconAnimation?.motion?.x ?? 0}
                      min={-48}
                      max={48}
                      step={1}
                      fractionDigits={0}
                      defaultValue={0}
                      onChange={(x) =>
                        patchAnimation({ motion: { ...(iconAnimation?.motion ?? {}), x } })
                      }
                    />
                  </TRNFormField>
                  <TRNFormField id={`${blockId}-icon-anim-y`} label="Y (px)">
                    <CourseMaintainerScrubNumberField
                      ariaLabel="Icon motion Y offset in pixels"
                      value={iconAnimation?.motion?.y ?? 0}
                      min={-48}
                      max={48}
                      step={1}
                      fractionDigits={0}
                      defaultValue={0}
                      onChange={(y) =>
                        patchAnimation({ motion: { ...(iconAnimation?.motion ?? {}), y } })
                      }
                    />
                  </TRNFormField>
                  <TRNFormField id={`${blockId}-icon-anim-scale`} label="Scale">
                    <CourseMaintainerScrubNumberField
                      ariaLabel="Icon motion scale"
                      value={
                        iconAnimation?.motion?.scale ??
                        COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.scale
                      }
                      min={0.25}
                      max={2.5}
                      step={0.01}
                      fractionDigits={2}
                      defaultValue={COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.scale}
                      onChange={(scale) =>
                        patchAnimation({ motion: { ...(iconAnimation?.motion ?? {}), scale } })
                      }
                    />
                  </TRNFormField>
                  <TRNFormField id={`${blockId}-icon-anim-rotation`} label="Rotation (°)">
                    <CourseMaintainerScrubNumberField
                      ariaLabel="Icon motion rotation in degrees"
                      value={
                        iconAnimation?.motion?.rotation ??
                        COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.rotation
                      }
                      min={-360}
                      max={360}
                      step={1}
                      fractionDigits={0}
                      defaultValue={COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.rotation}
                      onChange={(rotation) =>
                        patchAnimation({
                          motion: { ...(iconAnimation?.motion ?? {}), rotation },
                        })
                      }
                    />
                  </TRNFormField>
                </div>
              ) : null}

              <TRNInlineToggleRow
                label="Color"
                hint="Fade or cycle icon color while motion runs (or alone when motion is off)."
                checked={iconAnimation?.color?.enabled !== false}
                onCheckedChange={(enabled) =>
                  patchAnimation({
                    color: enabled
                      ? {
                          enabled: true,
                          colors: defaultIconAnimationColorCycleSeed(defaultPeakColorHex),
                        }
                      : { enabled: false },
                  })
                }
              />
            </div>
          ) : null}

          {showColorCycle ? (
            <CourseTitleIconColorCycleEditor
              blockId={blockId}
              colors={iconAnimation?.color?.colors}
              defaultHex={defaultPeakColorHex}
              onChange={patchColorCycle}
            />
          ) : null}

          {showSinglePeak ? (
            <div className="flex flex-col gap-2">
              <CourseBlockColorRow
                label="Peak color"
                value={iconAnimation?.color?.to}
                defaultHex={defaultPeakColorHex}
                onChange={(to) =>
                  patchAnimation({
                    color: {
                      ...(iconAnimation?.color ?? {}),
                      enabled: true,
                      to,
                      colors: undefined,
                    },
                  })
                }
              />
              <TRNButtonLink
                blockId={blockId}
                onEnableCycle={() =>
                  patchAnimation({
                    color: {
                      enabled: true,
                      colors: defaultIconAnimationColorCycleSeed(defaultPeakColorHex),
                    },
                  })
                }
              />
            </div>
          ) : null}

          <TRNHintText>
            Motion tweens scale, rotation, and position. Color cycle fades between each swatch in
            order, then wraps to the first. Honors prefers-reduced-motion in View mode and VSIX.
          </TRNHintText>
        </>
      ) : null}
    </div>
  );
}

function TRNButtonLink({
  blockId,
  onEnableCycle,
}: {
  blockId: string;
  onEnableCycle: () => void;
}) {
  return (
    <button
      type="button"
      id={`${blockId}-icon-anim-enable-cycle`}
      className="w-fit text-left text-[11px] text-cyan-400/90 underline-offset-2 hover:underline"
      onClick={onEnableCycle}
    >
      Use multi-color cycle instead
    </button>
  );
}
