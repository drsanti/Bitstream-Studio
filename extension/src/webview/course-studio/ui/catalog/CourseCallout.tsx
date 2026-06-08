import { PresentationCallout } from "../../../presentation/components/PresentationCallout";
import type { PresentationCalloutVariant } from "../../../presentation/components/callout-tokens";

export function CourseCallout({
  variant,
  title,
  body,
  icon,
}: {
  variant: PresentationCalloutVariant;
  title?: string;
  body: string;
  icon?: string;
}) {
  return (
    <div className="h-full min-h-0">
      <PresentationCallout variant={variant} title={title} body={body} icon={icon} />
    </div>
  );
}
