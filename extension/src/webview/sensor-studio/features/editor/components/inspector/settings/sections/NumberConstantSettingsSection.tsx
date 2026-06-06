import { Hash } from "lucide-react";
import type { ReactNode } from "react";
import { TRNSelect, TRNSegmentedControl } from "../../../../../../../ui/TRN";
import { InspectorNumericField } from "../../InspectorNumericScrubRow";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorOptionalScrubNumberField } from "../../InspectorOptionalScrubNumberField";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorSegmentButtonGroup } from "../../InspectorSegmentButtonGroup";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { readGlbExtractTag } from "../../../../model/model-generated-bindings";
import {
  readGlbPartDriveMode,
  STUDIO_GLB_PART_DRIVE_MODE_KEY,
  type StudioGlbPartDriveModeV1,
} from "../../../../nodes/events/glb-part-event-config";
import {
  materialParamLabel,
  readGlbMaterialParam,
  STUDIO_GLB_MATERIAL_PARAM_KEY,
  STUDIO_GLB_MATERIAL_PARAMS,
  type StudioGlbMaterialParamV1,
} from "../../../../gltf/studio-glb-material-param";
import {
  coerceNumberConstantValue,
  readNumberConstantMode,
  readOptionalFiniteNumber,
  type NumberConstantMode,
} from "../../../../nodes/constants/number-constant-helpers";

function InspectorTypeBadge(props: { children: string }) {
  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
      {props.children}
    </span>
  );
}

function readFiniteNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function isPlainNumberConstantNodeId(nodeId: string): boolean {
  return nodeId === "number-constant" || nodeId === "float-constant" || nodeId === "integer-constant";
}

function lockedModeBadge(nodeId: string): ReactNode | undefined {
  if (nodeId === "float-constant") {
    return <InspectorTypeBadge>Float</InspectorTypeBadge>;
  }
  if (nodeId === "integer-constant") {
    return <InspectorTypeBadge>Integer</InspectorTypeBadge>;
  }
  return undefined;
}

