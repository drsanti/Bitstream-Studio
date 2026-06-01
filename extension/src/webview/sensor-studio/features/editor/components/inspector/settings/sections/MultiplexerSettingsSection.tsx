import { Split } from "lucide-react";
import { TRNHintText } from "../../../../../../../ui/TRN";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function MultiplexerSettingsSection(_props: NodeInspectorSettingsSectionProps) {
  return (
    <InspectorCollapsibleSection
      title="Multiplexer"
      icon={<Split className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Extract numeric fields from a JSON payload string using dot paths on outputs A, B, and C."
      defaultExpanded
    >
      <TRNHintText tone="muted" className="text-[11px]">
        Edit JSON paths on the node card. Wire a JSON string (or object serialized upstream) into Payload.
      </TRNHintText>
    </InspectorCollapsibleSection>
  );
}
