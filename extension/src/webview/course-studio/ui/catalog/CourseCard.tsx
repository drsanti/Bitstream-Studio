import type { CSSProperties } from "react";
import type { CardBlockColors } from "../../schemas/cardBlockColors";
import type { CourseTitleIconAnimation } from "../../schemas/courseTitleIconAnimation";
import { cardBlockColorsToStyle } from "../../schemas/cardBlockColors";
import { resolveCourseTitlePrefixIcon } from "../../schemas/courseTitleIcon";
import { CourseTitleWithIcon } from "./CourseTitleWithIcon";

export function CourseCard({
  title,
  body,
  icon,
  iconAnimation,
  colors,
}: {
  title?: string;
  body: string;
  icon?: string;
  iconAnimation?: CourseTitleIconAnimation;
  colors?: CardBlockColors;
}) {
  const style = cardBlockColorsToStyle(colors) as CSSProperties | undefined;
  const hasTitleRow =
    (title != null && title.length > 0) || resolveCourseTitlePrefixIcon(icon) != null;

  return (
    <div
      className="flex h-full min-h-0 flex-col rounded-xl border border-[var(--course-card-border,var(--surface-border))] bg-[var(--course-card-bg,var(--surface-card))] px-4 py-3"
      style={style}
    >
      <CourseTitleWithIcon
        title={title}
        icon={icon}
        iconAnimation={iconAnimation}
        titleClassName="text-sm font-semibold text-[var(--course-card-title,var(--text-primary))]"
        iconClassName="text-[var(--course-card-icon,var(--course-card-title,var(--text-primary)))]"
      />
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-[var(--course-card-body,var(--text-secondary))] ${hasTitleRow ? "mt-2" : ""}`}
      >
        {body}
      </p>
    </div>
  );
}
