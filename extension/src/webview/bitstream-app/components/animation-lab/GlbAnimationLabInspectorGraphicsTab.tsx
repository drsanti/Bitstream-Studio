import {
  TRNButton,
  TRNHintText,
  TRNParameterSlider,
  TRNSelect,
} from "@/ui/TRN";
import { useMemo } from "react";
import {
  isAnimationLabTwinCss3dHiresMode,
  TWIN_TAG_CSS3D_HIRES_SELECT_OPTIONS,
  twinTagPresetSupportsScanlines,
} from "./animation-lab-twin-graphics.js";
import {
  isAnimationLabTwinTagIconAnimationLevel,
  isAnimationLabTwinTagIconGlyphStyle,
} from "./animation-lab-twin-tag-icons.js";
import { useAnimationLabTwinLocaleStore } from "./animation-lab-twin-locale.store.js";
import { twinPresetDescriptionLocalized } from "./animation-lab-twin-i18n.js";
import {
  isAnimationLabTwinTagPresetId,
  resolveTwinTagPresetId,
  twinTagPresetSelectOptions,
} from "./animation-lab-twin-tag-presets.js";
import { useAnimationLabTwinTagStyleStore } from "./animation-lab-twin-tag-style.store.js";
import {
  DEFAULT_TWIN_TAG_GLOBAL_PATCH,
  resolveTwinTagGlobalStyle,
  resolveTwinTagStyle,
} from "./animation-lab-twin-tag-style.types.js";
import { GlbAnimationLabInspectorTwinLocaleField } from "./GlbAnimationLabInspectorTwinLocaleField.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";

