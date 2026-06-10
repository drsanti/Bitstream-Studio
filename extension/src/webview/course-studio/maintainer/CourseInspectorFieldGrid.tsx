import type { ReactNode } from "react";
import { TRNHintTooltip } from "../../ui/TRN/TRNHintTooltip";

export function CourseInspectorFieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">{children}</div>;
}

function CourseInspectorFieldLabelInner(props: { label: string; description?: string }) {
  const { label, description } = props;
  const labelClass =
    "text-[10px] font-medium uppercase leading-none tracking-wide text-zinc-500";

  if (description != null && description.length > 0) {
    return (
      <TRNHintTooltip
        trigger={
          <span className={labelClass + " cursor-help"}>
            {label}
          </span>
        }
        content={description}
        triggerAriaLabel={`About ${label}`}
        placement="top-start"
        triggerWrapper="span"
        triggerClassName="w-fit leading-none"
        wide={description.length > 120}
      />
    );
  }

  return <span className={labelClass}>{label}</span>;
}

/** Fixed-height caption slot — keeps 2-column maintainer grids aligned. */
export function CourseInspectorFieldLabel(props: { label: string; description?: string }) {
  return (
    <div className="flex h-[14px] min-w-0 items-center leading-none">
      <CourseInspectorFieldLabelInner {...props} />
    </div>
  );
}

export function CourseInspectorFieldGridLabels(props: {
  left: { label: string; description?: string };
  right: { label: string; description?: string };
}) {
  const { left, right } = props;
  return (
    <>
      <CourseInspectorFieldLabel label={left.label} description={left.description} />
      <CourseInspectorFieldLabel label={right.label} description={right.description} />
    </>
  );
}

export function CourseInspectorFieldGridControls(props: { left: ReactNode; right: ReactNode }) {
  const { left, right } = props;
  return (
    <>
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </>
  );
}
