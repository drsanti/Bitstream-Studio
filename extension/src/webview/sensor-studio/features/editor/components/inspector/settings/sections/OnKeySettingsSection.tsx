import { Keyboard } from "lucide-react";
import {
  TRNFormField,
  TRNHintText,
  TRNInlineToggleRow,
  TRNSelect,
  type TRNSelectOption,
} from "../../../../../../../ui/TRN";
import {
  ON_KEY_PRESET_OPTIONS,
  readOnKeyConfig,
} from "../../../../nodes/events/on-key-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS } from "../../inspector-dense-select-button";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const KEY_OPTIONS: TRNSelectOption[] = ON_KEY_PRESET_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function OnKeySettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const { key, modifiers } = readOnKeyConfig(cfg);

  return (
    <InspectorCollapsibleSection
      title="Key binding"
      icon={<Keyboard className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Fires the event output when this key is pressed while the canvas has focus (not while typing in an input)."
      defaultExpanded
    >
      <TRNFormField label="Key" id="on-key-code" className="space-y-1.5">
        <TRNSelect
          ariaLabel="Key code"
          value={key}
          options={KEY_OPTIONS}
          size="sm"
          className="min-w-0"
          buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS}
          panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
          onValueChange={(next) => {
            onUpdateConfigField("key", next);
          }}
        />
      </TRNFormField>
      <div className="space-y-2 pt-1">
        <TRNInlineToggleRow
          label="Require Ctrl / Cmd"
          hint="Match only when Ctrl (Windows/Linux) or Cmd (macOS) is held."
          checked={modifiers.requireCtrl}
          onCheckedChange={(next) => {
            onUpdateConfigField("requireCtrl", next);
          }}
        />
        <TRNInlineToggleRow
          label="Require Shift"
          checked={modifiers.requireShift}
          onCheckedChange={(next) => {
            onUpdateConfigField("requireShift", next);
          }}
        />
        <TRNInlineToggleRow
          label="Require Alt"
          checked={modifiers.requireAlt}
          onCheckedChange={(next) => {
            onUpdateConfigField("requireAlt", next);
          }}
        />
      </div>
      <TRNHintText className="text-[10px]">
        Wire the **event** output into **Toggle Boolean** (or future action nodes), then wire boolean
        data into **Indicator** or GLB drives.
      </TRNHintText>
    </InspectorCollapsibleSection>
  );
}
