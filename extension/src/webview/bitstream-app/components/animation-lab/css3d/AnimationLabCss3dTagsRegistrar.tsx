import {
  readMotorLoadPctFromPrimarySignal,
  resolveTwinTagIconAnimation,
  resolveTwinTagIconId,
  twinTagIconSpinDurationS,
} from "../animation-lab-twin-tag-icons.js";
import {
  isTwinTagVisibleForFilter,
  type AnimationLabTwinTagFilterMode,
} from "../animation-lab-twin-tag-filter.js";
import { useGlbAnimationLabTwin } from "../glb-animation-lab-twin-context.js";
import type { AnimationLabTwinComponentLive } from "../digital-twin.types.js";
import { AnimationLabTwinCss3dTag } from "./AnimationLabTwinCss3dTag.js";

function formatTopSignal(value: number, unit: string): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 1;
  return unit.length > 0 ? `${value.toFixed(digits)} ${unit}` : value.toFixed(digits);
}

function isTagActiveInScene(
  row: AnimationLabTwinComponentLive,
  args: {
    filterMode: AnimationLabTwinTagFilterMode;
    selectedComponentId: string | null;
    visible: boolean;
  },
): boolean {
  if (!args.visible) {
    return false;
  }
  return isTwinTagVisibleForFilter({
    filterMode: args.filterMode,
    health: row.health,
    componentId: row.id,
    selectedComponentId: args.selectedComponentId,
  });
}

export type AnimationLabCss3dTagsRegistrarProps = {
  enabled: boolean;
  filterMode?: AnimationLabTwinTagFilterMode;
};

export function AnimationLabCss3dTagsRegistrar(props: AnimationLabCss3dTagsRegistrarProps) {
  const { enabled, filterMode = "all" } = props;
  const twinCtx = useGlbAnimationLabTwin();

  if (!enabled || twinCtx == null || twinCtx.twin == null || twinCtx.components.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
      {twinCtx.components.map((row) => {
        const def = twinCtx.twin.components.find((c) => c.id === row.id);
        const top = twinCtx.resolveCardPrimarySignal(row.id, row.signals);
        const tagStyle = twinCtx.resolveTagStyle(row.id, row.label);
        const iconId = resolveTwinTagIconId({
          componentId: row.id,
          group: def?.group ?? row.group,
          cardIcon: def?.cardIcon,
        });
        const loadPct = readMotorLoadPctFromPrimarySignal(top);
        const active = isTagActiveInScene(row, {
          filterMode,
          selectedComponentId: twinCtx.selectedComponentId,
          visible: tagStyle.visible,
        });
        const iconAnimation = resolveTwinTagIconAnimation({
          health: row.health,
          iconId,
          dataSource: twinCtx.dataSource,
          active,
          animationLevel: tagStyle.iconAnimationLevel,
        });
        return (
          <AnimationLabTwinCss3dTag
            key={row.id}
            componentId={row.id}
            active={active}
            health={row.health}
            style={tagStyle}
            iconId={iconId}
            iconAnimation={iconAnimation}
            iconSpinDurationS={
              iconId === "motor" ? twinTagIconSpinDurationS(loadPct) : undefined
            }
            selected={row.id === twinCtx.selectedComponentId}
            topSignalLabel={top?.label}
            topSignalValue={top != null ? formatTopSignal(top.value, top.unit) : undefined}
            onSelect={() => twinCtx.selectComponent(row.id)}
          />
        );
      })}
    </div>
  );
}
