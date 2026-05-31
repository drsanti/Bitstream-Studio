import { useMemo } from "react";
import { InspectorDetailsMarkdown } from "./InspectorDetailsMarkdown";
import { buildSensorAboutMarkdown } from "./inspector-details-markdown-builders";
import type { SensorInspectorAboutContent } from "./sensor-inspector-about-content";

export type InspectorAboutContentProps = {
  content: SensorInspectorAboutContent;
  /** Catalog one-liner (shown when distinct from role). */
  catalogLead?: string | null;
};

export function InspectorAboutContent(props: InspectorAboutContentProps) {
  const { content, catalogLead } = props;
  const markdown = useMemo(
    () => buildSensorAboutMarkdown(content, catalogLead),
    [content, catalogLead],
  );
  return <InspectorDetailsMarkdown markdown={markdown} />;
}
