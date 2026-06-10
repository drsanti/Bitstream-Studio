import { TRNTooltip } from "../../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../../ui/TRN/TRNHintText";
import {
  COURSE_SCENE_PRESETS,
  type CourseScenePresetMeta,
} from "../../content/scenePresetMeta";
import type { CourseSceneTemplate } from "../../content/sceneTemplates";

const PRESET_LIVE_CHIP_CLASS =
  "rounded border border-emerald-500/30 px-1 py-px text-[10px] font-medium leading-none text-emerald-400";

type CourseScenePresetGridProps = {
  spanLabel: string;
  onSelectTemplate: (template: CourseSceneTemplate) => void;
};

function ScenePresetCard({
  preset,
  spanLabel,
  onSelect,
}: {
  preset: CourseScenePresetMeta;
  spanLabel: string;
  onSelect: (template: CourseSceneTemplate) => void;
}) {
  const Icon = preset.icon;
  const hint = `Adds a ${spanLabel} 3D Scene block — ${preset.description}`;

  return (
    <TRNTooltip
      content={hint}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      disableHoverFx
      triggerWrapper="span"
      className="block min-w-0"
      triggerClassName="flex w-full min-w-0"
      trigger={
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(preset.template);
          }}
          className={`flex w-full min-w-0 flex-col gap-1 rounded-lg border px-2.5 py-2 text-left transition-colors ${preset.accentClassName}`}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
            <span className="min-w-0 truncate text-[11px] font-semibold text-zinc-100">
              {preset.title}
            </span>
            {preset.liveBinding ? (
              <span className={`${PRESET_LIVE_CHIP_CLASS} ml-auto shrink-0`}>Live</span>
            ) : null}
          </span>
          <span className="line-clamp-2 text-[10px] leading-snug text-zinc-500">
            {preset.description}
          </span>
        </button>
      }
    />
  );
}

export function CourseScenePresetGrid({ spanLabel, onSelectTemplate }: CourseScenePresetGridProps) {
  return (
    <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
      {COURSE_SCENE_PRESETS.map((preset) => (
        <ScenePresetCard
          key={preset.template}
          preset={preset}
          spanLabel={spanLabel}
          onSelect={onSelectTemplate}
        />
      ))}
    </div>
  );
}
