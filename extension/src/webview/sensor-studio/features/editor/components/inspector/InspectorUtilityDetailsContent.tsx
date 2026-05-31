import { useMemo } from "react";
import { InspectorDetailsMarkdown } from "./InspectorDetailsMarkdown";
import { buildUtilityDetailsMarkdown } from "./inspector-details-markdown-builders";
import type { UtilityInspectorDetailsContent } from "./utility-inspector-details-content";

export type InspectorUtilityDetailsContentProps = {
  content: UtilityInspectorDetailsContent;
  catalogLead?: string | null;
};

export function InspectorUtilityDetailsContent(props: InspectorUtilityDetailsContentProps) {
  const { content, catalogLead } = props;
  const markdown = useMemo(
    () => buildUtilityDetailsMarkdown(content, catalogLead),
    [content, catalogLead],
  );
  return <InspectorDetailsMarkdown markdown={markdown} />;
}
