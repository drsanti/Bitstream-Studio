import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import {
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

type NodePaletteClassicProps = {
  borderColor: string;
  secondaryTextColor: string;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
};

function PaletteRowClassic(props: {
  entry: NodeCatalogEntry;
  borderColor: string;
  onAddNode: (entry: NodeCatalogEntry) => void;
}) {
  const { entry, borderColor, onAddNode } = props;
  const preview = usePaletteEntryPreview(entry);
  const { livePulse, pulseTriggerKey } = paletteIconPulseFromPreview(preview);
  return (
    <button
      type="button"
      className="flex w-full cursor-grab items-center gap-1.5 rounded border px-2 py-1 text-left text-xs hover:bg-zinc-800/40 active:cursor-grabbing"
      style={{ borderColor }}
      onClick={() => onAddNode(entry)}
      title={entry.description}
      {...paletteEntryDnDProps(entry)}
    >
      <PaletteCatalogIcon icon={entry.icon} livePulse={livePulse} pulseTriggerKey={pulseTriggerKey} />
      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
      <PalettePreviewAffix preview={preview} />
    </button>
  );
}

function renderSubgroupClassic<T extends string>(props: {
  order: readonly T[];
  bySubgroup: Map<T, NodeCatalogEntry[]>;
  labelFor: (sg: T) => string;
  borderColor: string;
  onAddNode: (entry: NodeCatalogEntry) => void;
}) {
  const { order, bySubgroup, labelFor, borderColor, onAddNode } = props;
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
          <PaletteRowClassic key={entry.id} entry={entry} borderColor={borderColor} onAddNode={onAddNode} />
        ))}
      </div>
    );
  });
}

export function NodePaletteClassic(props: NodePaletteClassicProps) {
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
              ? renderSubgroupClassic({
                  order: PALETTE_SENSOR_SUBGROUP_ORDER,
                  bySubgroup: sensorBySubgroup,
                  labelFor: (sg) => getSubgroupLabel(sg as PaletteSensorSubgroup),
                  borderColor,
                  onAddNode,
                })
              : null}

            {category === "scene"
              ? renderSubgroupClassic({
                  order: PALETTE_SCENE_SUBGROUP_ORDER,
                  bySubgroup: sceneBySubgroup,
                  labelFor: (sg) => getSceneSubgroupLabel(sg as PaletteSceneSubgroup),
                  borderColor,
                  onAddNode,
                })
              : null}

            {category !== "sensor" && category !== "scene"
              ? nodes.map((entry) => (
                  <PaletteRowClassic
                    key={entry.id}
                    entry={entry}
                    borderColor={borderColor}
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
