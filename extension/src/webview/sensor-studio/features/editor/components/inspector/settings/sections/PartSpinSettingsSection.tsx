import { RotateCw } from "lucide-react";
import {
  TRNFormField,
  TRNHintText,
  TRNSelect,
  type TRNSelectOption,
} from "../../../../../../../ui/TRN";
import { STUDIO_MODEL_SELECT_CUSTOM } from "../../../../../asset-browser/studio-model-scene-bindings";
import { useStudioAssetDescriptors } from "../../../../../asset-browser/useStudioAssetDescriptors";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS } from "../../inspector-dense-select-button";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { GlbScopedModelSourceControl } from "../../../../model/glb-scoped-model-source-control";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import {
  PART_SPIN_AXIS_KEY,
  PART_SPIN_ENABLED_KEY,
  PART_SPIN_REVERSE_KEY,
  PART_SPIN_SPEED_RAD_S_KEY,
} from "../../../../nodes/scene/part-spin-config";
import {
  buildPartSpinBindingPatch,
  GLB_PART_UNBOUND,
  usePartSpinEditorState,
} from "../../../../nodes/scene/part-spin-editor-state";
import { applyPartSpinModelCatalogSelect } from "../../../../nodes/scene/part-spin-model-catalog";
import { ModelOutlinerOpenLink } from "../../../../model-outliner/ModelOutlinerOpenLink";

const AXIS_OPTIONS: TRNSelectOption[] = [
  { value: "x", label: "Local X" },
  { value: "y", label: "Local Y" },
  { value: "z", label: "Local Z" },
];

export function PartSpinSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const defaultConfig = selectedNode.data.defaultConfig as Record<string, unknown>;
  const { descriptors } = useStudioAssetDescriptors();
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);

  const {
    parsed,
    modelRef,
    isModelWired,
    wiredModelDisplayLabel,
    modelSourceOptions,
    modelSourceValue,
    modelSourceDisabled,
    partSelectOptions,
    partSelectValue,
    partSelectDisabled,
    isBound,
    boundRef,
  } = usePartSpinEditorState(selectedNode.id);

  const modelCatalogNeedsPick = modelSourceValue === STUDIO_MODEL_SELECT_CUSTOM;

  const patchPart = (ref: string) => {
    const modelFlowId = modelRef.status === "ok" ? modelRef.modelFlowId : undefined;
    const patch = buildPartSpinBindingPatch(ref, modelFlowId);
    for (const [key, value] of Object.entries(patch)) {
      onUpdateConfigField(key, value);
    }
  };

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Part spin"
        icon={<RotateCw className="h-3.5 w-3.5" aria-hidden />}
        defaultOpen
      >
        <TRNHintText tone="muted" className="mb-2 text-[10px] leading-snug">
          Continuous local rotation on a GLB object path. Applied after baked animation clips in the
          viewer. Spawn from **Model Outliner** → Parts (**Spin**).
        </TRNHintText>

        <TRNFormField label="Model" id="part-spin-model-source" className="mb-2 space-y-1.5">
          <GlbScopedModelSourceControl
            variant="inspector-inline"
            isModelWired={isModelWired}
            wiredModelDisplayLabel={wiredModelDisplayLabel}
            modelSourceOptions={modelSourceOptions}
            modelSourceValue={modelSourceValue}
            modelSourceDisabled={modelSourceDisabled}
            onCatalogSelect={(catalogAssetId) => {
              applyPartSpinModelCatalogSelect({
                flowNodeId: selectedNode.id,
                catalogAssetId,
                nodeConfig: defaultConfig,
                nodes,
                edges,
                descriptors,
                updateField,
              });
            }}
          />
        </TRNFormField>

        {!isModelWired && modelSourceDisabled ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px] leading-snug">
            Asset catalog has no GLB models yet. Add a **Model Source** node or import models in Asset
            Browser.
          </TRNHintText>
        ) : null}
        {!isModelWired && !modelSourceDisabled && modelCatalogNeedsPick ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px] leading-snug">
            Pick a GLB model, then choose a part below.
          </TRNHintText>
        ) : null}
        {isModelWired ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px] leading-snug">
            **Model** socket is wired — scope follows the wire.
          </TRNHintText>
        ) : null}

        {modelRef.status === "ok" ? (
          <div className="mb-2">
            <ModelOutlinerOpenLink
              label="Browse parts in Outliner"
              canvasModelId={modelRef.modelFlowId}
              typeFilter="part"
            />
          </div>
        ) : null}
        <TRNFormField label="Part" id="part-spin-select" className="mb-2 space-y-1.5">
          <TRNSelect
            ariaLabel="GLB part path"
            value={partSelectValue}
            options={partSelectOptions}
            disabled={partSelectDisabled}
            size="sm"
            className="min-w-0 w-full"
            buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS}
            panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
            onValueChange={(next) => {
              if (next === GLB_PART_UNBOUND) {
                return;
              }
              patchPart(next);
            }}
          />
        </TRNFormField>

        {isBound && partSelectDisabled && boundRef.length > 0 ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px]">
            Bound part: <span className="text-zinc-300">{boundRef}</span>
          </TRNHintText>
        ) : null}

        <TRNFormField label="Spin axis" id="part-spin-axis" className="mb-2 space-y-1.5">
          <TRNSelect
            ariaLabel="Part spin axis"
            className="nodrag w-full"
            options={AXIS_OPTIONS}
            value={parsed.axis}
            size="sm"
            buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS}
            onValueChange={(next) => {
              if (next === "x" || next === "y" || next === "z") {
                onUpdateConfigField(PART_SPIN_AXIS_KEY, next);
              }
            }}
          />
        </TRNFormField>

        <InspectorNumericScrubRow
          label="Speed (rad/s)"
          hint="Radians per second around the local axis. Wire the **Speed** input to override at runtime."
          value={parsed.speedRadS}
          min={-100}
          max={100}
          step={0.1}
          onChange={(v) => onUpdateConfigField(PART_SPIN_SPEED_RAD_S_KEY, v)}
        />

        <InspectorCompactToggleRow
          label="Reverse"
          hint="Flip spin direction without changing the wired speed sign."
          checked={parsed.reverse}
          onCheckedChange={(v) => onUpdateConfigField(PART_SPIN_REVERSE_KEY, v)}
        />

        <InspectorCompactToggleRow
          label="Enabled"
          hint="When off, rotation stops (part keeps its current orientation)."
          checked={parsed.enabled}
          onCheckedChange={(v) => onUpdateConfigField(PART_SPIN_ENABLED_KEY, v)}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}