export function GlbAnimationLabInspectorGraphicsTab() {
  const locale = useAnimationLabTwinLocaleStore((s) => s.locale);
  const twinCtx = useGlbAnimationLabTwin();
  const global = useAnimationLabTwinTagStyleStore((s) => s.global);
  const patchGlobal = useAnimationLabTwinTagStyleStore((s) => s.patchGlobal);
  const applyTagPreset = useAnimationLabTwinTagStyleStore((s) => s.applyTagPreset);

  const sharedResolved = useMemo(() => resolveTwinTagGlobalStyle(global), [global]);
  const graphicsResolved = useMemo(() => resolveTwinTagStyle("Tag", global, {}), [global]);
  const activePresetId = resolveTwinTagPresetId(global);
  const scanlinesSupported = twinTagPresetSupportsScanlines(activePresetId);

  if (twinCtx == null || twinCtx.twin == null) {
    return (
      <TRNHintText tone="muted" className="mb-0 text-xs">
        Load a model with a machine twin to adjust 3D tag graphics.
      </TRNHintText>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
        Global look and CSS3D rendering for all viewport tags. Per-subsystem title, position,
        and colors are on the Tags tab.
      </TRNHintText>

      <GlbAnimationLabInspectorTwinLocaleField />

      <div className="flex flex-col gap-2 rounded-md border border-violet-800/35 bg-violet-950/12 p-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-300/90">
          CSS3D rendering
        </span>

        <TRNSelect
          sectionTitle="Label sharpness"
          ariaLabel="CSS3D tag sharpness when zooming"
          value={graphicsResolved.css3dHiresMode}
          options={TWIN_TAG_CSS3D_HIRES_SELECT_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          onValueChange={(value) => {
            if (isAnimationLabTwinCss3dHiresMode(value)) {
              patchGlobal({ css3dHiresMode: value });
            }
          }}
        />
        <TRNHintText tone="muted" className="mb-0 text-[9px] leading-snug">
          Active scale: {graphicsResolved.css3dHiresScale.toFixed(2)}× — higher values stay
          sharper when the camera zooms in (uses more GPU).
        </TRNHintText>

        <TRNParameterSlider
          appearance="divider"
          name="Card opacity"
          value={graphicsResolved.tagOpacity}
          min={0.35}
          max={1}
          step={0.05}
          throttleMs={80}
          valueFormatter={(v) => `${Math.round(v * 100)}`}
          unit="%"
          className="px-0"
          onChange={(v) => patchGlobal({ tagOpacity: v })}
        />

        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            className="accent-violet-500"
            checked={graphicsResolved.crispText}
            onChange={(e) => patchGlobal({ crispText: e.target.checked })}
          />
          Crisp text (antialiased)
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            className="accent-violet-500"
            checked={graphicsResolved.showScanlines}
            disabled={!scanlinesSupported}
            onChange={(e) => patchGlobal({ showScanlines: e.target.checked })}
          />
          Scanline overlay
          {!scanlinesSupported ? (
            <span className="text-[9px] text-zinc-500">(not on this preset)</span>
          ) : null}
        </label>
      </div>

      <TRNSelect
        sectionTitle="Card style preset"
        ariaLabel="3D tag visual preset"
        value={activePresetId}
        options={twinTagPresetSelectOptions(locale)}
        onValueChange={(value) => {
          if (isAnimationLabTwinTagPresetId(value)) {
            applyTagPreset(value);
          }
        }}
      />
      <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
        {twinPresetDescriptionLocalized(activePresetId, locale)}
        {activePresetId === "bracket-tactical"
          ? " · subsystem icon in top-right corner."
          : null}
      </TRNHintText>

      <div className="flex flex-col gap-2 rounded-md border border-cyan-800/40 bg-cyan-950/15 p-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400/90">
          Card layout
        </span>

        <TRNParameterSlider
          appearance="divider"
          name="Card width"
          value={sharedResolved.widthPx}
          min={72}
          max={280}
          step={4}
          unit="px"
          throttleMs={80}
          className="px-0"
          onChange={(v) => patchGlobal({ widthPx: v })}
        />
        <TRNParameterSlider
          appearance="divider"
          name="Min height"
          value={sharedResolved.minHeightPx}
          min={0}
          max={160}
          step={4}
          unit="px"
          throttleMs={80}
          className="px-0"
          onChange={(v) => patchGlobal({ minHeightPx: v })}
        />
        <TRNParameterSlider
          appearance="divider"
          name="3D world scale"
          value={sharedResolved.worldScale}
          min={0.001}
          max={0.012}
          step={0.0002}
          throttleMs={80}
          valueFormatter={(v) => v.toFixed(4)}
          className="px-0"
          onChange={(v) => patchGlobal({ worldScale: v })}
        />
        <TRNParameterSlider
          appearance="divider"
          name="Title font"
          value={sharedResolved.titleFontPx}
          min={8}
          max={18}
          step={1}
          unit="px"
          throttleMs={80}
          className="px-0"
          onChange={(v) => patchGlobal({ titleFontPx: v })}
        />
        <TRNParameterSlider
          appearance="divider"
          name="Status font"
          value={sharedResolved.statusFontPx}
          min={7}
          max={14}
          step={1}
          unit="px"
          throttleMs={80}
          className="px-0"
          onChange={(v) => patchGlobal({ statusFontPx: v })}
        />
        <TRNParameterSlider
          appearance="divider"
          name="Signal font"
          value={sharedResolved.signalFontPx}
          min={7}
          max={14}
          step={1}
          unit="px"
          throttleMs={80}
          className="px-0"
          onChange={(v) => patchGlobal({ signalFontPx: v })}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-emerald-900/40 bg-emerald-950/10 p-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/85">
          Subsystem icons
        </span>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={graphicsResolved.showCardIcon}
            onChange={(e) => patchGlobal({ showCardIcon: e.target.checked })}
          />
          Show icons on all cards
        </label>

        <TRNSelect
          sectionTitle="Icon animation"
          ariaLabel="Subsystem icon animation level"
          value={graphicsResolved.iconAnimationLevel}
          options={[
            { value: "full", label: "Full (health + live + motion)" },
            { value: "health", label: "Health only (pulse / fault)" },
            { value: "off", label: "Off (static icons)" },
          ]}
          onValueChange={(value) => {
            if (isAnimationLabTwinTagIconAnimationLevel(value)) {
              patchGlobal({ iconAnimationLevel: value });
            }
          }}
        />

        <TRNSelect
          sectionTitle="Icon style"
          ariaLabel="Subsystem icon glyph style"
          value={graphicsResolved.iconGlyphStyle}
          options={[
            { value: "lucide", label: "Lucide strokes" },
            { value: "hud", label: "HUD mono glyphs" },
          ]}
          onValueChange={(value) => {
            if (isAnimationLabTwinTagIconGlyphStyle(value)) {
              patchGlobal({ iconGlyphStyle: value });
            }
          }}
        />
      </div>

      <TRNButton
        size="compact"
        tone="neutral"
        className="w-full border-zinc-600/80 bg-zinc-900/60 text-xs"
        onClick={() => patchGlobal(DEFAULT_TWIN_TAG_GLOBAL_PATCH)}
      >
        Reset all graphics defaults
      </TRNButton>
    </div>
  );
}
