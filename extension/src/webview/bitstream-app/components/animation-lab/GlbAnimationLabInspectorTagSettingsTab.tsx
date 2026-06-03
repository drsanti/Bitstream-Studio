import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNParameterSlider,
  TRNSelect,
  TRNSortableSettingsCardList,
  TRNToggleSwitch,
  type TRNSortableSettingsCardItem,
} from "@/ui/TRN";
import { useEffect, useMemo, useState } from "react";
import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";
import { useAnimationLabTwinTagStyleStore } from "./animation-lab-twin-tag-style.store.js";
import {
  DEFAULT_TWIN_TAG_COMPONENT_PATCH,
  resolveTwinTagStyle,
  twinTagColorInputValue,
} from "./animation-lab-twin-tag-style.types.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";

const TAG_SETTINGS_CARDS_PANEL_ID = `${ANIMATION_LAB_STORAGE_PREFIX}:inspector-tag-settings-cards`;

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
          className="min-w-0 flex-1 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1.5 text-[10px] text-zinc-100"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </TRNFormField>
  );
}

function TagToggleRow(props: {
  label: string;
  checked: boolean;
  ariaLabel: string;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-zinc-700/80 px-2 py-1">
      <span className="text-[11px] font-medium text-zinc-200">{props.label}</span>
      <TRNToggleSwitch
        size="sm"
        checked={props.checked}
        ariaLabel={props.ariaLabel}
        onCheckedChange={props.onCheckedChange}
      />
    </div>
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

  const row = components.find((c) => c.id === editId) ?? null;
  const rawComponent = editId != null ? byComponent[editId] : undefined;
  const resolved =
    row != null ? resolveTwinTagStyle(row.label, global, rawComponent) : null;

  const sortableItems = useMemo((): TRNSortableSettingsCardItem[] => {
    if (twinCtx == null || row == null || resolved == null || editId == null) {
      return [
        {
          id: "subsystem",
          title: "Subsystem",
          defaultExpanded: true,
          content: (
            <TRNSelect
              ariaLabel="Subsystem to edit 3D tag"
              value={editId ?? ""}
              options={selectOptions}
              onValueChange={(value) => {
                if (value.length === 0) {
                  setEditId(null);
                  return;
                }
                setEditId(value);
                twinCtx?.selectComponent(value);
              }}
            />
          ),
        },
      ];
    }

    return [
      {
        id: "subsystem",
        title: "Subsystem",
        defaultExpanded: true,
        content: (
          <TRNSelect
            ariaLabel="Subsystem to edit 3D tag"
            value={editId}
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
        ),
      },
      {
        id: "overrides",
        title: row.label,
        defaultExpanded: true,
        content: (
          <div className="flex flex-col gap-2">
            <TRNFormField label="Title (device name)" layout="stacked">
              <input
                type="text"
                className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1.5 text-[11px] text-zinc-100"
                value={rawComponent?.title ?? ""}
                placeholder={row.label}
                onChange={(e) => patchComponent(editId, { title: e.target.value })}
              />
            </TRNFormField>

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

            <TagToggleRow
              label="Show animated subsystem icon"
              checked={resolved.showCardIcon}
              ariaLabel="Show animated subsystem icon"
              onCheckedChange={(next) => patchComponent(editId, { showCardIcon: next })}
            />
            <TagToggleRow
              label="Show health status pill"
              checked={resolved.showHealthPill}
              ariaLabel="Show health status pill"
              onCheckedChange={(next) => patchComponent(editId, { showHealthPill: next })}
            />
            <TagToggleRow
              label="Show top signal on card"
              checked={resolved.showTopSignal}
              ariaLabel="Show top signal on card"
              onCheckedChange={(next) => patchComponent(editId, { showTopSignal: next })}
            />
            <TagToggleRow
              label="Visible in 3D"
              checked={resolved.visible}
              ariaLabel="Visible in 3D"
              onCheckedChange={(next) => patchComponent(editId, { visible: next })}
            />
            <TagToggleRow
              label="Custom colors (ignore health theme)"
              checked={resolved.useCustomColors}
              ariaLabel="Custom colors (ignore health theme)"
              onCheckedChange={(next) => patchComponent(editId, { useCustomColors: next })}
            />

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
                    className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1.5 text-[10px] text-zinc-100"
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
              <TRNButton size="compact" className="px-2 text-[11px]" onClick={() => resetComponent(editId)}>
                Reset subsystem
              </TRNButton>
              <TRNButton
                size="compact"
                className="px-2 text-[11px]"
                onClick={() => patchComponent(editId, { ...DEFAULT_TWIN_TAG_COMPONENT_PATCH })}
              >
                Subsystem defaults
              </TRNButton>
            </div>
          </div>
        ),
      },
    ];
  }, [
    byComponent,
    editId,
    patchComponent,
    resetComponent,
    resolved,
    row,
    selectOptions,
    twinCtx,
  ]);

  if (twinCtx == null || twinCtx.twin == null || components.length === 0) {
    return (
      <TRNHintText tone="muted" className="mb-0 text-[11px]">
        Load a model with a machine twin to tune per-subsystem 3D tags.
      </TRNHintText>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <TRNHintText tone="muted" className="mb-0 text-[11px] leading-snug">
        Per-subsystem overrides for title, anchor offset, visibility, and colors. Shared preset,
        fonts, sharpness, and icons are on the Tag style tab.
      </TRNHintText>
      <TRNSortableSettingsCardList
        panelId={TAG_SETTINGS_CARDS_PANEL_ID}
        items={sortableItems}
        className="space-y-2"
      />
      <TRNButton size="compact" className="w-full" onClick={() => resetAll()}>
        Reset all tag styles for this model
      </TRNButton>
    </div>
  );
}
