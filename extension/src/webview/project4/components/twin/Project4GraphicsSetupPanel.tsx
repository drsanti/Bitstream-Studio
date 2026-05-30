import { useCallback, useMemo, useState } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNScrubNumberInput } from "../../../ui/TRN/TRNScrubNumberInput";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import { TRNSectionContainer } from "../../../ui/TRN/TRNSectionContainer";
import { TRNSettingRow } from "../../../ui/TRN/TRNSettingRow";
import { PROJECT4_GRAPHICS_MAX_LIGHTS } from "../../settings/project4-graphics.defaults";
import {
  PROJECT4_LIGHT_KINDS,
  PROJECT4_TONE_MAPPING_KEYS,
  createProject4TwinLight,
  isProject4LightKind,
  isProject4ToneMappingKey,
  normalizeProject4TwinLightEntry,
} from "../../settings/project4-graphics.normalize";
import type {
  Project4ToneMappingKey,
  Project4TwinLightEntry,
  Project4TwinLightKind,
} from "../../settings/project4-graphics.types";
import { useProject4GraphicsStore } from "../../settings/project4-graphics.store";
import { PANEL_FORM_CONTROL_ROW_CLASS } from "../../../lib/panel-form-control-classes";

const sectionShellClass =
  "h-auto min-h-0 shrink-0 border-zinc-700 bg-zinc-950 shadow-none";

const inputClass = PANEL_FORM_CONTROL_ROW_CLASS;

const lightEditorShellClass =
  "rounded-xl border border-zinc-700/80 bg-zinc-950/75 p-4 backdrop-blur-sm shadow-none";

const TONE_LABELS: Record<Project4ToneMappingKey, string> = {
  none: "None",
  linear: "Linear",
  reinhard: "Reinhard",
  cineon: "Cineon",
  acesFilmic: "ACES Filmic",
};

const LIGHT_KIND_LABELS: Record<Project4TwinLightKind, string> = {
  ambient: "Ambient",
  directional: "Directional",
  point: "Point",
  spot: "Spot",
  hemisphere: "Hemisphere",
};

