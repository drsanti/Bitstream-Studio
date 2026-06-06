import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import {
  getPaletteEntryMeta,
  getSceneSubgroupLabel,
  getSubgroupLabel,
  PALETTE_CATEGORY_LABEL,
  PALETTE_SCENE_SUBGROUP_ORDER,
  PALETTE_SENSOR_SUBGROUP_ORDER,
  type PaletteSceneSubgroup,
  type PaletteSensorSubgroup,
} from "./palette-entry-meta";
import { PALETTE_CATEGORY_ORDER } from "./palette-category-meta";
import {
  buildPaletteSubgroupMap,
  resolvePaletteSceneSubgroup,
  resolvePaletteSensorSubgroup,
} from "./palette-subgroup-layout";
import { PaletteCatalogIcon } from "./PaletteCatalogIcon";
import { paletteEntryDnDProps } from "./palette-entry-dnd-props";
import { PalettePreviewAffix } from "./PalettePreviewAffix";
import { paletteIconPulseFromPreview } from "./palette-icon-pulse";
import { usePaletteEntryPreview } from "./usePaletteEntryPreview";

type NodePaletteTwoLineProps = {
  borderColor: string;
  secondaryTextColor: string;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
};

function PaletteRowTwoLine(props: {
  entry: NodeCatalogEntry;
  borderColor: string;
  category: NodeCatalogEntry["category"];
  onAddNode: (entry: NodeCatalogEntry) => void;
}) {
  const { entry, borderColor, category, onAddNode } = props;
  const meta = getPaletteEntryMeta(entry);
  const preview = usePaletteEntryPreview(entry);
  const { livePulse, pulseTriggerKey } = paletteIconPulseFromPreview(preview);
  const topRight =
    meta.chip != null ? (
      <span className="shrink-0 rounded border border-cyan-500/35 bg-cyan-950/40 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-cyan-200/90">
        {meta.chip}
      </span>
    ) : (
      <span className="shrink-0 text-[9px] uppercase tracking-wide text-zinc-600">
        {PALETTE_CATEGORY_LABEL[category]}
      </span>
    );
  const sub =
    (entry.category === "sensor" || entry.category === "scene") && meta.subtitle.length > 0
      ? meta.subtitle
      : entry.description;
  return (
    <button
      type="button"
      className="w-full cursor-grab rounded border px-2 py-1.5 text-left hover:bg-zinc-800/40 active:cursor-grabbing"
      style={{ borderColor }}
      onClick={() => onAddNode(entry)}
      title={entry.description}
      {...paletteEntryDnDProps(entry)}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        <PaletteCatalogIcon icon={entry.icon} className="mt-0.5 shrink-0" livePulse={livePulse} pulseTriggerKey={pulseTriggerKey} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-start justify-between gap-1">
            <span className="min-w-0 truncate font-medium leading-snug text-zinc-100">{entry.title}</span>
            <div className="flex shrink-0 items-center gap-1">
              <PalettePreviewAffix preview={preview} />
              {topRight}
            </div>
          </div>
          <div className="line-clamp-2 text-[10px] leading-snug text-zinc-500">{sub}</div>
        </div>
      </div>
    </button>
  );
}

function renderSubgroupTwoLine<T extends string>(props: {
  order: readonly T[];
  bySubgroup: Map<T, NodeCatalogEntry[]>;
  labelFor: (sg: T) => string;
  borderColor: string;
  category: NodeCatalogEntry["category"];
  onAddNode: (entry: NodeCatalogEntry) => void;
}) {
  const { order, bySubgroup, labelFor, borderColor, category, onAddNode } = props;
  return order.map((sg) => {
    const list = bySubgroup.get(sg) ?? [];
    if (list.length === 0) {
      return null;
    }
    return (
      <div key={sg} className="space-y-1">
        <div className="select-none border-b border-zinc-700/80 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {labelFor(sg)}
        </div>
        {list.map((entry) => (
          <PaletteRowTwoLine
            key={entry.id}
            entry={entry}
            borderColor={borderColor}
            category={category}
            onAddNode={onAddNode}
          />
        ))}
      </div>
    );
  });
}

export function NodePaletteTwoLine(props: NodePaletteTwoLineProps) {
  const { borderColor, secondaryTextColor, entries, onAddNode } = props;

  const grouped = new Map<NodeCatalogEntry["category"], NodeCatalogEntry[]>();
  for (const c of PALETTE_CATEGORY_ORDER) {
    grouped.set(c, []);
  }
  for (const entry of entries) {
    grouped.get(entry.category)?.push(entry);
  }

  const sensorBySubgroup = buildPaletteSubgroupMap(
    PALETTE_SENSOR_SUBGROUP_ORDER,
    grouped.get("sensor") ?? [],
    resolvePaletteSensorSubgroup,
  );

  const sceneBySubgroup = buildPaletteSubgroupMap(
    PALETTE_SCENE_SUBGROUP_ORDER,
    grouped.get("scene") ?? [],
    resolvePaletteSceneSubgroup,
  );

  return (
    <div className="space-y-3 text-xs">
      {PALETTE_CATEGORY_ORDER.map((category) => {
        const nodes = grouped.get(category) ?? [];
        if (nodes.length === 0) {
          return null;
        }
        return (
          <div key={category} className="space-y-1">
            <div
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: secondaryTextColor }}
            >
              {PALETTE_CATEGORY_LABEL[category]}
            </div>

            {category === "sensor"
              ? renderSubgroupTwoLine({
                  order: PALETTE_SENSOR_SUBGROUP_ORDER,
                  bySubgroup: sensorBySubgroup,
                  labelFor: (sg) => getSubgroupLabel(sg as PaletteSensorSubgroup),
                  borderColor,
                  category,
                  onAddNode,
                })
              : null}

            {category === "scene"
              ? renderSubgroupTwoLine({
                  order: PALETTE_SCENE_SUBGROUP_ORDER,
                  bySubgroup: sceneBySubgroup,
                  labelFor: (sg) => getSceneSubgroupLabel(sg as PaletteSceneSubgroup),
                  borderColor,
                  category,
                  onAddNode,
                })
              : null}

            {category !== "sensor" && category !== "scene"
              ? nodes.map((entry) => (
                  <PaletteRowTwoLine
                    key={entry.id}
                    entry={entry}
                    borderColor={borderColor}
                    category={category}
                    onAddNode={onAddNode}
                  />
                ))
              : null}
          </div>
        );
      })}
    </div>
  );
}
