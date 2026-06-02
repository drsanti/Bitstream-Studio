import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNParameterSlider,
  TRNSelect,
} from "@/ui/TRN";
import { useEffect, useMemo, useState } from "react";
import { useAnimationLabTwinTagStyleStore } from "./animation-lab-twin-tag-style.store.js";
import {
  DEFAULT_TWIN_TAG_COMPONENT_PATCH,
  resolveTwinTagStyle,
  twinTagColorInputValue,
} from "./animation-lab-twin-tag-style.types.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";

function ColorField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TRNFormField label={props.label} layout="stacked">
      <div className="flex gap-1.5">
        <input
          type="color"
          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-zinc-700/80 bg-zinc-900"
          value={twinTagColorInputValue(props.value)}
          onChange={(e) => props.onChange(e.target.value)}
          aria-label={`${props.label} color picker`}
        />
        <input
          type="text"
          className="min-w-0 flex-1 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1.5 font-mono text-[10px] text-zinc-100"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </TRNFormField>
  );
}

export function GlbAnimationLabInspectorTagSettingsTab() {
  const twinCtx = useGlbAnimationLabTwin();
  const global = useAnimationLabTwinTagStyleStore((s) => s.global);
  const byComponent = useAnimationLabTwinTagStyleStore((s) => s.byComponent);
  const patchComponent = useAnimationLabTwinTagStyleStore((s) => s.patchComponent);
  const resetComponent = useAnimationLabTwinTagStyleStore((s) => s.resetComponent);
  const resetAll = useAnimationLabTwinTagStyleStore((s) => s.resetAll);

  const components = twinCtx?.components ?? [];
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (components.length === 0) {
      setEditId(null);
      return;
    }
    if (editId == null || !components.some((c) => c.id === editId)) {
      setEditId(twinCtx?.selectedComponentId ?? components[0]?.id ?? null);
    }
  }, [components, editId, twinCtx?.selectedComponentId]);

  const selectOptions = useMemo(
    () =>
      components.map((c) => ({
        value: c.id,
        label: c.label,
      })),
    [components],
  );

  if (twinCtx == null || twinCtx.twin == null || components.length === 0) {
    return (
      <TRNHintText tone="muted" className="mb-0 text-xs">
        Load a model with a machine twin to tune per-subsystem 3D tags.
      </TRNHintText>
    );
  }

  const row = components.find((c) => c.id === editId) ?? null;
  const rawComponent = editId != null ? byComponent[editId] : undefined;
  const resolved =
    row != null ? resolveTwinTagStyle(row.label, global, rawComponent) : null;

  return (
    <div className="flex flex-col gap-3">
      <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
        Per-subsystem overrides for title, anchor offset, visibility, and colors. Shared preset,
        fonts, sharpness, and icons are on the Tag style tab.
      </TRNHintText>

      <TRNSelect
        sectionTitle="Subsystem"
        ariaLabel="Subsystem to edit 3D tag"
        value={editId ?? ""}
        options={selectOptions}
        onValueChange={(value) => {
          if (value.length === 0) {
            setEditId(null);
            return;
          }
          setEditId(value);
          twinCtx.selectComponent(value);
        }}
      />

      {row != null && resolved != null && editId != null ? (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/50 p-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            This subsystem
          </span>

          <TRNFormField label="Title (device name)" layout="stacked">
            <input
              type="text"
              className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1.5 text-xs text-zinc-100"
              value={rawComponent?.title ?? ""}
              placeholder={row.label}
              onChange={(e) => patchComponent(editId, { title: e.target.value })}
            />
          </TRNFormField>

          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Position offset (m)
          </span>

          <TRNParameterSlider
            appearance="divider"
            name="Offset X"
            value={resolved.offsetX}
            min={-2}
            max={2}
            step={0.01}
            unit="m"
            throttleMs={60}
            valueFormatter={(v) => v.toFixed(2)}
            className="px-0"
            onChange={(v) => patchComponent(editId, { offsetX: v })}
          />
          <TRNParameterSlider
            appearance="divider"
            name="Offset Y"
            value={resolved.offsetY}
            min={-2}
            max={2}
            step={0.01}
            unit="m"
            throttleMs={60}
            valueFormatter={(v) => v.toFixed(2)}
            className="px-0"
            onChange={(v) => patchComponent(editId, { offsetY: v })}
          />
          <TRNParameterSlider
            appearance="divider"
            name="Offset Z"
            value={resolved.offsetZ}
            min={-2}
            max={2}
            step={0.01}
            unit="m"
            throttleMs={60}
            valueFormatter={(v) => v.toFixed(2)}
            className="px-0"
            onChange={(v) => patchComponent(editId, { offsetZ: v })}
          />

          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Content
          </span>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              className="accent-cyan-500"
              checked={resolved.showCardIcon}
              onChange={(e) => patchComponent(editId, { showCardIcon: e.target.checked })}
            />
            Show animated subsystem icon
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              className="accent-cyan-500"
              checked={resolved.showHealthPill}
              onChange={(e) => patchComponent(editId, { showHealthPill: e.target.checked })}
            />
            Show health status pill
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              className="accent-cyan-500"
              checked={resolved.showTopSignal}
              onChange={(e) => patchComponent(editId, { showTopSignal: e.target.checked })}
            />
            Show top signal on card
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              className="accent-cyan-500"
              checked={resolved.visible}
              onChange={(e) => patchComponent(editId, { visible: e.target.checked })}
            />
            Visible in 3D
          </label>

          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Colors
          </span>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              className="accent-cyan-500"
              checked={resolved.useCustomColors}
              onChange={(e) => patchComponent(editId, { useCustomColors: e.target.checked })}
            />
            Custom colors (ignore health theme)
          </label>

          {resolved.useCustomColors ? (
            <div className="flex flex-col gap-2 rounded border border-zinc-800/70 bg-zinc-950/60 p-2">
              <ColorField
                label="Border"
                value={resolved.borderColor}
                onChange={(v) => patchComponent(editId, { borderColor: v })}
              />
              <TRNFormField label="Background" layout="stacked">
                <input
                  type="text"
                  className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1.5 font-mono text-[10px] text-zinc-100"
                  value={rawComponent?.backgroundColor ?? resolved.backgroundColor}
                  onChange={(e) => patchComponent(editId, { backgroundColor: e.target.value })}
                  placeholder="rgba(9, 9, 11, 0.82)"
                  spellCheck={false}
                />
              </TRNFormField>
              <ColorField
                label="Text"
                value={resolved.textColor}
                onChange={(v) => patchComponent(editId, { textColor: v })}
              />
              <ColorField
                label="Muted text"
                value={resolved.mutedTextColor}
                onChange={(v) => patchComponent(editId, { mutedTextColor: v })}
              />
            </div>
          ) : (
            <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
              Health theme tints the card from OK → caution → warning → fault.
            </TRNHintText>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <TRNButton
              size="compact"
              tone="neutral"
              className="border-zinc-600/80 bg-zinc-900/60 text-[11px]"
              onClick={() => resetComponent(editId)}
            >
              Reset subsystem
            </TRNButton>
            <TRNButton
              size="compact"
              tone="neutral"
              className="border-zinc-600/80 bg-zinc-900/60 text-[11px]"
              onClick={() => patchComponent(editId, { ...DEFAULT_TWIN_TAG_COMPONENT_PATCH })}
            >
              Subsystem defaults
            </TRNButton>
          </div>
        </div>
      ) : null}

      <TRNButton
        size="compact"
        tone="neutral"
        className="w-full border-zinc-600/80 bg-zinc-900/60 text-xs"
        onClick={() => resetAll()}
      >
        Reset all tag styles for this model
      </TRNButton>
    </div>
  );
}
