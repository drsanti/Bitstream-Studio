import { TRNHintText } from "../../../../../ui/TRN";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";

type DashboardInspectorLayoutWarningsSectionProps = {
  warnings: readonly string[];
  title?: string;
};

export function DashboardInspectorLayoutWarningsSection(
  props: DashboardInspectorLayoutWarningsSectionProps,
) {
  const { warnings, title = "Layout warnings" } = props;

  if (warnings.length === 0) {
    return null;
  }

  return (
    <InspectorSettingsSectionFrame title={title} collapsible defaultExpanded>
      <TRNHintText className="mb-2 text-amber-200/90">
        {warnings.length} overlap or layout issue{warnings.length === 1 ? "" : "s"} on this page.
        Adjust placement in Edit mode or use Stack.
      </TRNHintText>
      <ul className="space-y-1.5">
        {warnings.map((warning) => (
          <li
            key={warning}
            className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-[11px] leading-snug text-amber-100/95"
          >
            {warning}
          </li>
        ))}
      </ul>
    </InspectorSettingsSectionFrame>
  );
}
