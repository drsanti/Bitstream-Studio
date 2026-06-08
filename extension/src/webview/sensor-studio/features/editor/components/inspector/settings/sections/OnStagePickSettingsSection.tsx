import { BoxSelect } from "lucide-react";
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
import { isFlowWireStagePickV1 } from "../../../../nodes/events/flow-wire-stage-pick";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS } from "../../inspector-dense-select-button";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const BUTTON_OPTIONS: TRNSelectOption[] = ON_CLICK_BUTTON_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label.replace("empty canvas", "Stage viewport"),
}));

export function OnStagePickSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const { button } = readOnClickConfig(cfg);
  const pick = selectedNode.data.liveStagePickWire;
  const pickDetail = isFlowWireStagePickV1(pick) ? pick : null;

  return (
    <InspectorCollapsibleSection
      title="Stage pick binding"
      icon={<BoxSelect className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Fires when you click a loaded model in the Stage workbench pane (not the flow canvas)."
      defaultExpanded
    >
      <TRNFormField label="Mouse button" id="on-stage-pick-button" className="space-y-1.5">
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
      {pickDetail != null ? (
        <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-2.5 py-2 text-[10px] text-zinc-400">
          <div className="font-medium text-zinc-300">Last pick</div>
          <div className="mt-1 leading-snug">
            Model #{pickDetail.modelIndex + 1} · {pickDetail.objectPath}
          </div>
          <div className="mt-0.5 leading-snug text-zinc-500">
            ({pickDetail.hitPoint.x.toFixed(2)}, {pickDetail.hitPoint.y.toFixed(2)},{" "}
            {pickDetail.hitPoint.z.toFixed(2)})
          </div>
        </div>
      ) : null}
      <TRNHintText className="text-[10px]">
        Picking updates Stage focus to the hit model and pulses wired **event** actions (Domain C).
      </TRNHintText>
    </InspectorCollapsibleSection>
  );
}
