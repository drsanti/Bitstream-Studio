import type { CourseTitleIconAnimation } from "../../schemas/courseTitleIconAnimation";
import { PresentationCallout } from "../../../presentation/components/PresentationCallout";
import type { PresentationCalloutVariant } from "../../../presentation/components/callout-tokens";

export function CourseCallout({
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
  return (
    <div className="h-full min-h-0">
      <PresentationCallout
        variant={variant}
        title={title}
        body={body}
        icon={icon}
        iconColor={iconColor}
        iconAnimation={iconAnimation}
      />
    </div>
  );
}
