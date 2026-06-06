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

type NodePaletteAccordionProps = {
  borderColor: string;
  secondaryTextColor: string;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
};

function PaletteRowAccordionSensor(props: {
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
      className="flex w-full cursor-grab items-center gap-1.5 rounded border px-2 py-1 text-left text-[11px] hover:bg-zinc-800/40 active:cursor-grabbing"
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

function PaletteRowAccordionOther(props: {
  entry: NodeCatalogEntry;
  borderColor: string;
  category: NodeCatalogEntry["category"];
  onAddNode: (entry: NodeCatalogEntry) => void;
}) {
  const { entry, borderColor, category, onAddNode } = props;
  const preview = usePaletteEntryPreview(entry);
  const { livePulse, pulseTriggerKey } = paletteIconPulseFromPreview(preview);
  return (
    <button
      type="button"
      className="w-full cursor-grab rounded border px-2 py-1 text-left text-xs hover:bg-zinc-800/40 active:cursor-grabbing"
      style={{ borderColor }}
      onClick={() => onAddNode(entry)}
      title={entry.description}
      {...paletteEntryDnDProps(entry)}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        <PaletteCatalogIcon icon={entry.icon} className="mt-0.5 shrink-0" livePulse={livePulse} pulseTriggerKey={pulseTriggerKey} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-start justify-between gap-1">
            <span className="min-w-0 flex-1 truncate">{entry.title}</span>
            <div className="flex shrink-0 items-center gap-1">
              <PalettePreviewAffix preview={preview} />
              <span className="text-[9px] text-zinc-600">{PALETTE_CATEGORY_LABEL[category]}</span>
            </div>
          </div>
          <div className="line-clamp-2 text-left text-[10px] text-zinc-500">{entry.description}</div>
        </div>
      </div>
    </button>
  );
}

function renderSubgroupAccordion<T extends string>(props: {
  order: readonly T[];
  bySubgroup: Map<T, NodeCatalogEntry[]>;
  labelFor: (sg: T) => string;
  borderColor: string;
  onAddNode: (entry: NodeCatalogEntry) => void;
  row: "sensor" | "other";
  category: NodeCatalogEntry["category"];
}) {
  const { order, bySubgroup, labelFor, borderColor, onAddNode, row, category } = props;
  return order.map((sg) => {
    const list = bySubgroup.get(sg) ?? [];
    if (list.length === 0) {
      return null;
    }
    return (
      <details key={sg} open className="group rounded border border-zinc-700/60 bg-zinc-900/30">
        <summary
          className="cursor-pointer select-none list-none px-2 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800/50 [&::-webkit-details-marker]:hidden"
          style={{ borderColor }}
        >
          <span className="inline-flex w-full items-center justify-between gap-1">
            <span>{labelFor(sg)}</span>
            <span className="text-[10px] font-normal text-zinc-500">{list.length}</span>
          </span>
        </summary>
        <div className="space-y-1 border-t border-zinc-800/80 px-1.5 py-1.5">
          {list.map((entry) => {
            const meta = getPaletteEntryMeta(entry);
            return row === "sensor" ? (
              <PaletteRowAccordionSensor
                key={entry.id}
                entry={entry}
                borderColor={borderColor}
                onAddNode={onAddNode}
                chip={meta.chip}
              />
            ) : (
              <PaletteRowAccordionOther
                key={entry.id}
                entry={entry}
                borderColor={borderColor}
                category={category}
                onAddNode={onAddNode}
              />
            );
          })}
        </div>
      </details>
    );
  });
}

export function NodePaletteAccordion(props: NodePaletteAccordionProps) {
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
              ? renderSubgroupAccordion({
                  order: PALETTE_SENSOR_SUBGROUP_ORDER,
                  bySubgroup: sensorBySubgroup,
                  labelFor: (sg) => getSubgroupLabel(sg as PaletteSensorSubgroup),
                  borderColor,
                  onAddNode,
                  row: "sensor",
                  category,
                })
              : null}

            {category === "scene"
              ? renderSubgroupAccordion({
                  order: PALETTE_SCENE_SUBGROUP_ORDER,
                  bySubgroup: sceneBySubgroup,
                  labelFor: (sg) => getSceneSubgroupLabel(sg as PaletteSceneSubgroup),
                  borderColor,
                  onAddNode,
                  row: "other",
                  category,
                })
              : null}

            {category !== "sensor" && category !== "scene"
              ? nodes.map((entry) => (
                  <PaletteRowAccordionOther
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
