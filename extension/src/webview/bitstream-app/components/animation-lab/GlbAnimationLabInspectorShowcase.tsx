import {
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LABEL_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
} from "@/ui/TRN";
import { useState, type CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import { ANIMATION_LAB_INSPECTOR_FONT_CLASS } from "./animation-lab-showcase-copy.js";
import { useGlbAnimationLab } from "./glb-animation-lab-context.js";
import { GlbAnimationLabInspectorGraphicsTab } from "./GlbAnimationLabInspectorGraphicsTab.js";
import { GlbAnimationLabInspectorLiveMappingTab } from "./GlbAnimationLabInspectorLiveMappingTab.js";
import { GlbAnimationLabInspectorPlaybackTab } from "./GlbAnimationLabInspectorPlaybackTab.js";
import { GlbAnimationLabInspectorTagSettingsTab } from "./GlbAnimationLabInspectorTagSettingsTab.js";
import { GlbAnimationLabTwinMachinePanel } from "./GlbAnimationLabTwinMachinePanel.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";
import { useAnimationLabInspectorPanelWidth } from "./use-animation-lab-inspector-panel-width.js";
import {
  ANIMATION_LAB_INSPECTOR_SHELL_CLASS,
  ANIMATION_LAB_INSPECTOR_TAB_SCROLL_CLASS,
} from "./animation-lab-inspector-layout.js";

const SHOWCASE_ASIDE_CLASS = twMerge(
  "relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-zinc-700/80 bg-bg-panel p-1",
  ANIMATION_LAB_INSPECTOR_FONT_CLASS,
);

export function GlbAnimationLabInspectorShowcase() {
  const lab = useGlbAnimationLab();
  const twinCtx = useGlbAnimationLabTwin();
  const [inspectorTab, setInspectorTab] = useState("playback");
  const {
    widthPx: inspectorWidthPx,
    onResizePointerDown,
    resetWidth: resetInspectorWidth,
    nudgeWidth: nudgeInspectorWidth,
  } = useAnimationLabInspectorPanelWidth();

  if (lab == null) {
    return null;
  }

  const { modelLabel, runtime } = lab;
  const clipCount = runtime.boundActionCount;
  const totalClips = runtime.gltfClipCount;
  const hasTwin = twinCtx?.twin != null;

  const panelStyle: CSSProperties = { width: inspectorWidthPx };

  return (
    <aside
      className={SHOWCASE_ASIDE_CLASS}
      style={panelStyle}
      aria-label="Animation controls"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize animation inspector panel"
        aria-valuenow={inspectorWidthPx}
        aria-valuemin={280}
        aria-valuemax={560}
        tabIndex={0}
        className="pointer-events-auto absolute top-0 bottom-0 left-0 z-50 w-3 -translate-x-1/2 cursor-col-resize touch-none bg-transparent select-none hover:bg-cyan-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
        onPointerDown={onResizePointerDown}
        onDoubleClick={() => resetInspectorWidth()}
        onKeyDown={(evt) => {
          const step = evt.shiftKey ? 24 : 12;
          if (evt.key === "ArrowLeft") {
            evt.preventDefault();
            nudgeInspectorWidth(step);
            return;
          }
          if (evt.key === "ArrowRight") {
            evt.preventDefault();
            nudgeInspectorWidth(-step);
          }
        }}
      />
      <div className={ANIMATION_LAB_INSPECTOR_SHELL_CLASS}>
        <header className="shrink-0 border-b border-zinc-800/60 px-2.5 pt-2 pb-1.5">
          <h2 className="text-[13px] font-semibold leading-tight text-zinc-100">{modelLabel}</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {totalClips === 0
              ? "No animations in this model"
              : `${clipCount} animation${clipCount === 1 ? "" : "s"}`}
          </p>
        </header>

        <TRNTabs
          value={inspectorTab}
          onValueChange={setInspectorTab}
          lazyMount
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
        >
          <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
            <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
              <TRNTabsTrigger value="playback" className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
                <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Playback</span>
              </TRNTabsTrigger>
              <TRNTabsTrigger
                value="twin"
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
                disabled={!hasTwin}
              >
                <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Machine</span>
              </TRNTabsTrigger>
              <TRNTabsTrigger
                value="mapping"
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
                disabled={!hasTwin}
              >
                <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Live map</span>
              </TRNTabsTrigger>
              <TRNTabsTrigger
                value="graphics"
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
                disabled={!hasTwin}
              >
                <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Tag style</span>
              </TRNTabsTrigger>
              <TRNTabsTrigger
                value="tags"
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
                disabled={!hasTwin}
              >
                <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Components</span>
              </TRNTabsTrigger>
            </TRNTabsList>
          </div>

          <TRNTabsContent value="playback" className={ANIMATION_LAB_INSPECTOR_TAB_SCROLL_CLASS}>
            <GlbAnimationLabInspectorPlaybackTab />
          </TRNTabsContent>

          <TRNTabsContent value="twin" className={ANIMATION_LAB_INSPECTOR_TAB_SCROLL_CLASS}>
            <GlbAnimationLabTwinMachinePanel />
          </TRNTabsContent>

          <TRNTabsContent value="mapping" className={ANIMATION_LAB_INSPECTOR_TAB_SCROLL_CLASS}>
            <GlbAnimationLabInspectorLiveMappingTab />
          </TRNTabsContent>

          <TRNTabsContent value="graphics" className={ANIMATION_LAB_INSPECTOR_TAB_SCROLL_CLASS}>
            <GlbAnimationLabInspectorGraphicsTab />
          </TRNTabsContent>

          <TRNTabsContent value="tags" className={ANIMATION_LAB_INSPECTOR_TAB_SCROLL_CLASS}>
            <GlbAnimationLabInspectorTagSettingsTab />
          </TRNTabsContent>
        </TRNTabs>
      </div>
    </aside>
  );
}