export function NumberConstantSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const nodeId = selectedNode.data.nodeId;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const glbTag = readGlbExtractTag(dc);
  const partDriveMode = readGlbPartDriveMode(dc);
  const materialParam = readGlbMaterialParam(dc);

  const mode = readNumberConstantMode(dc);
  const canEditMode = nodeId === "number-constant";
  const min = readOptionalFiniteNumber(dc, "min");
  const max = readOptionalFiniteNumber(dc, "max");
  const step = readOptionalFiniteNumber(dc, "step");
  const rawValue = readFiniteNumber(dc.value, 0);
  const displayValue = coerceNumberConstantValue(dc, rawValue);

  const valueStep =
    mode === "integer" ? Math.max(1, step ?? 1) : step != null && step > 0 ? step : 0.01;
  const limitStep = mode === "integer" ? 1 : 0.01;
  const limitsDefaultExpanded = min != null || max != null || step != null;

  const commitValue = (nextRaw: number) => {
    const merged = { ...dc, value: nextRaw };
    onUpdateConfigField("value", coerceNumberConstantValue(merged, nextRaw));
  };

  const commitMode = (nextMode: NumberConstantMode) => {
    onUpdateConfigField("numberMode", nextMode);
    const merged = { ...dc, numberMode: nextMode };
    onUpdateConfigField("value", coerceNumberConstantValue(merged, displayValue));
  };

  const showGlbDrive =
    glbTag != null && isPlainNumberConstantNodeId(nodeId);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Value"
        icon={<Hash className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Output on the out wire. Same value as the flow card; clamp and step apply on commit."
        badge={lockedModeBadge(nodeId)}
        defaultExpanded
      >
        <InspectorPropertyRow
          label="Output value"
          description="Constant sent on the out pin after clamp, step, and integer rounding."
        >
          <InspectorNumericField
            ariaLabel="Numeric constant output value"
            value={displayValue}
            step={valueStep}
            min={min}
            max={max}
            fractionDigits={mode === "integer" ? 0 : undefined}
            defaultValue={1}
            appearance={{ resetIconVisibility: "always" }}
            onCommit={commitValue}
          />
        </InspectorPropertyRow>

        {canEditMode ? (
          <InspectorPropertyRow
            label="Number type"
            description="Integer rounds the output to a whole number after clamp and step."
          >
            <InspectorSegmentButtonGroup<NumberConstantMode>
              ariaLabel="Number constant type"
              layout="grid-2"
              value={mode}
              options={[
                { value: "float", label: "Float" },
                { value: "integer", label: "Integer" },
              ]}
              onChange={commitMode}
            />
          </InspectorPropertyRow>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Limits"
        icon={<Hash className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Optional clamp and step. Leave unset for open-ended editing; slider span auto-expands when needed."
        defaultExpanded={limitsDefaultExpanded}
      >
        <InspectorPropertyRow
          label="Min"
          description="Lower clamp bound. Clear to leave open-ended."
        >
          <InspectorOptionalScrubNumberField
            ariaLabel="Number constant min"
            value={min}
            step={limitStep}
            onCommit={(next) => onUpdateConfigField("min", next)}
          />
        </InspectorPropertyRow>
        <InspectorPropertyRow
          label="Max"
          description="Upper clamp bound. Clear to leave open-ended."
        >
          <InspectorOptionalScrubNumberField
            ariaLabel="Number constant max"
            value={max}
            step={limitStep}
            onCommit={(next) => onUpdateConfigField("max", next)}
          />
        </InspectorPropertyRow>
        <InspectorPropertyRow
          label="Step"
          description={
            mode === "integer"
              ? "Quantize to whole steps (minimum 1)."
              : "Quantize to this increment after clamp."
          }
        >
          <InspectorOptionalScrubNumberField
            ariaLabel="Number constant step"
            value={step}
            step={limitStep}
            seedValue={mode === "integer" ? 1 : 0.01}
            onCommit={(next) => {
              if (next == null) {
                onUpdateConfigField("step", null);
                return;
              }
              const quantized =
                mode === "integer" ? Math.max(1, Math.round(next)) : next > 0 ? next : 0.01;
              onUpdateConfigField("step", quantized);
            }}
          />
        </InspectorPropertyRow>
      </InspectorCollapsibleSection>

      {showGlbDrive ? (
        <InspectorCollapsibleSection
          title="GLB drive"
          icon={<Hash className="h-3.5 w-3.5 text-cyan-400/80" aria-hidden />}
          iconHint="When a Model viewer is linked to the same model, this number drives the GLB extract target below."
          defaultExpanded
        >
          <div className="break-all text-[10px] leading-snug text-zinc-400">
            <span className="uppercase text-cyan-300/80">{glbTag.kind}</span>
            <span className="mx-1 text-zinc-600">·</span>
            <span>{glbTag.ref}</span>
          </div>
          {glbTag.kind === "part" ? (
            <InspectorPropertyRow
              label="Part drive mode"
              description="Visibility treats the value as on/off (> 0.5 visible). Opacity passes 0–1 to material opacity."
            >
              <TRNSegmentedControl
                ariaLabel="GLB part drive mode"
                className="nodrag w-full"
                fullWidth
                size="sm"
                stopPointerDownPropagation
                tone="neutral"
                variant="surface"
                value={partDriveMode}
                options={[
                  { value: "visibility", label: "Visibility" },
                  { value: "opacity", label: "Opacity" },
                ]}
                onValueChange={(next) => {
                  if (next === "visibility" || next === "opacity") {
                    onUpdateConfigField(
                      STUDIO_GLB_PART_DRIVE_MODE_KEY,
                      next as StudioGlbPartDriveModeV1,
                    );
                  }
                }}
              />
            </InspectorPropertyRow>
          ) : null}
          {glbTag.kind === "material" ? (
            <InspectorPropertyRow
              label="PBR channel"
              description="Which material property this number drives in linked Model Viewer previews."
            >
              <TRNSelect
                value={materialParam}
                options={STUDIO_GLB_MATERIAL_PARAMS.map((p) => ({
                  value: p,
                  label: materialParamLabel(p),
                }))}
                ariaLabel="GLB material PBR channel"
                size="sm"
                onValueChange={(next) =>
                  onUpdateConfigField(STUDIO_GLB_MATERIAL_PARAM_KEY, next as StudioGlbMaterialParamV1)
                }
              />
            </InspectorPropertyRow>
          ) : null}
        </InspectorCollapsibleSection>
      ) : null}
    </div>
  );
}
