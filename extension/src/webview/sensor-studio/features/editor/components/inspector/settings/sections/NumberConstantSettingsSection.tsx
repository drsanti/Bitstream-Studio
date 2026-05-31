import { X } from "lucide-react";
import { TRNHintText, TRNScrubNumberInput, TRNSegmentedControl } from "../../../../../../../ui/TRN";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  coerceNumberConstantValue,
  readNumberConstantCardValueControl,
  readNumberConstantMode,
  readOptionalFiniteNumber,
} from "../../../../nodes/constants/number-constant-helpers";
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
import { TRNSelect } from "../../../../../../../ui/TRN";

/** Same chrome as each axis cell in {@link TRNVector3Field} (`TRNVector3Field.tsx`). */
const TRN_DENSE_NUMERIC_FIELD_SHELL =
  "flex min-w-0 items-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-1";

/**
 * Optional finite bound — same shell + {@link TRNScrubNumberInput} as {@link TRNVector3Field} axis cells.
 * When unset (`undefined`), a "(none)" control seeds `0` (then edit); ✕ clears back to no bound.
 */
function OptionalDecimalInspectorControl(props: {
  label: string;
  description: string;
  value: number | undefined;
  onCommit: (next: number | null) => void;
}) {
  const { label, description, value, onCommit } = props;

  return (
    <InspectorPropertyRow label={label} description={description}>
      <div className={"nodrag w-full " + TRN_DENSE_NUMERIC_FIELD_SHELL}>
        {value == null ? (
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            <button
              type="button"
              className="nodrag min-w-0 flex-1 rounded bg-transparent px-0.5 py-0.5 text-right font-mono text-[11px] tabular-nums text-zinc-500 outline-none transition-colors hover:text-zinc-300 focus-visible:ring-1 focus-visible:ring-cyan-400/45"
              aria-label={`${label}: not set. Activate to enter a value.`}
              title="Sets bound starting at 0 — edit the value, or use ✕ after setting to remove the bound."
              onClick={() => {
                onCommit(0);
              }}
            >
              (none)
            </button>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              <TRNScrubNumberInput
                aria-label={label}
                className="w-full min-w-0"
                inputClassName="text-xs"
                value={value}
                step={0.01}
                pointerScrubEnabled={false}
                onChange={(n) => {
                  onCommit(n);
                }}
              />
            </div>
            <button
              type="button"
              aria-label={`Clear ${label}`}
              title="Remove bound"
              className={
                "nodrag inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 " +
                "text-zinc-500 outline-none transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 " +
                "focus-visible:ring-2 focus-visible:ring-cyan-400/45"
              }
              onClick={(e) => {
                e.preventDefault();
                onCommit(null);
              }}
            >
              <X className="h-3 w-3" aria-hidden strokeWidth={2.25} />
            </button>
          </div>
        )}
      </div>
    </InspectorPropertyRow>
  );
}

