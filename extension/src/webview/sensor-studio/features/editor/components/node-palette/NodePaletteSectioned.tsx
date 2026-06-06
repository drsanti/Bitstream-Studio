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
import { PaletteCatalogIcon } from "./PaletteCatalogIcon";
import { paletteEntryDnDProps } from "./palette-entry-dnd-props";
import { PalettePreviewAffix } from "./PalettePreviewAffix";
import { paletteIconPulseFromPreview } from "./palette-icon-pulse";
import { usePaletteEntryPreview } from "./usePaletteEntryPreview";
import {
  buildPaletteSubgroupMap,
  resolvePaletteSceneSubgroup,
  resolvePaletteSensorSubgroup,
} from "./palette-subgroup-layout";

type NodePaletteSectionedProps = {
  borderColor: string;
  secondaryTextColor: string;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
};

function PaletteRowSectioned(props: {
  entry: NodeCatalogEntry;
  borderColor: string;
  onAddNode: (entry: NodeCatalogEntry) => void;
  chip?: string | null;
}) {
  const { entry, borderColor, onAddNode, chip } = props;
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
      {chip != null ? (
        <span className="shrink-0 rounded border border-cyan-500/35 bg-cyan-950/40 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-cyan-200/90">
          {chip}
        </span>
      ) : null}
    </button>
  );
}

function renderSubgroupSections(props: {
  order: readonly string[];
  bySubgroup: Map<string, NodeCatalogEntry[]>;
  labelFor: (sg: string) => string;
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
        <div
          className="select-none border-b border-zinc-700/80 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500"
          style={{ borderColor }}
        >
          {labelFor(sg)}
        </div>
        {list.map((entry) => {
          const meta = getPaletteEntryMeta(entry);
          return (
            <PaletteRowSectioned
              key={entry.id}
              entry={entry}
              borderColor={borderColor}
              onAddNode={onAddNode}
              chip={meta.chip}
            />
          );
        })}
      </div>
    );
  });
}

export function NodePaletteSectioned(props: NodePaletteSectionedProps) {
  const { borderColor, secondaryTextColor, entries, onAddNode } = props;

  const grouped = new Map<NodeCatalogEntry["category"], NodeCatalogEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
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
              ? renderSubgroupSections({
                  order: PALETTE_SENSOR_SUBGROUP_ORDER,
                  bySubgroup: sensorBySubgroup as Map<string, NodeCatalogEntry[]>,
                  labelFor: (sg) => getSubgroupLabel(sg as PaletteSensorSubgroup),
                  borderColor,
                  onAddNode,
                })
              : null}

            {category === "scene"
              ? renderSubgroupSections({
                  order: PALETTE_SCENE_SUBGROUP_ORDER,
                  bySubgroup: sceneBySubgroup as Map<string, NodeCatalogEntry[]>,
                  labelFor: (sg) => getSceneSubgroupLabel(sg as PaletteSceneSubgroup),
                  borderColor,
                  onAddNode,
                })
              : null}

            {category !== "sensor" && category !== "scene"
              ? nodes.map((entry) => (
                  <PaletteRowSectioned
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
