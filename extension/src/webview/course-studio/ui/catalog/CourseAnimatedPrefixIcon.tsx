import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef } from "react";
import type { CourseTitleIconAnimation } from "../../schemas/courseTitleIconAnimation";
import { useCourseTitleIconGsapAnimation } from "../../motion/useCourseTitleIconGsapAnimation";

export function CourseAnimatedPrefixIcon({
  Icon,
  size,
  className,
  style,
  iconAnimation,
  restColor,
}: {
  Icon: LucideIcon;
  size: number;
  className?: string;
  style?: CSSProperties;
  iconAnimation?: CourseTitleIconAnimation;
  /** Hex or CSS color string used as animation rest state. */
  restColor?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useCourseTitleIconGsapAnimation(wrapperRef, iconAnimation, restColor);

  return (
    <div ref={wrapperRef} className={`inline-flex shrink-0 ${className ?? ""}`}>
      <Icon size={size} strokeWidth={2} style={style} aria-hidden />
    </div>
  );
}
