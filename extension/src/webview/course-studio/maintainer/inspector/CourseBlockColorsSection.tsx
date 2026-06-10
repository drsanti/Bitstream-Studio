import type { ReactNode } from "react";

export const COURSE_BLOCK_COLORS_GROUP_TITLE_CLASS =
  "pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 first:pt-0";

export type CourseBlockColorsSectionProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Grouped color rows under a compact section title (Chrome, Typography, …). */
export function CourseBlockColorsSection({
  title,
  children,
  footer,
}: CourseBlockColorsSectionProps) {
  return (
    <div>
      <div className={COURSE_BLOCK_COLORS_GROUP_TITLE_CLASS}>{title}</div>
      <div className="flex flex-col">{children}</div>
      {footer}
    </div>
  );
}
