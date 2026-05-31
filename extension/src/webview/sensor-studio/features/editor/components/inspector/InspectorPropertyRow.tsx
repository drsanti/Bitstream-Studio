import type { ReactNode } from "react";
import { InspectorFieldStack } from "./InspectorFieldStack";

export type InspectorPropertyRowProps = {
  label: string;
  /** Optional muted helper under the label. */
  description?: string;
  children: ReactNode;
  /** @deprecated Column layout is always used in the Node Inspector. */
  stackOnNarrow?: boolean;
};

/**
 * Label + control for typed inspector sections — delegates to {@link InspectorFieldStack}.
 */
export function InspectorPropertyRow(props: InspectorPropertyRowProps) {
  const { label, description, children } = props;
  return (
    <InspectorFieldStack label={label} description={description}>
      {children}
    </InspectorFieldStack>
  );
}
