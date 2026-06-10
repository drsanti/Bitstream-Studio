import { Box } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { PAGE_BLOCK_PALETTE } from "../../maintainer/blockFactory";
import { formatGridSpanLabel } from "../../schemas/embedBlocks";
import {
  listScene3dPageBlocks,
  scene3dBlockWorkbenchLabel,
} from "../../maintainer/scene3dBlockWorkbenchLabel";
import type { PageV1 } from "../../schemas/page.v1";
import type { CourseSceneTemplate } from "../../content/sceneTemplates";
import { useAddScene3dBlock, useOpenScene3dBlockInEditor } from "../../maintainer/useAddScene3dBlock";
import { CourseScenePresetGrid } from "./CourseScenePresetGrid";

const SCENE_PALETTE = PAGE_BLOCK_PALETTE.find((entry) => entry.kind === "scene-3d");
const SCENE_SPAN_LABEL =
  SCENE_PALETTE != null
    ? formatGridSpanLabel(
        SCENE_PALETTE.defaultSpan.columnSpan,
        SCENE_PALETTE.defaultSpan.rowSpan,
      )
    : "5×4";

const SECTION_LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-wide text-zinc-500";

type CourseScene3dWorkbenchPaneEmptyProps = {
  page: PageV1;
};

export function CourseScene3dWorkbenchPaneEmpty({ page }: CourseScene3dWorkbenchPaneEmptyProps) {
  const sceneBlocks = listScene3dPageBlocks(page.blocks);
  const hasSceneBlocks = sceneBlocks.length > 0;
  const addSceneBlock = useAddScene3dBlock();
  const openSceneBlock = useOpenScene3dBlockInEditor();

  const handlePreset = (template: CourseSceneTemplate) => {
    addSceneBlock(template);
  };

  return (
    <div className="course-workbench-pane-scroll scrollbar-hide flex h-full min-h-0 flex-col items-center overflow-y-auto px-4 py-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-5 text-center">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/60 text-zinc-300"
          aria-hidden
        >
          <Box className="h-5 w-5" strokeWidth={2} />
        </span>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {hasSceneBlocks ? "Select a 3D Scene block" : "3D Scene Editor"}
          </p>
          <TRNHintText>
            {hasSceneBlocks ? (
              <>
                You have {sceneBlocks.length} 3D Scene block
                {sceneBlocks.length === 1 ? "" : "s"} on this page. Open one below or pick a
                template to add another.
              </>
            ) : (
              <>
                Author GLB models, transforms, camera defaults, and environment for each 3D Scene
                block. Start from a template or a blank stage.
              </>
            )}
          </TRNHintText>
        </div>

        {hasSceneBlocks ? (
          <div className="flex w-full flex-col gap-2 text-left">
            <p className={SECTION_LABEL_CLASS}>On this page</p>
            <ul className="flex flex-col gap-1.5">
              {sceneBlocks.map((block) => (
                <li
                  key={block.id}
                  className="flex min-w-0 items-center gap-2 rounded-md border border-zinc-800/80 bg-zinc-900/35 px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-200">
                    {scene3dBlockWorkbenchLabel(block)}
                  </span>
                  <TRNButton
                    size="compact"
                    className="shrink-0"
                    onClick={() => openSceneBlock(block.id)}
                  >
                    Open in editor
                  </TRNButton>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-2 text-left">
          <p className={SECTION_LABEL_CLASS}>New from template</p>
          <CourseScenePresetGrid spanLabel={SCENE_SPAN_LABEL} onSelectTemplate={handlePreset} />
        </div>

        <TRNHintText className="max-w-sm text-center">
          Default grid span {SCENE_SPAN_LABEL} · undo supported in dev · Live templates need
          Bitstream or Simulator
        </TRNHintText>
      </div>
    </div>
  );
}