export function NumberConstantSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const mode = readNumberConstantMode(dc);
  const cardUi = readNumberConstantCardValueControl(dc);
  const min = readOptionalFiniteNumber(dc, "min");
  const max = readOptionalFiniteNumber(dc, "max");
  const step = readOptionalFiniteNumber(dc, "step");
  const rawValue = typeof dc.value === "number" && Number.isFinite(dc.value) ? dc.value : 0;
  const coercedValue = coerceNumberConstantValue(dc, rawValue);
  const valueStep =
    mode === "integer" ? Math.max(1, step ?? 1) : step != null && step > 0 ? step : 0.01;
  const glbTag = readGlbExtractTag(dc);
  const partDriveMode = readGlbPartDriveMode(dc);
  const materialParam = readGlbMaterialParam(dc);

  return (
    <InspectorSettingsSectionFrame title="Number">
      <div className="space-y-2">
        {glbTag != null ? (
          <div className="nodrag rounded border border-cyan-900/45 bg-cyan-950/20 px-2 py-1.5">
            <div className="text-[11px] font-medium text-cyan-100/95">GLB extraction placeholder</div>
            <div className="mt-1 break-all font-mono text-[10px] leading-snug text-zinc-400">
              <span className="uppercase text-cyan-300/80">{glbTag.kind}</span>
              <span className="mx-1 text-zinc-600">·</span>
              <span>{glbTag.ref}</span>
            </div>
            {glbTag.kind === "part" ? (
              <div className="mt-2">
                <InspectorPropertyRow
                  label="Part drive mode"
                  description="Visibility-only treats the value as on/off (> 0.5 visible). Opacity passes 0–1 through to material opacity in the preview."
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
                      onUpdateConfigField(STUDIO_GLB_PART_DRIVE_MODE_KEY, next as StudioGlbPartDriveModeV1);
                    }
                  }}
                />
              </InspectorPropertyRow>
              </div>
            ) : null}
            {glbTag.kind === "material" ? (
              <div className="mt-2">
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
              </div>
            ) : null}
            <TRNHintText tone="muted" className="mt-1 text-[10px] leading-snug">
              {glbTag.kind === "morph" ||
              glbTag.kind === "light" ||
              glbTag.kind === "animation" ||
              glbTag.kind === "part" ||
              glbTag.kind === "material" ||
              glbTag.kind === "camera" ? (
                <>
                  With a <span className="font-medium text-zinc-300">Model viewer</span> linked to
                  the same Model, this number drives the GLB target in the preview:{" "}
                  {glbTag.kind === "part" ? (
                    partDriveMode === "opacity" ? (
                      <>
                        <span className="font-medium text-zinc-300">part</span> opacity (0–1; 0 hides
                        the mesh), plus other kinds as below.
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-zinc-300">part</span> visibility (&gt; 0.5
                        visible), plus other kinds as below.
                      </>
                    )
                  ) : (
                    <>
                      <span className="font-medium text-zinc-300">part</span> visibility (&gt; 0.5
                      visible),{" "}
                    </>
                  )}
                  {glbTag.kind === "material" ? (
                    <>
                      <span className="font-medium text-zinc-300">material</span>{" "}
                      {materialParamLabel(materialParam).toLowerCase()} (channel picker above),{" "}
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-zinc-300">material</span> emissive
                      intensity (≥ 0),{" "}
                    </>
                  )}
                  <span className="font-medium text-zinc-300">camera</span> pose
                  when &gt; 0.5 (highest value wins if several cameras are driven), plus{" "}
                  <span className="font-medium text-zinc-300">morph</span>,{" "}
                  <span className="font-medium text-zinc-300">light</span>, and{" "}
                  <span className="font-medium text-zinc-300">animation</span> as before. Turning off
                  a <span className="font-medium text-zinc-300">camera</span> drive restores the
                  saved studio camera on the next frame.{" "}
                  <span className="font-medium text-zinc-300">Hybrid</span> /{" "}
                  <span className="font-medium text-zinc-300">Strip</span> embedded rig can remove GLB
                  cameras before drives run—use <span className="font-medium text-zinc-300">Keep</span>{" "}
                  when you rely on camera drives.
                </>
              ) : (
                <>
                  Numeric value is a temporary driver placeholder until this GLB target is wired into
                  simulation or the model viewer.
                </>
              )}
            </TRNHintText>
          </div>
        ) : null}
        <InspectorPropertyRow
          label="Number format"
          description="Integer rounds the output to a whole number after clamp and step. Float keeps fractional values."
        >
          <TRNSegmentedControl
            ariaLabel="Number format"
            className="nodrag w-full"
            fullWidth
            size="sm"
            stopPointerDownPropagation
            tone="neutral"
            variant="surface"
            value={mode}
            options={[
              { value: "float", label: "Float" },
              { value: "integer", label: "Integer" },
            ]}
            onValueChange={(next) => {
              if (next === "integer") {
                onUpdateConfigField("numberMode", "integer");
              } else if (next === "float") {
                onUpdateConfigField("numberMode", "float");
              }
            }}
          />
        </InspectorPropertyRow>

        <InspectorPropertyRow
          label="Value control"
          description="Typed number field vs slider on the node card and in the Value row below."
        >
          <TRNSegmentedControl
            ariaLabel="On-card number editor"
            className="nodrag w-full"
            fullWidth
            size="sm"
            stopPointerDownPropagation
            tone="neutral"
            variant="surface"
            value={cardUi}
            options={[
              { value: "input", label: "Input" },
              { value: "slider", label: "Slider" },
            ]}
            onValueChange={(next) => {
              if (next === "input" || next === "slider") {
                onUpdateConfigField("cardValueControl", next);
              }
            }}
          />
        </InspectorPropertyRow>

        <OptionalDecimalInspectorControl
          label="Min (optional)"
          description="Lower clamp for value and for the out wire. Leave empty for no lower bound."
          value={min}
          onCommit={(next) => {
            onUpdateConfigField("min", next);
          }}
        />
        <OptionalDecimalInspectorControl
          label="Max (optional)"
          description="Upper clamp. Leave empty for no upper bound."
          value={max}
          onCommit={(next) => {
            onUpdateConfigField("max", next);
          }}
        />
        <OptionalDecimalInspectorControl
          label="Step (optional)"
          description="Snap output to multiples of step after clamp (for example 0.1 or 5). Leave empty to disable snapping."
          value={step}
          onCommit={(next) => {
            onUpdateConfigField("step", next);
          }}
        />

        <InspectorPropertyRow
          label="Value"
          description="Main constant; clamp and step rules apply before the value reaches out."
        >
          <div className={"nodrag w-full " + TRN_DENSE_NUMERIC_FIELD_SHELL}>
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              <TRNScrubNumberInput
                aria-label="Number constant value"
                className="w-full"
                inputClassName="text-xs"
                value={coercedValue}
                step={valueStep}
                min={min}
                max={max}
                pointerScrubEnabled={false}
                onChange={(next) => {
                  const merged = { ...dc, value: next };
                  const out = coerceNumberConstantValue(merged, next);
                  onUpdateConfigField("value", out);
                }}
              />
            </div>
          </div>
        </InspectorPropertyRow>
      </div>
    </InspectorSettingsSectionFrame>
  );
}
