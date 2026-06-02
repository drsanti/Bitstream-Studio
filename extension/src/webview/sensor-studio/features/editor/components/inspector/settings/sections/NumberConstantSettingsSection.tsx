import { useState } from "react";
import {
  TRNButton,
  TRNHintText,
  TRNSegmentedControl,
} from "../../../../../../../ui/TRN";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorOptionalScrubNumberField } from "../../../inspector/InspectorOptionalScrubNumberField";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
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
import { TRNSelect } from "../../../../../../../ui/TRN";
import {
  loadTrnScrubNumberFieldSettings,
  saveTrnScrubNumberFieldSettings,
  type TrnScrubNumberFieldStoredSettingsV1,
} from "../../../../../../../ui/TRN/trnScrubNumberFieldStorage";

const SCRUB_FIELD_SETTINGS_KEY = "number-constant";

function readScrubFieldSettings(): TrnScrubNumberFieldStoredSettingsV1 {
  return (
    loadTrnScrubNumberFieldSettings(SCRUB_FIELD_SETTINGS_KEY) ?? {
      version: 1,
      valueRules: { stepAuto: true },
      appearance: {
        variant: "full",
        stepButtonsVisibility: "hover",
        lockIconVisibility: "hover",
      },
      interaction: {
        pointerScrubEnabled: true,
        dragSensitivityPreset: "normal",
        wheelEnabled: true,
        wheelBoundedMode: "span-percent",
      },
    }
  );
}

function persistScrubFieldSettings(next: TrnScrubNumberFieldStoredSettingsV1): void {
  saveTrnScrubNumberFieldSettings(SCRUB_FIELD_SETTINGS_KEY, next);
}

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
      <InspectorOptionalScrubNumberField
        ariaLabel={label}
        value={value}
        step={0.01}
        onCommit={onCommit}
      />
    </InspectorPropertyRow>
  );
}

function ScrubFieldInspectorPreferences(props: { showValueRules?: boolean; showHint?: boolean }) {
  const { showValueRules = true, showHint = true } = props;
  const [settings, setSettings] = useState<TrnScrubNumberFieldStoredSettingsV1>(readScrubFieldSettings);

  const appearance = settings.appearance ?? {};
  const interaction = settings.interaction ?? {};
  const valueRules = settings.valueRules ?? {};

  const setNext = (next: TrnScrubNumberFieldStoredSettingsV1) => {
    setSettings(next);
    persistScrubFieldSettings(next);
  };

  const visibilityButtons = (
    kind: "stepButtonsVisibility" | "lockIconVisibility",
    value: "hidden" | "always" | "hover",
    onPick: (v: "hidden" | "always" | "hover") => void,
  ) => (
    <div className="flex w-full gap-1.5">
      {([
        { id: "hidden", label: "Hidden" },
        { id: "always", label: "Always" },
        { id: "hover", label: "On hover" },
      ] as const).map((o) => (
        <TRNButton
          key={`${kind}-${o.id}`}
          size="compact"
          selected={value === o.id}
          className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
          onClick={() => onPick(o.id)}
        >
          {o.label}
        </TRNButton>
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      {showHint ? (
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          These control the scrub field UI/interaction (used across nodes).
        </TRNHintText>
      ) : null}

      <InspectorPropertyRow label="Variant" description="Minimal hides the step/lock affordances.">
        <div className="flex w-full gap-1.5">
          {(["minimal", "full"] as const).map((v) => (
            <TRNButton
              key={v}
              size="compact"
              selected={(appearance.variant ?? "full") === v}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  appearance: { ...appearance, variant: v },
                })
              }
            >
              {v === "minimal" ? "Minimal" : "Full"}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Step buttons" description="Visibility of [‹][›] controls.">
        {visibilityButtons(
          "stepButtonsVisibility",
          (appearance.stepButtonsVisibility ?? "hover") as any,
          (v) =>
            setNext({
              ...settings,
              appearance: { ...appearance, stepButtonsVisibility: v },
            }),
        )}
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Lock icon" description="Visibility of the 🔓/🔒 toggle.">
        {visibilityButtons(
          "lockIconVisibility",
          (appearance.lockIconVisibility ?? "hover") as any,
          (v) =>
            setNext({
              ...settings,
              appearance: { ...appearance, lockIconVisibility: v },
            }),
        )}
      </InspectorPropertyRow>

      {showValueRules ? (
        <>
          <OptionalDecimalInspectorControl
            label="Default min (UI)"
            description="Default min bound used when a scrub field is rendered without an explicit min."
            value={typeof valueRules.min === "number" ? valueRules.min : undefined}
            onCommit={(next) =>
              setNext({
                ...settings,
                valueRules: { ...valueRules, min: next ?? undefined },
              })
            }
          />
          <OptionalDecimalInspectorControl
            label="Default max (UI)"
            description="Default max bound used when a scrub field is rendered without an explicit max."
            value={typeof valueRules.max === "number" ? valueRules.max : undefined}
            onCommit={(next) =>
              setNext({
                ...settings,
                valueRules: { ...valueRules, max: next ?? undefined },
              })
            }
          />
        </>
      ) : null}

      <InspectorPropertyRow label="Pointer drag scrub" description="Enables click-drag scrubbing.">
        <div className="flex w-full gap-1.5">
          {([
            { id: "on", label: "On" },
            { id: "off", label: "Off" },
          ] as const).map((o) => (
            <TRNButton
              key={`pointer-scrub-${o.id}`}
              size="compact"
              selected={(interaction.pointerScrubEnabled === false ? "off" : "on") === o.id}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, pointerScrubEnabled: o.id === "on" },
                })
              }
            >
              {o.label}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Drag sensitivity" description="How fast value changes while scrubbing.">
        <div className="flex w-full gap-1.5">
          {(["slow", "normal", "fast", "custom"] as const).map((p) => (
            <TRNButton
              key={p}
              size="compact"
              selected={(interaction.dragSensitivityPreset ?? "normal") === p}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, dragSensitivityPreset: p },
                })
              }
            >
              {p === "normal" ? "Normal" : p[0].toUpperCase() + p.slice(1)}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Mouse wheel" description="Enable wheel changes over the field.">
        <div className="flex w-full gap-1.5">
          {([
            { id: "on", label: "On" },
            { id: "off", label: "Off" },
          ] as const).map((o) => (
            <TRNButton
              key={`wheel-${o.id}`}
              size="compact"
              selected={(interaction.wheelEnabled === false ? "off" : "on") === o.id}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, wheelEnabled: o.id === "on" },
                })
              }
            >
              {o.label}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Bounded wheel" description="When min/max exist, choose wheel step mode.">
        <div className="flex w-full gap-1.5">
          {([
            { id: "span-percent", label: "1% span" },
            { id: "step", label: "Step" },
          ] as const).map((o) => (
            <TRNButton
              key={o.id}
              size="compact"
              selected={(interaction.wheelBoundedMode ?? "span-percent") === o.id}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, wheelBoundedMode: o.id },
                })
              }
            >
              {o.label}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>
    </div>
  );
}

export function NumberConstantSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const glbTag = readGlbExtractTag(dc);
  const partDriveMode = readGlbPartDriveMode(dc);
  const materialParam = readGlbMaterialParam(dc);

  return (
    <InspectorSettingsSectionFrame title="Number">
      <div className="space-y-2">
        {selectedNode.data.nodeId === "float-constant" ? (
          <ScrubFieldInspectorPreferences showValueRules={false} />
        ) : null}

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
      </div>
    </InspectorSettingsSectionFrame>
  );
}
