import type { ReactNode } from "react";
import { TRNHintText } from "../../../../../ui/TRN";

export type InspectorPropertyRowProps = {
  label: string;
  /** Optional muted helper under the label (engine-style “tooltip in place”). */
  description?: string;
  /** Control column content (inputs, selects, readouts). */
  children: ReactNode;
  /** When true, label column stacks above control on very narrow widths. */
  stackOnNarrow?: boolean;
};

/**
 * Unreal / Unity–style label + control row for the Sensor Studio node inspector.
 */
export function InspectorPropertyRow(props: InspectorPropertyRowProps) {
  const { label, description, children, stackOnNarrow = false } = props;
  return (
    <div
      className={
        stackOnNarrow
          ? "flex min-w-0 flex-col gap-1 sm:grid sm:grid-cols-[minmax(5.5rem,7.5rem)_minmax(0,1fr)] sm:items-center sm:gap-x-2"
          : "grid min-w-0 grid-cols-[minmax(5.5rem,7.5rem)_minmax(0,1fr)] items-center gap-x-2 gap-y-1"
      }
    >
      <div className="min-w-0 shrink-0">
        <div className="text-[11px] font-medium leading-snug text-zinc-400">
          {label}
        </div>
        {description != null && description.length > 0 ? (
          <TRNHintText
            tone="muted"
            className="mb-0 mt-0.5 text-[10px] leading-snug text-zinc-600"
          >
            {description}
          </TRNHintText>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
