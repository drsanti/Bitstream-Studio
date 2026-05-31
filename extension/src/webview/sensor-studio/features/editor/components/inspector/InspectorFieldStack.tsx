import type { ReactNode } from "react";
import { TRNHintText } from "../../../../../ui/TRN";

export type InspectorFieldStackProps = {
  /** Field caption above the control (column layout). */
  label?: string;
  /** Optional muted helper under the label. */
  description?: string;
  children: ReactNode;
};

/**
 * Full-width inspector field — label stacked above control (narrow pane friendly).
 */
export function InspectorFieldStack(props: InspectorFieldStackProps) {
  const { label, description, children } = props;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label != null && label.length > 0 ? (
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </div>
      ) : null}
      {description != null && description.length > 0 ? (
        <TRNHintText
          tone="muted"
          className="mb-0 text-[10px] leading-snug text-zinc-600"
        >
          {description}
        </TRNHintText>
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
