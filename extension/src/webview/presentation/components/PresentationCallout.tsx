import type { LucideIcon } from "lucide-react";
import {
  COURSE_TITLE_ICON_NONE,
  resolveCourseLucideIcon,
} from "../../course-studio/schemas/courseTitleIcon";
import type { CourseTitleIconAnimation } from "../../course-studio/schemas/courseTitleIconAnimation";
import { isCourseTitleIconAnimationActive } from "../../course-studio/schemas/courseTitleIconAnimation";
import { CourseAnimatedPrefixIcon } from "../../course-studio/ui/catalog/CourseAnimatedPrefixIcon";
import {
  CALLOUT_VARIANT_STYLES,
  type PresentationCalloutVariant,
} from "./callout-tokens";

function resolveCalloutIcon(name: string | undefined, fallback: LucideIcon): LucideIcon | null {
  if (name === COURSE_TITLE_ICON_NONE) {
    return null;
  }
  if (!name) {
    return fallback;
  }
  return resolveCourseLucideIcon(name) ?? fallback;
}

export function PresentationCallout({
  variant,
  title,
  body,
  icon,
  iconColor,
  iconAnimation,
}: {
  variant: PresentationCalloutVariant;
  title?: string;
  body: string;
  icon?: string;
  iconColor?: string;
  iconAnimation?: CourseTitleIconAnimation;
}) {
  const style = CALLOUT_VARIANT_STYLES[variant];
  const Icon = resolveCalloutIcon(icon, style.icon);
  const iconStrokeColor = iconColor ?? style.title;
  const animateIcon = isCourseTitleIconAnimationActive(iconAnimation);

  return (
    <div
      className="flex min-h-0 flex-col gap-2 rounded-xl border px-4 py-3"
      style={{ borderColor: style.border, background: style.bg }}
    >
      <div className="flex items-start gap-2.5">
        {Icon != null ? (
          animateIcon ? (
            <CourseAnimatedPrefixIcon
              Icon={Icon}
              size={18}
              className="mt-0.5"
              style={{ color: iconStrokeColor }}
              iconAnimation={iconAnimation}
              restColor={typeof iconStrokeColor === "string" ? iconStrokeColor : undefined}
            />
          ) : (
            <Icon
              size={18}
              strokeWidth={2}
              style={{ color: iconStrokeColor }}
              className="mt-0.5 shrink-0"
            />
          )
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="text-sm font-semibold" style={{ color: style.title }}>
              {title}
            </div>
          ) : null}
          <p className={`text-sm leading-relaxed text-[var(--text-secondary)] ${title ? "mt-1" : ""}`}>
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
