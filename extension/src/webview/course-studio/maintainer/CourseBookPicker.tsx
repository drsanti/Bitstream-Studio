import { TRNFormField, TRNSelect } from "../../ui/TRN";
import { listBundledCourseSummaries } from "../content/courseLibrary";
import { useCourseOutlineStore } from "./useCourseOutlineStore";

export function CourseBookPicker() {
  const courseId = useCourseOutlineStore((s) => s.courseId);
  const switchToCourse = useCourseOutlineStore((s) => s.switchToCourse);
  const summaries = listBundledCourseSummaries();

  if (summaries.length <= 1) {
    return null;
  }

  const options = summaries.map((entry) => ({
    value: entry.id,
    label: entry.title,
  }));

  return (
    <TRNFormField label="Book" className="px-3 pt-2">
      <TRNSelect
        variant="field"
        size="sm"
        value={courseId}
        options={options}
        ariaLabel="Active book"
        onValueChange={(nextId) => {
          if (nextId.length > 0 && nextId !== courseId) {
            switchToCourse(nextId);
          }
        }}
      />
    </TRNFormField>
  );
}
