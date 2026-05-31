import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import {
  getPaletteEntryMeta,
  getSubgroupLabel,
  PALETTE_CATEGORY_LABEL,
  PALETTE_SENSOR_SUBGROUP_ORDER,
  type PaletteSensorSubgroup,
} from "./palette-entry-meta";
import { PaletteCatalogIcon } from "./PaletteCatalogIcon";
import { paletteEntryDnDProps } from "./palette-entry-dnd-props";
import { PalettePreviewAffix } from "./PalettePreviewAffix";
import { usePaletteEntryPreview } from "./usePaletteEntryPreview";

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
  const livePulse = preview.kind === "pulse" ? preview.streamMode : null;
  return (
    <button
      type="button"
      className="flex w-full cursor-grab items-center gap-1.5 rounded border px-2 py-1 text-left text-xs hover:bg-zinc-800/40 active:cursor-grabbing"
      style={{ borderColor }}
      onClick={() => onAddNode(entry)}
      title={entry.description}
      {...paletteEntryDnDProps(entry)}
    >
      <PaletteCatalogIcon icon={entry.icon} livePulse={livePulse} />
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

export function NodePaletteSectioned(props: NodePaletteSectionedProps) {
  const { borderColor, secondaryTextColor, entries, onAddNode } = props;

  const grouped = new Map<NodeCatalogEntry["category"], NodeCatalogEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }

  const sensorNodes = grouped.get("sensor") ?? [];
  const sensorBySubgroup = new Map<PaletteSensorSubgroup, NodeCatalogEntry[]>();
  for (const sg of PALETTE_SENSOR_SUBGROUP_ORDER) {
    sensorBySubgroup.set(sg, []);
  }
  for (const entry of sensorNodes) {
    const meta = getPaletteEntryMeta(entry);
    const sg = meta.sensorSubgroup;
    if (sg != null) {
      sensorBySubgroup.get(sg)?.push(entry);
    }
  }

  return (
    <div className="space-y-3 text-xs">
      {Array.from(grouped.entries()).map(([category, nodes]) => (
        <div key={category} className="space-y-1">
          <div
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: secondaryTextColor }}
          >
            {PALETTE_CATEGORY_LABEL[category]}
          </div>

          {category === "sensor" ? (
            <>
              {PALETTE_SENSOR_SUBGROUP_ORDER.map((sg) => {
                const list = sensorBySubgroup.get(sg) ?? [];
                if (list.length === 0) {
                  return null;
                }
                return (
                  <div key={sg} className="space-y-1">
                    <div
                      className="select-none border-b border-zinc-700/80 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500"
                      style={{ borderColor }}
                    >
                      {getSubgroupLabel(sg)}
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
              })}
            </>
          ) : (
            nodes.map((entry) => (
              <PaletteRowSectioned
                key={entry.id}
                entry={entry}
                borderColor={borderColor}
                onAddNode={onAddNode}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
