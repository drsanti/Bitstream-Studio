import { CourseMarkdownFileEditor } from "../../maintainer/CourseMarkdownFileEditor";
import { CourseMarkdownUrlEditor } from "../../maintainer/CourseMarkdownUrlEditor";
import { CourseMarkdownEditorShell } from "../../maintainer/markdown-editor/CourseMarkdownEditorShell";
import { listMarkdownPageBlocks } from "../../maintainer/markdownBlockWorkbenchLabel";
import {
  useAddMarkdownBlock,
  useOpenMarkdownBlockInEditor,
} from "../../maintainer/useAddMarkdownBlock";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../../maintainer/courseStudioMaintainerMode";
import type { PageBlockV1 } from "../../schemas/page.v1";
import { CourseMarkdownBlockContent } from "../../ui/catalog/CourseMarkdownBlockShell";
import { CourseMarkdownWorkbenchPaneEmpty } from "./CourseMarkdownWorkbenchPaneEmpty";
import { CourseWorkbenchPaneEmpty } from "./CourseWorkbenchPaneEmpty";

export function CourseMarkdownWorkbenchPane() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();
  const addMarkdownBlock = useAddMarkdownBlock();
  const openMarkdownBlock = useOpenMarkdownBlockInEditor();

  const block =
    page?.blocks.find((entry) => entry.id === selectedBlockId && entry.kind === "markdown") ?? null;

  if (!maintainerAvailable || !maintainer) {
    return (
      <CourseWorkbenchPaneEmpty
        title="Markdown editor"
        hint="Enable Maintainer mode and select a Markdown block to edit inline or external theory files."
      />
    );
  }

  if (page == null) {
    return (
      <CourseWorkbenchPaneEmpty
        title="Markdown editor"
        hint="Open a course page to add and edit Markdown blocks."
      />
    );
  }

  if (block == null) {
    return (
      <CourseMarkdownWorkbenchPaneEmpty
        markdownBlocks={listMarkdownPageBlocks(page.blocks)}
        onAddMarkdown={addMarkdownBlock}
        onOpenBlock={openMarkdownBlock}
      />
    );
  }

  return (
    <div className="course-workbench-markdown-pane flex h-full min-h-0 flex-col overflow-hidden px-1.5 pb-1.5 pt-1">
      {block.src != null ? (
        <CourseMarkdownFileEditor
          src={block.src}
          embedded
          editorSurface="workbench"
          colors={block.colors}
        />
      ) : block.url != null ? (
        <CourseMarkdownUrlEditor
          url={block.url}
          embedded
          editorSurface="workbench"
          colors={block.colors}
          onUrlChange={(url) => updateBlock(block.id, { url, markdown: undefined, src: undefined })}
        />
      ) : (
        <InlineMarkdownWorkbenchEditor block={block} />
      )}
    </div>
  );
}

function InlineMarkdownWorkbenchEditor({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "markdown" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const pageDirty = useCoursePageEditorStore((s) => s.dirty);
  const markdown = block.markdown ?? "";

  return (
    <CourseMarkdownEditorShell
      key={block.id}
      value={markdown}
      onChange={(value) => updateBlock(block.id, { markdown: value })}
      variant="workbench"
      pageDirty={pageDirty}
      ariaLabel="Inline markdown"
      preview={
        <CourseMarkdownBlockContent
          markdown={markdown}
          colors={block.colors}
          className="rounded-md border-0"
        />
      }
    />
  );
}
