import { ListTree } from "lucide-react";
import { CourseOutlinePane } from "../../maintainer/CourseOutlinePane";

export function CourseOutlineWorkbenchPane() {
  return (
    <div className="h-full min-h-0 bg-[var(--surface-panel)]">
      <CourseOutlinePane />
    </div>
  );
}

export const courseOutlinePaneIcon = <ListTree className="size-3.5" aria-hidden />;
