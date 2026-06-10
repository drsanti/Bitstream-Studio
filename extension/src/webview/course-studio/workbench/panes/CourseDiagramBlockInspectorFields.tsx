import { useMemo } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { CourseEmojiTextField } from "../../maintainer/CourseEmojiTextField";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  persistNewCourseDiagramToDev,
  registerNewCourseDiagram,
} from "../../content/diagramTemplates";
import { useCourseDiagramIds } from "../../content/diagramRegistry";
import type { PageBlockV1 } from "../../schemas/page.v1";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import { COURSE_WORKBENCH_PANE_LABELS } from "../course-workbench-pane-labels";

export function CourseDiagramBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "diagram-2d" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const diagramIds = useCourseDiagramIds();
  const diagramOptions = useMemo(
    () => diagramIds.map((id) => ({ value: id, label: id })),
    [diagramIds],
  );

  return (
    <div className="flex flex-col gap-3">
      <TRNFormField id={`${block.id}-diagram`} label="Diagram id">
        <TRNSelect
          value={block.diagramId}
          ariaLabel="Diagram id"
          options={diagramOptions}
          onValueChange={(value) => updateBlock(block.id, { diagramId: value })}
        />
      </TRNFormField>
      <CourseEmojiTextField
        id={`${block.id}-caption`}
        label="Caption"
        value={block.caption ?? ""}
        onChange={(caption) => updateBlock(block.id, { caption })}
      />
      <div className="flex flex-wrap gap-1.5">
        <TRNButton
          size="compact"
          onClick={() => {
            const built = registerNewCourseDiagram("live-canvas-demo");
            updateBlock(block.id, { diagramId: built.diagramId });
            void persistNewCourseDiagramToDev(built);
          }}
        >
          Live canvas demo
        </TRNButton>
        <TRNButton
          size="compact"
          onClick={() => {
            const built = registerNewCourseDiagram("blank");
            updateBlock(block.id, { diagramId: built.diagramId });
            void persistNewCourseDiagramToDev(built);
          }}
        >
          New blank diagram
        </TRNButton>
        <TRNButton
          size="compact"
          onClick={() => {
            const built = registerNewCourseDiagram("from-pilot");
            updateBlock(block.id, { diagramId: built.diagramId });
            void persistNewCourseDiagramToDev(built);
          }}
        >
          Duplicate MEMS pilot
        </TRNButton>
      </div>
      <TRNHintText>
        Block placement is on the {COURSE_WORKBENCH_PANE_LABELS.content}. Shape style and data
        bindings are in the sections below when the Diagram canvas is active.
      </TRNHintText>
    </div>
  );
}
