import {
  TRNButton,
  TRNHintText,
  TRNParameterSlider,
  TRNSelect,
  TRNSortableSettingsCardList,
  TRNToggleSwitch,
  type TRNSortableSettingsCardItem,
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
  TWIN_TAG_SIGNAL_FONT_PX_MAX,
  TWIN_TAG_STATUS_FONT_PX_MAX,
  TWIN_TAG_TITLE_FONT_PX_MAX,
  TWIN_TAG_WIDTH_PX_MAX,
  TWIN_TAG_WORLD_SCALE_MAX,
} from "./animation-lab-twin-tag-style.types.js";
import { GlbAnimationLabInspectorTwinLocaleField } from "./GlbAnimationLabInspectorTwinLocaleField.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";
import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";

const GRAPHICS_CARDS_PANEL_ID = `${ANIMATION_LAB_STORAGE_PREFIX}:inspector-graphics-cards`;

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

  const sortableItems = useMemo((): TRNSortableSettingsCardItem[] => {
    if (twinCtx == null || twinCtx.twin == null) {
      return [];
    }

    return [
      {
        id: "locale",
        title: "Locale",
        defaultExpanded: true,
        content: <GlbAnimationLabInspectorTwinLocaleField />,
      },
      {
        id: "css3d",
        title: "CSS3D rendering",
        defaultExpanded: true,
        content: (
          <div className="flex flex-col gap-2">
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
            <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
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
            <div className="flex items-center justify-between gap-3 rounded border border-zinc-700/80 px-2 py-1">
              <span className="text-[11px] font-medium text-zinc-200">Crisp text (antialiased)</span>
              <TRNToggleSwitch
                size="sm"
                checked={graphicsResolved.crispText}
                ariaLabel="Crisp text (antialiased)"
                onCheckedChange={(next) => patchGlobal({ crispText: next })}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded border border-zinc-700/80 px-2 py-1">
              <span className="text-[11px] font-medium text-zinc-200">
                Scanline overlay
                {!scanlinesSupported ? (
                  <span className="ml-1 text-[10px] font-normal text-zinc-500">(preset)</span>
                ) : null}
              </span>
              <TRNToggleSwitch
                size="sm"
                checked={graphicsResolved.showScanlines}
                disabled={!scanlinesSupported}
                ariaLabel="Scanline overlay"
                onCheckedChange={(next) => patchGlobal({ showScanlines: next })}
              />
            </div>
          </div>
        ),
      },
      {
        id: "preset",
        title: "Card style preset",
        defaultExpanded: true,
        content: (
          <div className="flex flex-col gap-2">
            <TRNSelect
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
          </div>
        ),
      },
      {
        id: "layout",
        title: "Card layout",
        defaultExpanded: false,
        content: (
          <div className="flex flex-col gap-1">
            <TRNParameterSlider
              appearance="divider"
              name="Card width"
              value={sharedResolved.widthPx}
              min={72}
              max={TWIN_TAG_WIDTH_PX_MAX}
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
              max={TWIN_TAG_WORLD_SCALE_MAX}
              step={0.0004}
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
              max={TWIN_TAG_TITLE_FONT_PX_MAX}
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
              max={TWIN_TAG_STATUS_FONT_PX_MAX}
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
              max={TWIN_TAG_SIGNAL_FONT_PX_MAX}
              step={1}
              unit="px"
              throttleMs={80}
              className="px-0"
              onChange={(v) => patchGlobal({ signalFontPx: v })}
            />
          </div>
        ),
      },
      {
        id: "icons",
        title: "Subsystem icons",
        defaultExpanded: false,
        content: (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 rounded border border-zinc-700/80 px-2 py-1">
              <span className="text-[11px] font-medium text-zinc-200">Show icons on all cards</span>
              <TRNToggleSwitch
                size="sm"
                checked={graphicsResolved.showCardIcon}
                ariaLabel="Show icons on all cards"
                onCheckedChange={(next) => patchGlobal({ showCardIcon: next })}
              />
            </div>
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
        ),
      },
    ];
  }, [
    activePresetId,
    applyTagPreset,
    graphicsResolved,
    locale,
    patchGlobal,
    scanlinesSupported,
    sharedResolved,
    twinCtx,
  ]);

  if (twinCtx == null || twinCtx.twin == null) {
    return (
      <TRNHintText tone="muted" className="mb-0 text-[11px]">
        Load a model with a machine twin to adjust 3D tag graphics.
      </TRNHintText>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <TRNHintText tone="muted" className="mb-0 text-[11px] leading-snug">
        Global look and CSS3D rendering for all viewport tags. Per-subsystem title, position, and
        colors are on the Components tab.
      </TRNHintText>
      <TRNSortableSettingsCardList
        panelId={GRAPHICS_CARDS_PANEL_ID}
        items={sortableItems}
        className="space-y-2"
      />
      <TRNButton
        size="compact"
        className="w-full"
        onClick={() => patchGlobal(DEFAULT_TWIN_TAG_GLOBAL_PATCH)}
      >
        Reset all graphics defaults
      </TRNButton>
    </div>
  );
}
