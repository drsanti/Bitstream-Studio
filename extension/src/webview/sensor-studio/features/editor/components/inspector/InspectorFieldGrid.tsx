import type { ReactNode } from "react";
import { InspectorFieldLabel } from "./InspectorFieldStack";

export type InspectorFieldGridProps = {
  children: ReactNode;
};

/** Two-column grid: row 1 labels, row 2 controls — keeps paired fields aligned. */
export function InspectorFieldGrid(props: InspectorFieldGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">{props.children}</div>
  );
}

export type InspectorFieldGridLabelsProps = {
  left: { label: string; description?: string };
  right: { label: string; description?: string };
};

export function InspectorFieldGridLabels(props: InspectorFieldGridLabelsProps) {
  const { left, right } = props;
  return (
    <>
      <InspectorFieldLabel label={left.label} description={left.description} />
      <InspectorFieldLabel label={right.label} description={right.description} />
    </>
  );
}

export type InspectorFieldGridControlsProps = {
  left: ReactNode;
  right: ReactNode;
};

export function InspectorFieldGridControls(props: InspectorFieldGridControlsProps) {
  const { left, right } = props;
  return (
    <>
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </>
  );
}
