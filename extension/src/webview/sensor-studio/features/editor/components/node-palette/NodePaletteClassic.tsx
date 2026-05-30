import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { PaletteCatalogIcon } from "./PaletteCatalogIcon";
import { paletteEntryDnDProps } from "./palette-entry-dnd-props";
import { PalettePreviewAffix } from "./PalettePreviewAffix";
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
    </button>
  );
}

export function NodePaletteClassic(props: NodePaletteClassicProps) {
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
            {category}
          </div>
          {nodes.map((entry) => (
            <PaletteRowClassic
              key={entry.id}
              entry={entry}
              borderColor={borderColor}
              onAddNode={onAddNode}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
