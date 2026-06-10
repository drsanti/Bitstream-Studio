import { Captions } from "lucide-react";
import { CourseEmojiTextField } from "./CourseEmojiTextField";
import type { PageBlockV1 } from "../schemas/page.v1";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

/** Page-block caption shown above the embedded 3D viewport on the Content grid. */
export function CourseScene3dPageBlockFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "scene-3d" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);

  return (
    <CourseInspectorCard
      id={`${block.id}-scene-page-caption`}
      title="Caption"
      hint="Optional label above the 3D viewport on the published page."
      titleIcon={<Captions className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded
    >
      <CourseEmojiTextField
        id={`${block.id}-caption`}
        label="Caption"
        value={block.caption ?? ""}
        onChange={(caption) => updateBlock(block.id, { caption })}
      />
    </CourseInspectorCard>
  );
}

/** @deprecated Use {@link CourseScene3dPageBlockFields}. */
export function CourseScene3dBlockFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "scene-3d" }>;
}) {
  return <CourseScene3dPageBlockFields block={block} />;
}

/** Block-level fields for the contextual 3D Scene inspector (caption only). */
export function CourseScene3dBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "scene-3d" }>;
}) {
  return (
    <div className="course-scene-3d-block-inspector flex flex-col gap-3">
      <CourseScene3dPageBlockFields block={block} />
    </div>
  );
}
