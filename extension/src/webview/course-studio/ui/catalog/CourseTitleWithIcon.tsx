import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { CourseTitleIconAnimation } from "../../schemas/courseTitleIconAnimation";
import { isCourseTitleIconAnimationActive } from "../../schemas/courseTitleIconAnimation";
import { resolveCourseTitlePrefixIcon } from "../../schemas/courseTitleIcon";
import { CourseAnimatedPrefixIcon } from "./CourseAnimatedPrefixIcon";

export function CourseTitleWithIcon({
  title,
  icon,
  fallbackIcon,
  titleClassName,
  iconClassName,
  iconSize = 18,
  iconColor,
  iconStyle,
  iconAnimation,
  className,
  titleAs,
}: {
  title?: string;
  icon?: string;
  fallbackIcon?: LucideIcon;
  titleClassName?: string;
  iconClassName?: string;
  iconSize?: number;
  iconColor?: string;
  iconStyle?: CSSProperties;
  iconAnimation?: CourseTitleIconAnimation;
  className?: string;
  titleAs?: "div" | "h1" | "span";
}) {
  const Icon = resolveCourseTitlePrefixIcon(icon, fallbackIcon);
  const hasTitle = title != null && title.length > 0;

  if (!hasTitle && Icon == null) {
    return null;
  }

  const TitleTag = titleAs ?? "div";
  let titleNode: ReactNode = null;
  if (hasTitle) {
    titleNode = <TitleTag className={titleClassName}>{title}</TitleTag>;
  }

  if (Icon == null) {
    return <div className={className}>{titleNode}</div>;
  }

  const mergedIconStyle: CSSProperties | undefined =
    iconColor != null ? { color: iconColor, ...iconStyle } : iconStyle;
  const animateIcon = isCourseTitleIconAnimationActive(iconAnimation);

  return (
    <div className={`flex items-start gap-2.5 ${className ?? ""}`}>
      {animateIcon ? (
        <CourseAnimatedPrefixIcon
          Icon={Icon}
          size={iconSize}
          className={`mt-0.5 ${iconClassName ?? ""}`}
          style={mergedIconStyle}
          iconAnimation={iconAnimation}
          restColor={iconColor}
        />
      ) : (
        <Icon
          size={iconSize}
          strokeWidth={2}
          className={`mt-0.5 shrink-0 ${iconClassName ?? ""}`}
          style={mergedIconStyle}
          aria-hidden
        />
      )}
      {titleNode != null ? <div className="min-w-0 flex-1">{titleNode}</div> : null}
    </div>
  );
}
