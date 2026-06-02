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

export function NodePaletteAccordion(props: NodePaletteAccordionProps) {
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
                  <details key={sg} open className="group rounded border border-zinc-700/60 bg-zinc-900/30">
                    <summary
                      className="cursor-pointer select-none list-none px-2 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800/50 [&::-webkit-details-marker]:hidden"
                      style={{ borderColor }}
                    >
                      <span className="inline-flex w-full items-center justify-between gap-1">
                        <span>{getSubgroupLabel(sg)}</span>
                        <span className="text-[10px] font-normal text-zinc-500">{list.length}</span>
                      </span>
                    </summary>
                    <div className="space-y-1 border-t border-zinc-800/80 px-1.5 py-1.5">
                      {list.map((entry) => {
                        const meta = getPaletteEntryMeta(entry);
                        return (
                          <PaletteRowAccordionSensor
                            key={entry.id}
                            entry={entry}
                            borderColor={borderColor}
                            onAddNode={onAddNode}
                            chip={meta.chip}
                          />
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </>
          ) : (
            nodes.map((entry) => (
              <PaletteRowAccordionOther
                key={entry.id}
                entry={entry}
                borderColor={borderColor}
                category={category}
                onAddNode={onAddNode}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
