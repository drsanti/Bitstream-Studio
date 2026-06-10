import { Box, Plus } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { initCourseScenesForPage } from "../../content/initCourseScenesForPage";
import { insertCourseScene3dBlock } from "../../maintainer/insertCourseScene3dDemoBlocks";
import { focusCourseScene3dPaneTarget } from "../../maintainer/focusCourseScene3dPaneTarget";
import {
  listCourseScene3dPaneTargets,
  type CourseScene3dPaneTarget,
} from "../../maintainer/courseScene3dPaneTargets";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import { useFocusCourseWorkbenchEditor } from "../useFocusCourseWorkbenchEditor";
import type { PageV1 } from "../../schemas/page.v1";

function TargetRow({
  target,
  onSelect,
}: {
  target: CourseScene3dPaneTarget;
  onSelect: (blockId: string) => void;
}) {
  return (
    <TRNButton
      size="compact"
      className="w-full justify-start border-[var(--surface-border)] text-left"
      onClick={() => onSelect(target.blockId)}
    >
      <Box size={13} strokeWidth={2} className="mr-1.5 inline shrink-0 text-zinc-400" />
      <span className="truncate">{target.label}</span>
    </TRNButton>
  );
}

function DemoInsertActions({ page }: { page: PageV1 }) {
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const focusWorkbenchEditor = useFocusCourseWorkbenchEditor();

  const insertAndFocus = () => {
    const block = insertCourseScene3dBlock(page);
    const nextPage = { ...page, blocks: [...page.blocks, block] };
    addBlock(block);
    initCourseScenesForPage(nextPage);
    focusCourseScene3dPaneTarget(block.id, {
      selectBlock,
      focusWorkbenchEditor,
    }, nextPage);
  };

  return (
    <TRNButton
      size="compact"
      className="w-full justify-start border-[var(--surface-border)] text-left"
      hint="Insert bundled pilot PCB orientation 3D Scene block"
      onClick={insertAndFocus}
    >
      <Plus size={13} strokeWidth={2} className="mr-1.5 inline shrink-0 text-zinc-400" />
      Add pilot PCB 3D Scene
    </TRNButton>
  );
}

export function CourseScene3dPaneGuide({
  page,
  variant = "pick-target",
}: {
  page: PageV1;
  variant?: "pick-target" | "no-targets";
}) {
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const focusWorkbenchEditor = useFocusCourseWorkbenchEditor();
  const targets = listCourseScene3dPaneTargets(page);

  const focusBlock = (blockId: string) => {
    focusCourseScene3dPaneTarget(blockId, {
      selectBlock,
      focusWorkbenchEditor,
    }, page);
  };

  if (variant === "no-targets" || targets.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-1">
        <TRNHintText>
          Add a 3D Scene block to author GLB models, transforms, and camera defaults in the 3D
          Scene Editor workbench pane.
        </TRNHintText>
        <DemoInsertActions page={page} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-1">
      <TRNHintText>Select a 3D Scene block below to open it in the editor.</TRNHintText>
      <div className="flex flex-col gap-1.5">
        {targets.map((target) => (
          <TargetRow key={target.blockId} target={target} onSelect={focusBlock} />
        ))}
      </div>
      <DemoInsertActions page={page} />
    </div>
  );
}
