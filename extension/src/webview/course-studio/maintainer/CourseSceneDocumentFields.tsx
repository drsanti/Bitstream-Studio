import { FileText } from "lucide-react";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import type { SceneV1 } from "../schemas/scene.v1";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { courseScene3dContentJsonPath } from "./courseScene3dBlockPaths";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";

export function CourseSceneDocumentFields({
  documentId,
  scene,
}: {
  documentId: string;
  scene: SceneV1;
}) {
  const patchTitle = useCourseSceneEditorStore((s) => s.patchTitle);
  const jsonPath = courseScene3dContentJsonPath(documentId);

  return (
    <CourseInspectorCard
      id={`${documentId}-scene-document`}
      title="Scene document"
      hint="Title and linked scene.v1 JSON. Models and camera edit in the 3D Scene Editor pane."
      titleIcon={<FileText className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-3">
        <TRNFormField id={`${documentId}-scene-title`} label="Title">
          <TRNInput
            id={`${documentId}-scene-title`}
            variant="outlined"
            size="sm"
            className="w-full"
            value={scene.title ?? ""}
            placeholder="Untitled scene"
            onChange={(event) => patchTitle(documentId, event.target.value)}
          />
        </TRNFormField>

        <TRNFormField
          id={`${documentId}-scene-doc-id`}
          label="Document id"
          hint="Stable id referenced by this page block."
        >
          <TRNInput
            id={`${documentId}-scene-doc-id`}
            variant="outlined"
            size="sm"
            className="w-full"
            value={documentId}
            readOnly
          />
        </TRNFormField>

        <TRNFormField id={`${documentId}-scene-json-path`} label="JSON path">
          <TRNInput
            id={`${documentId}-scene-json-path`}
            variant="outlined"
            size="sm"
            className="w-full"
            value={jsonPath}
            readOnly
          />
        </TRNFormField>

        <TRNHintText>
          Use the 3D Scene Editor workbench pane for hierarchy, transforms, materials, and viewport
          tools. Save via the Scene menu when ready to persist.
        </TRNHintText>
      </div>
    </CourseInspectorCard>
  );
}
