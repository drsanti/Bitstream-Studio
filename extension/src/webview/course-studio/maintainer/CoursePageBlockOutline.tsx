import { PAGE_BLOCK_PALETTE } from "./blockFactory";
import type { PageBlockV1 } from "../schemas/page.v1";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

function blockKindLabel(kind: string): string {
  return PAGE_BLOCK_PALETTE.find((entry) => entry.kind === kind)?.label ?? kind;
}

export function CoursePageBlockOutline({
  blocks,
  selectedBlockId,
}: {
  blocks: readonly PageBlockV1[];
  selectedBlockId: string | null;
}) {
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);

  if (blocks.length === 0) {
    return (
      <p className="text-[10px] text-[var(--text-muted)]">No blocks on this page yet.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5" role="listbox" aria-label="Page blocks">
      {blocks.map((block) => {
        const selected = block.id === selectedBlockId;
        const { placement } = block;
        return (
          <li key={block.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={`flex w-full min-w-0 items-center gap-2 rounded px-2 py-1 text-left text-[10px] transition-colors ${
                selected
                  ? "bg-[color-mix(in_srgb,var(--accent-amber)_12%,transparent)] text-[var(--text-primary)] ring-1 ring-[color-mix(in_srgb,var(--accent-amber)_45%,transparent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
              onClick={() => selectBlock(block.id)}
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  selected ? "bg-[var(--accent-amber)]" : "bg-[var(--text-muted)]/50"
                }`}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-medium">{blockKindLabel(block.kind)}</span>
              <span className="shrink-0 text-[var(--text-muted)]">
                {placement.columnSpan}×{placement.rowSpan}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
