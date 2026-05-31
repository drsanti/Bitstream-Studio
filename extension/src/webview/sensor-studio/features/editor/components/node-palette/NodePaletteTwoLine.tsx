import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { getPaletteEntryMeta, PALETTE_CATEGORY_LABEL } from "./palette-entry-meta";
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
    entry.category === "sensor" && meta.subtitle.length > 0 ? meta.subtitle : entry.description;
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

export function NodePaletteTwoLine(props: NodePaletteTwoLineProps) {
  const { borderColor, secondaryTextColor, entries, onAddNode } = props;

  const grouped = new Map<NodeCatalogEntry["category"], NodeCatalogEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
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
          {nodes.map((entry) => (
            <PaletteRowTwoLine
              key={entry.id}
              entry={entry}
              borderColor={borderColor}
              category={category}
              onAddNode={onAddNode}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
