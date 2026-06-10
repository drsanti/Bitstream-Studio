import type { PageGridV1 } from "../schemas/page.v1";
import { CoursePageGridChromeInspectorFields } from "./CoursePageGridChromeInspectorFields";

export function CoursePageGridInspectorFields({ grid }: { grid: PageGridV1 }) {
  return <CoursePageGridChromeInspectorFields grid={grid} />;
}
