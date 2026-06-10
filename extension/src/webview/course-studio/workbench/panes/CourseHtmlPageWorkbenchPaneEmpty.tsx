import { CodeXml, Plus } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { htmlPageBlockWorkbenchLabel, listHtmlPageBlocks } from "../../maintainer/htmlPageBlockWorkbenchLabel";
import type { PageBlockV1 } from "../../schemas/page.v1";
import { COURSE_WORKBENCH_PANE_LABELS } from "../course-workbench-pane-labels";

type CourseHtmlPageWorkbenchPaneEmptyProps = {
  htmlPageBlocks: Extract<PageBlockV1, { kind: "html-page" }>[];
  onAddHtmlPage: () => void;
  onOpenBlock: (blockId: string) => void;
};

export function CourseHtmlPageWorkbenchPaneEmpty({
  htmlPageBlocks,
  onAddHtmlPage,
  onOpenBlock,
}: CourseHtmlPageWorkbenchPaneEmptyProps) {
  return (
    <div className="course-workbench-pane-scroll scrollbar-hide flex h-full min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-8 text-center">
      <CodeXml className="h-8 w-8 text-emerald-400/80" aria-hidden />
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {COURSE_WORKBENCH_PANE_LABELS["html-page"]}
        </h3>
        <TRNHintText>
          Select an HTML page block on the grid, or add one to edit inline HTML or preview a remote file.
        </TRNHintText>
      </div>
      <TRNButton size="compact" onClick={onAddHtmlPage}>
        <Plus size={14} strokeWidth={2} className="mr-1 inline" />
        Add HTML page block
      </TRNButton>
      {htmlPageBlocks.length > 0 ? (
        <ul className="flex w-full max-w-sm flex-col gap-1 text-left">
          {htmlPageBlocks.map((block) => (
            <li key={block.id}>
              <button
                type="button"
                className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:border-zinc-600/80 hover:bg-zinc-800/40 hover:text-[var(--text-primary)]"
                onClick={() => onOpenBlock(block.id)}
              >
                <span className="font-medium text-[var(--text-primary)]">{block.id}</span>
                <span className="mt-0.5 block truncate text-[10px] text-[var(--text-muted)]">
                  {htmlPageBlockWorkbenchLabel(block)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
