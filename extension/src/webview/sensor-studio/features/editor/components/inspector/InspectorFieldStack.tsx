import type { ReactNode } from "react";
import { TRNHintTooltip } from "../../../../../ui/TRN";

export type InspectorFieldStackProps = {
  /** Field caption above the control (column layout). */
  label?: string;
  /** Hover tooltip on the label ({@link TRNHintTooltip}) — not inline helper copy. */
  description?: string;
  children: ReactNode;
};

function InspectorFieldLabelInner(props: { label: string; description?: string }) {
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

/** Fixed-height caption slot — keeps 2-column inspector grids aligned. */
export function InspectorFieldLabel(props: { label: string; description?: string }) {
  return (
    <div className="flex h-[14px] min-w-0 items-center leading-none">
      <InspectorFieldLabelInner {...props} />
    </div>
  );
}

/**
 * Full-width inspector field — label stacked above control (narrow pane friendly).
 */
export function InspectorFieldStack(props: InspectorFieldStackProps) {
  const { label, description, children } = props;
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {label != null && label.length > 0 ? (
        <InspectorFieldLabel label={label} description={description} />
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
