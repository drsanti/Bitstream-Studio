import { TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { CourseDocumentIdentityFields, CourseTelemetryLinkHealthFields } from "./CourseDocumentFieldGroups";
import { CoursePackControlsPanel } from "./CoursePackControlsPanel";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseDocumentSettingsPanel({ embedded = false }: { embedded?: boolean }) {
  const page = useCoursePageEditorStore((s) => s.page);

  if (page == null) {
    return null;
  }

  const content = (
    <div className="flex flex-col gap-3">
      <CourseDocumentIdentityFields />
      <CourseTelemetryLinkHealthFields />
      {import.meta.env.DEV ? (
        <TRNFormSection title="Presentation pack" className="border-t border-[var(--surface-border)] pt-3">
          <CoursePackControlsPanel />
        </TRNFormSection>
      ) : null}
      <TRNHintText>Status chips in the Course Studio header reflect route and link health.</TRNHintText>
    </div>
  );

  if (embedded) {
    return <TRNFormSection title="Document">{content}</TRNFormSection>;
  }

  return (
    <div className="border-b border-[var(--surface-border)] px-4 py-3">
      <TRNFormSection title="Document" showHeading={false} className="border-0 bg-transparent p-0">
        {content}
      </TRNFormSection>
    </div>
  );
}
