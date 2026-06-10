import { CourseHtmlPageUrlEditor } from "../../maintainer/CourseHtmlPageUrlEditor";
import { CourseHtmlEditorShell } from "../../maintainer/html-editor/CourseHtmlEditorShell";
import { listHtmlPageBlocks } from "../../maintainer/htmlPageBlockWorkbenchLabel";
import {
  useAddHtmlPageBlock,
  useOpenHtmlPageBlockInEditor,
} from "../../maintainer/useAddHtmlPageBlock";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../../maintainer/courseStudioMaintainerMode";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import type { PageBlockV1 } from "../../schemas/page.v1";
import { CourseHtmlPageWorkbenchPaneEmpty } from "./CourseHtmlPageWorkbenchPaneEmpty";
import { CourseWorkbenchPaneEmpty } from "./CourseWorkbenchPaneEmpty";

export function CourseHtmlPageWorkbenchPane() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();
  const addHtmlPageBlock = useAddHtmlPageBlock();
  const openHtmlPageBlock = useOpenHtmlPageBlockInEditor();

  const block =
    page?.blocks.find((entry) => entry.id === selectedBlockId && entry.kind === "html-page") ??
    null;

  if (!maintainerAvailable || !maintainer) {
    return (
      <CourseWorkbenchPaneEmpty
        title="HTML Editor"
        hint="Enable Maintainer mode and select an HTML page block to edit inline HTML or preview a remote file."
      />
    );
  }

  if (page == null) {
    return (
      <CourseWorkbenchPaneEmpty
        title="HTML Editor"
        hint="Open a course page to add and edit HTML page blocks."
      />
    );
  }

  if (block == null) {
    return (
      <CourseHtmlPageWorkbenchPaneEmpty
        htmlPageBlocks={listHtmlPageBlocks(page.blocks)}
        onAddHtmlPage={addHtmlPageBlock}
        onOpenBlock={openHtmlPageBlock}
      />
    );
  }

  return (
    <div className="course-workbench-html-pane flex h-full min-h-0 flex-col overflow-hidden px-1.5 pb-1.5 pt-1">
      {block.url != null ? (
        <CourseHtmlPageUrlEditor
          url={block.url}
          onUrlChange={(url) => updateBlock(block.id, { url, html: undefined })}
          editorSurface="workbench"
          sandboxSameOrigin={block.sandboxSameOrigin}
        />
      ) : (
        <InlineHtmlWorkbenchEditor block={block} />
      )}
    </div>
  );
}

function InlineHtmlWorkbenchEditor({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "html-page" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const html = block.html ?? "";

  return (
    <CourseHtmlEditorShell
      key={block.id}
      value={html}
      onChange={(value) => updateBlock(block.id, { html: value })}
      variant="workbench"
      ariaLabel="Inline HTML"
      sandboxSameOrigin={block.sandboxSameOrigin}
    />
  );
}
