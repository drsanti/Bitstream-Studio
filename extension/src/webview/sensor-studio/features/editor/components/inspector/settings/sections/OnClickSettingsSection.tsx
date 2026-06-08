import { MousePointerClick } from "lucide-react";
import {
  TRNFormField,
  TRNHintText,
  TRNSelect,
  type TRNSelectOption,
} from "../../../../../../../ui/TRN";
import {
  ON_CLICK_BUTTON_OPTIONS,
  readOnClickConfig,
} from "../../../../nodes/events/on-click-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS } from "../../inspector-dense-select-button";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const BUTTON_OPTIONS: TRNSelectOption[] = ON_CLICK_BUTTON_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function OnClickSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const { button } = readOnClickConfig(cfg);

  return (
    <InspectorCollapsibleSection
      title="Click binding"
      icon={<MousePointerClick className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Fires when you click empty flow canvas (pane), not when clicking nodes or dragging."
      defaultExpanded
    >
      <TRNFormField label="Mouse button" id="on-click-button" className="space-y-1.5">
        <TRNSelect
          ariaLabel="Mouse button"
          value={button}
          options={BUTTON_OPTIONS}
          size="sm"
          className="min-w-0"
          buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS}
          panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
          onValueChange={(next) => {
            onUpdateConfigField("button", next);
          }}
        />
      </TRNFormField>
      <TRNHintText className="text-[10px]">
        Example: **On Key → Set Boolean (ON)** and **On Click → Set Boolean (OFF)** sharing one
        **Indicator** via merge or separate toggles into downstream logic.
      </TRNHintText>
    </InspectorCollapsibleSection>
  );
}