function LightEditor(props: {
  entry: Project4TwinLightEntry;
  onPatch: (id: string, partial: Partial<Project4TwinLightEntry>) => void;
  onRemove: (id: string) => void;
}) {
  const { entry, onPatch, onRemove } = props;
  const title = `${LIGHT_KIND_LABELS[entry.kind]} · ${entry.id.slice(0, 8)}`;

  return (
    <div className={lightEditorShellClass}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</div>
        <TRNButton
          type="button"
          size="compact"
          className="border-red-900/60 bg-red-950/40 text-[11px] text-red-200 hover:bg-red-950/70"
          onClick={() => onRemove(entry.id)}
        >
          Remove
        </TRNButton>
      </div>

      <div className="flex flex-col gap-3">
        <TRNSettingRow label="Type" hint="Changing type keeps color/intensity where applicable; normalize clamps ranges.">
          <TRNSelect
            ariaLabel="Light type"
            value={entry.kind}
            options={PROJECT4_LIGHT_KINDS.map((k) => ({
              value: k,
              label: LIGHT_KIND_LABELS[k],
            }))}
            onValueChange={(v) => {
              if (isProject4LightKind(v)) {
                onPatch(entry.id, { kind: v });
              }
            }}
            className="mt-1"
            buttonClassName={inputClass}
          />
        </TRNSettingRow>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TRNSettingRow label="Color">
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={entry.color}
                onChange={(e) => onPatch(entry.id, { color: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded border border-zinc-600 bg-zinc-900"
                aria-label="Light color"
              />
              <span className="font-mono text-[11px] text-zinc-500">{entry.color}</span>
            </div>
          </TRNSettingRow>
          <TRNSettingRow label="Intensity">
            <TRNScrubNumberInput
              min={0}
              max={entry.kind === "ambient" ? 5 : 50}
              step={0.05}
              fractionDigits={2}
              value={entry.intensity}
              onChange={(intensity) => onPatch(entry.id, { intensity })}
              inputClassName={inputClass}
              className="text-left"
            />
          </TRNSettingRow>
        </div>

        {entry.kind === "hemisphere" ? (
          <TRNSettingRow label="Ground color">
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={entry.groundColor}
                onChange={(e) => onPatch(entry.id, { groundColor: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded border border-zinc-600 bg-zinc-900"
                aria-label="Hemisphere ground color"
              />
              <span className="font-mono text-[11px] text-zinc-500">{entry.groundColor}</span>
            </div>
          </TRNSettingRow>
        ) : null}

        {entry.kind !== "ambient" ? (
          <TRNSettingRow
            label="Position (x, y, z)"
            hint="World-space meters relative to scene origin."
          >
            <div className="mt-1 grid grid-cols-3 gap-2">
              {([0, 1, 2] as const).map((axis) => (
                <TRNScrubNumberInput
                  key={axis}
                  min={-200}
                  max={200}
                  step={0.1}
                  fractionDigits={2}
                  value={entry.position[axis]}
                  onChange={(n) => {
                    const next: [number, number, number] = [...entry.position];
                    next[axis] = n;
                    onPatch(entry.id, { position: next });
                  }}
                  inputClassName={inputClass}
                  className="text-left"
                />
              ))}
            </div>
          </TRNSettingRow>
        ) : (
          <TRNHintText className="text-[10px]">
            Ambient lights have no position in Three.js — intensity-only contribution.
          </TRNHintText>
        )}

        {entry.kind === "point" || entry.kind === "spot" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TRNSettingRow label="Distance" hint="0 = infinite (Three.js default).">
              <TRNScrubNumberInput
                min={0}
                max={500}
                step={0.5}
                fractionDigits={2}
                value={entry.distance}
                onChange={(distance) => onPatch(entry.id, { distance })}
                inputClassName={inputClass}
                className="text-left"
              />
            </TRNSettingRow>
            <TRNSettingRow label="Decay">
              <TRNScrubNumberInput
                min={0}
                max={4}
                step={0.05}
                fractionDigits={2}
                value={entry.decay}
                onChange={(decay) => onPatch(entry.id, { decay })}
                inputClassName={inputClass}
                className="text-left"
              />
            </TRNSettingRow>
          </div>
        ) : null}

        {entry.kind === "spot" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TRNSettingRow label="Cone angle (deg)">
              <TRNScrubNumberInput
                min={1}
                max={89}
                step={1}
                fractionDigits={0}
                value={entry.angleDeg}
                onChange={(angleDeg) => onPatch(entry.id, { angleDeg })}
                inputClassName={inputClass}
                className="text-left"
              />
            </TRNSettingRow>
            <TRNSettingRow label="Penumbra" hint="0 = sharp edge, 1 = soft edge.">
              <TRNScrubNumberInput
                min={0}
                max={1}
                step={0.05}
                fractionDigits={2}
                value={entry.penumbra}
                onChange={(penumbra) => onPatch(entry.id, { penumbra })}
                inputClassName={inputClass}
                className="text-left"
              />
            </TRNSettingRow>
          </div>
        ) : null}

        {entry.kind === "directional" || entry.kind === "point" || entry.kind === "spot" ? (
          <TRNInlineToggleRow
            label="Cast shadows"
            hint="Meshes must enable cast/receive on materials for visible contact shadows."
            checked={entry.castShadow}
            onCheckedChange={(castShadow) => onPatch(entry.id, { castShadow })}
            ariaLabel={`Cast shadows for ${LIGHT_KIND_LABELS[entry.kind]}`}
          />
        ) : null}

        {entry.kind !== "ambient" ? (
          <TRNInlineToggleRow
            label="Show Three.js helper"
            hint="Gizmo for aim, cone, and range — editor-only."
            checked={entry.helperVisible}
            onCheckedChange={(helperVisible) => onPatch(entry.id, { helperVisible })}
            ariaLabel={`Show Three.js helper for ${LIGHT_KIND_LABELS[entry.kind]}`}
          />
        ) : (
          <TRNHintText tone="muted" className="text-[10px] text-zinc-500">
            Ambient lights have no spatial helper.
          </TRNHintText>
        )}
      </div>
    </div>
  );
}

/**
 * Twin renderer + IBL intensity + user lights. Persisted under **`ternion.project4.graphics.v1`**.
 */
export function Project4GraphicsSetupPanel() {
  const s = useProject4GraphicsStore();
  const { patchProject4Graphics, resetProject4Graphics } = s;

  const [addKind, setAddKind] = useState<Project4TwinLightKind>("directional");

  const toneOptions = useMemo(
    () =>
      PROJECT4_TONE_MAPPING_KEYS.map((k) => ({
        value: k,
        label: TONE_LABELS[k],
      })),
    [],
  );

  const patchLight = useCallback(
    (id: string, partial: Partial<Project4TwinLightEntry>) => {
      const list = useProject4GraphicsStore.getState().lights;
      const idx = list.findIndex((l) => l.id === id);
      if (idx < 0) {
        return;
      }
      const merged = normalizeProject4TwinLightEntry({ ...list[idx], ...partial }, idx);
      patchProject4Graphics({
        lights: list.map((l, i) => (i === idx ? merged : l)),
      });
    },
    [patchProject4Graphics],
  );

  const removeLight = useCallback(
    (id: string) => {
      const list = useProject4GraphicsStore.getState().lights;
      patchProject4Graphics({ lights: list.filter((l) => l.id !== id) });
    },
    [patchProject4Graphics],
  );

  const addLight = useCallback(() => {
    const list = useProject4GraphicsStore.getState().lights;
    if (list.length >= PROJECT4_GRAPHICS_MAX_LIGHTS) {
      return;
    }
    patchProject4Graphics({
      lights: [...list, createProject4TwinLight(addKind)],
    });
  }, [addKind, patchProject4Graphics]);

  return (
    <div className="flex max-h-[min(76vh,720px)] min-h-0 flex-col font-sans antialiased text-zinc-100">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-zinc-400">
            Tune the <span className="text-zinc-300">WebGL renderer</span>,{" "}
            <span className="text-zinc-300">IBL strength</span> when a cubemap environment is active, and{" "}
            <span className="text-zinc-300">scene lights</span>. Cubemap preset stays on the globe menu — this panel
            controls intensity on top of that choice.
          </p>

          <TRNSectionContainer title="Renderer" className={sectionShellClass}>
            <div className="flex flex-col gap-3">
              <TRNSettingRow label="Tone mapping">
                <TRNSelect
                  ariaLabel="Tone mapping"
                  value={s.toneMappingKey}
                  options={toneOptions}
                  onValueChange={(v) => {
                    if (isProject4ToneMappingKey(v)) {
                      patchProject4Graphics({ toneMappingKey: v });
                    }
                  }}
                  className="mt-1"
                  buttonClassName={inputClass}
                />
              </TRNSettingRow>
              <TRNSettingRow label="Exposure" hint="Applied as renderer toneMappingExposure.">
                <TRNScrubNumberInput
                  min={0.05}
                  max={4}
                  step={0.05}
                  fractionDigits={2}
                  value={s.toneMappingExposure}
                  onChange={(toneMappingExposure) => patchProject4Graphics({ toneMappingExposure })}
                  inputClassName={inputClass}
                  className="text-left"
                />
              </TRNSettingRow>
              <TRNSettingRow label="Output color space">
                <TRNSelect
                  ariaLabel="Output color space"
                  value={s.outputColorSpaceKey}
                  options={[
                    { value: "srgb", label: "sRGB (display)" },
                    { value: "linear", label: "Linear sRGB" },
                  ]}
                  onValueChange={(v) => {
                    if (v === "srgb" || v === "linear") {
                      patchProject4Graphics({ outputColorSpaceKey: v });
                    }
                  }}
                  className="mt-1"
                  buttonClassName={inputClass}
                />
              </TRNSettingRow>
              <TRNInlineToggleRow
                label="Shadow map"
                hint="Enables renderer shadow maps. Meshes still need castShadow/receiveShadow on the GLB for visible shadows."
                checked={s.shadowsEnabled}
                onCheckedChange={(shadowsEnabled) => patchProject4Graphics({ shadowsEnabled })}
                ariaLabel="Enable renderer shadow maps"
              />
            </div>
          </TRNSectionContainer>

          <TRNSectionContainer title="Environment (IBL)" className={sectionShellClass}>
            <TRNSettingRow
              label="Environment intensity"
              hint="scene.environmentIntensity — affects cubemap lighting strength when a preset is selected."
            >
              <TRNScrubNumberInput
                min={0}
                max={5}
                step={0.05}
                fractionDigits={2}
                value={s.environmentIntensity}
                onChange={(environmentIntensity) => patchProject4Graphics({ environmentIntensity })}
                inputClassName={inputClass}
                className="text-left"
              />
            </TRNSettingRow>
          </TRNSectionContainer>

          <TRNSectionContainer title="Lights" className={sectionShellClass}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[160px] flex-1">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Add light
                  </div>
                  <TRNSelect
                    ariaLabel="Light type to add"
                    value={addKind}
                    options={PROJECT4_LIGHT_KINDS.map((k) => ({
                      value: k,
                      label: LIGHT_KIND_LABELS[k],
                    }))}
                    onValueChange={(v) => {
                      if (isProject4LightKind(v)) {
                        setAddKind(v);
                      }
                    }}
                    buttonClassName={inputClass}
                  />
                </div>
                <TRNButton
                  type="button"
                  size="compact"
                  className="h-[33px] min-h-[33px] border-zinc-600/80 px-3 text-sm font-semibold tracking-wide"
                  disabled={s.lights.length >= PROJECT4_GRAPHICS_MAX_LIGHTS}
                  onClick={addLight}
                >
                  Add
                </TRNButton>
              </div>
              <TRNHintText className="text-[10px]">
                {s.lights.length}/{PROJECT4_GRAPHICS_MAX_LIGHTS} lights — defaults mirror the former twin key + fill
                rig.
              </TRNHintText>
              <div className="flex flex-col gap-3">
                {s.lights.map((entry) => (
                  <LightEditor key={entry.id} entry={entry} onPatch={patchLight} onRemove={removeLight} />
                ))}
              </div>
            </div>
          </TRNSectionContainer>
        </div>
      </div>
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-3 py-2.5">
        <TRNButton
          type="button"
          size="compact"
          className="w-full border-zinc-600/80 text-xs font-medium text-zinc-200"
          onClick={() => resetProject4Graphics()}
        >
          Restore defaults
        </TRNButton>
        <TRNHintText tone="muted" className="mt-1.5 text-[9px] leading-snug text-zinc-500">
          Resets renderer, IBL intensity, and light list — not MCU / cubemap preset / HUD layout.
        </TRNHintText>
      </div>
    </div>
  );
}
