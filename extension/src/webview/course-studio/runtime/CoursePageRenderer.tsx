import type { PageV1 } from "../schemas/page.v1";
import { useCourseStudioMaintainerModeEnabled } from "../maintainer/courseStudioMaintainerMode";
import { useCourseOutlineStore } from "../maintainer/useCourseOutlineStore";
import { CoursePageGridComposer } from "../maintainer/CoursePageGridComposer";
import { CoursePageEmptyState } from "./CoursePageEmptyState";
import { CoursePublishedPageGrid } from "./CoursePublishedPageGrid";

export function CoursePageRenderer({ page }: { page: PageV1 }) {
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);

  if (maintainer) {
    return <CoursePageGridComposer page={page} />;
  }

  if (page.blocks.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4">
        <CoursePageEmptyState maintainer={false} />
      </div>
    );
  }

  return (
    <CoursePublishedPageGrid
      page={page}
      courseThemes={courseThemes}
      pageLinkHealth={page.meta?.defaultLinkHealth}
      pageStaleMs={page.meta?.staleMs}
    />
  );
}
