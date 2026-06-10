import { FileText } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { PAGE_BLOCK_PALETTE } from "../../maintainer/blockFactory";
import { formatGridSpanLabel } from "../../schemas/embedBlocks";
import {
  markdownBlockWorkbenchLabel,
  type MarkdownPageBlock,
} from "../../maintainer/markdownBlockWorkbenchLabel";
import { COURSE_WORKBENCH_PANE_LABELS } from "../course-workbench-pane-labels";

const MARKDOWN_PALETTE = PAGE_BLOCK_PALETTE.find((entry) => entry.kind === "markdown");
const MARKDOWN_SPAN_LABEL =
  MARKDOWN_PALETTE != null
    ? formatGridSpanLabel(
        MARKDOWN_PALETTE.defaultSpan.columnSpan,
        MARKDOWN_PALETTE.defaultSpan.rowSpan,
      )
    : "6×4";

type CourseMarkdownWorkbenchPaneEmptyProps = {
  markdownBlocks: readonly MarkdownPageBlock[];
  onAddMarkdown: () => void;
  onOpenBlock: (blockId: string) => void;
};

export function CourseMarkdownWorkbenchPaneEmpty({
  markdownBlocks,
  onAddMarkdown,
  onOpenBlock,
}: CourseMarkdownWorkbenchPaneEmptyProps) {
  const hasMarkdownBlocks = markdownBlocks.length > 0;

  return (
    <div className="course-workbench-pane-scroll scrollbar-hide flex h-full min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-8 text-center">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/60 text-zinc-300"
        aria-hidden
      >
        <FileText className="h-5 w-5" strokeWidth={2} />
      </span>

      <div className="flex max-w-md flex-col gap-1.5">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {hasMarkdownBlocks ? "Select a Markdown block" : "No Markdown block yet"}
        </p>
        <TRNHintText>
          {hasMarkdownBlocks ? (
            <>
              You have {markdownBlocks.length} Markdown block
              {markdownBlocks.length === 1 ? "" : "s"} on this page. Open one below or click a
              Markdown cell on the {COURSE_WORKBENCH_PANE_LABELS.content}.
            </>
          ) : (
            <>
              Write theory, equations (KaTeX <code className="text-zinc-400">$</code> /{" "}
              <code className="text-zinc-400">$$</code>), and callouts. Edit here in split view with
              live preview.
            </>
          )}
        </TRNHintText>
      </div>

      {hasMarkdownBlocks ? (
        <ul className="flex w-full max-w-md flex-col gap-1.5 text-left">
          {markdownBlocks.map((block) => (
            <li
              key={block.id}
              className="flex min-w-0 items-center gap-2 rounded-md border border-zinc-800/80 bg-zinc-900/35 px-2 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-200">
                {markdownBlockWorkbenchLabel(block)}
              </span>
              <TRNButton
                size="compact"
                className="shrink-0"
                onClick={() => onOpenBlock(block.id)}
              >
                Open in editor
              </TRNButton>
            </li>
          ))}
        </ul>
      ) : null}

      <TRNButton
        size="compact"
        className="border-sky-500/35 bg-sky-500/12"
        hint={`Adds a ${MARKDOWN_SPAN_LABEL} inline Markdown block and opens it here.`}
        onClick={onAddMarkdown}
      >
        <FileText size={13} strokeWidth={2} className="mr-1 inline" aria-hidden />
        Add Markdown block
      </TRNButton>

      {!hasMarkdownBlocks ? (
        <TRNHintText className="max-w-sm">
          Default: inline markdown · {MARKDOWN_SPAN_LABEL} grid · undo supported
        </TRNHintText>
      ) : null}
    </div>
  );
}
