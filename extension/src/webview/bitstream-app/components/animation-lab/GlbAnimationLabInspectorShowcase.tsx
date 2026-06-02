import {
  TRNButton,
  TRNChipButtonGroup,
  TRNFormField,
  TRNHintText,
  TRNParameterSlider,
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
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import {
  ANIMATION_LAB_INSPECTOR_FONT_CLASS,
  ANIMATION_LAB_SHOWCASE_LOOP_OPTIONS,
  ANIMATION_LAB_SHOWCASE_PLAYBACK_MODES,
  ANIMATION_LAB_SHOWCASE_SECTION_LABELS,
} from "./animation-lab-showcase-copy.js";
import { formatAnimationLabTimelineRangeSeconds } from "./animation-lab-showcase-time.js";
import { useAnimationLabTimelinePositionS } from "./use-animation-lab-timeline-time-s.js";
import {
  DEFAULT_ANIMATION_LAB_CLIP_SETTINGS,
  type GlbAnimationLabClipSettings,
  type GlbAnimationLabPlaybackMode,
} from "./glb-animation-lab.types.js";
import { useGlbAnimationLab } from "./glb-animation-lab-context.js";
import { resolveAnimationLabActionKey } from "./animation-lab-action-key.js";
import {
  AnimationLabClipRowHintContent,
  formatAnimationLabClipRowSubline,
} from "./animation-lab-clip-row-detail.js";
import { resolveAnimationLabClipDisplayName } from "./glb-animation-lab-clip-display-name.js";
import { GlbAnimationLabInspectorGraphicsTab } from "./GlbAnimationLabInspectorGraphicsTab.js";
import { GlbAnimationLabInspectorLiveMappingTab } from "./GlbAnimationLabInspectorLiveMappingTab.js";
import { GlbAnimationLabInspectorTagSettingsTab } from "./GlbAnimationLabInspectorTagSettingsTab.js";
import { GlbAnimationLabTwinMachinePanel } from "./GlbAnimationLabTwinMachinePanel.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";
import { useAnimationLabInspectorPanelWidth } from "./use-animation-lab-inspector-panel-width.js";

const SHOWCASE_PANEL_CLASS = twMerge(
  "relative flex h-full min-h-0 shrink-0 flex-col gap-3 overflow-hidden border-l border-zinc-700/80 bg-zinc-950/90 p-3",
  ANIMATION_LAB_INSPECTOR_FONT_CLASS,
);

const CLIP_ROW_BUTTON_CLASS =
  "flex w-full min-h-10 min-w-0 items-center rounded-md border px-3 py-2 text-left text-xs font-medium leading-snug transition-colors font-sans";

function resolveNowPlayingClipName(
  playbackMode: GlbAnimationLabPlaybackMode,
  activeClipName: string | null,
  liveClipName: string | null,
): string | null {
  if (playbackMode === "parallel-all") {
    return null;
  }
  return liveClipName ?? activeClipName;
}

export function GlbAnimationLabInspectorShowcase() {
  const lab = useGlbAnimationLab();
  const twinCtx = useGlbAnimationLabTwin();
  const [moreOpen, setMoreOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState("playback");
  const {
    widthPx: inspectorWidthPx,
    onResizePointerDown,
    resetWidth: resetInspectorWidth,
    nudgeWidth: nudgeInspectorWidth,
  } = useAnimationLabInspectorPanelWidth();

  const runtime = lab?.runtime;
  const catalogHints = runtime?.catalogHints ?? lab?.catalogHintsApplied ?? null;

  const timelineTimeS = useAnimationLabTimelinePositionS({
    transport: lab?.transport ?? "stopped",
    isScrubbing: lab?.isScrubbing ?? false,
    scrubTimeS: lab?.scrubTimeS ?? 0,
  });

  if (lab == null) {
    return null;
  }

  const {
    transport,
    playbackMode,
    setPlaybackMode,
    activeClipName,
    setActiveClipName,
    clipOrder,
    moveClipInOrder,
    clipSettings,
    updateClipSettings,
    soloCrossFadeS,
    setSoloCrossFadeS,
    setTransport,
    isScrubbing,
    setIsScrubbing,
    scrubTimeS,
    setScrubTimeS,
    livePlayback,
    modelLabel,
  } = lab;

  const clipCount = lab.runtime.boundActionCount;
  const totalClips = lab.runtime.gltfClipCount;

  const settingsClip =
    resolveAnimationLabActionKey(new Set(lab.runtime.clipNames), activeClipName) ??
    lab.runtime.clipNames[0] ??
    null;
  const settings =
    settingsClip != null
      ? (clipSettings[settingsClip] ?? DEFAULT_ANIMATION_LAB_CLIP_SETTINGS)
      : DEFAULT_ANIMATION_LAB_CLIP_SETTINGS;

  const clipDuration =
    settingsClip != null
      ? (lab.runtime.clipDurationByName[settingsClip] ?? lab.runtime.maxClipDurationS)
      : lab.runtime.maxClipDurationS;
  const maxT = Math.max(0.01, clipDuration > 0 ? clipDuration : lab.runtime.maxClipDurationS);

  const timelinePositionS = Math.min(Math.max(0, timelineTimeS), maxT);

  const activeClipKey =
    resolveAnimationLabActionKey(new Set(lab.runtime.clipNames), activeClipName) ?? null;

  const playDisabled =
    lab.runtime.boundActionCount === 0 ||
    (playbackMode === "per-clip" && activeClipKey == null);

  const scrubDisabled = lab.runtime.boundActionCount === 0 || settingsClip == null;

  const listOrder =
    playbackMode === "sequence" && clipOrder.length > 0 ? clipOrder : lab.runtime.clipNames;

  /** Per-clip only: blends when the operator picks another clip in step 3. */
  const showSmoothClipChange =
    playbackMode === "per-clip" && listOrder.length > 1 && settingsClip != null;

  const fineTuneAppliesToAll =
    playbackMode === "parallel-all" || playbackMode === "sequence";

  const fineTuneScopeCaption = fineTuneAppliesToAll
    ? playbackMode === "parallel-all"
      ? "Applies to every animation at once"
      : "Applies to every clip in the tour"
    : settingsClip != null
      ? `Selected clip: ${resolveAnimationLabClipDisplayName(settingsClip, catalogHints)}`
      : "";

  const applyFineTuneSettings = (patch: Partial<GlbAnimationLabClipSettings>) => {
    if (settingsClip == null) {
      return;
    }
    if (fineTuneAppliesToAll) {
      for (const name of lab.runtime.clipNames) {
        updateClipSettings(name, patch);
      }
      return;
    }
    updateClipSettings(settingsClip, patch);
  };

  const nowPlayingKey = resolveNowPlayingClipName(
    playbackMode,
    activeClipKey,
    livePlayback.clipName,
  );
  const nowPlayingLabel =
    playbackMode === "parallel-all"
      ? "All animations"
      : nowPlayingKey != null
        ? resolveAnimationLabClipDisplayName(nowPlayingKey, catalogHints)
        : transport === "playing"
          ? "Starting…"
          : "—";

  const hasTwin = twinCtx?.twin != null;

  const panelStyle: CSSProperties = { width: inspectorWidthPx };

  return (
    <aside
      className={SHOWCASE_PANEL_CLASS}
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
      <header className="flex shrink-0 flex-col gap-1">
        <h2 className="text-base font-semibold leading-snug text-zinc-50">{modelLabel}</h2>
        <p className="text-xs text-zinc-400">
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

        <TRNTabsContent
          value="playback"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-hide"
        >
      <section className="space-y-2">
        <TRNChipButtonGroup
          label={ANIMATION_LAB_SHOWCASE_SECTION_LABELS.playbackMode}
          ariaLabel={ANIMATION_LAB_SHOWCASE_SECTION_LABELS.playbackMode}
          value={playbackMode}
          columns={1}
          size="md"
          options={ANIMATION_LAB_SHOWCASE_PLAYBACK_MODES.map((m) => ({
            value: m.value,
            label: m.label,
            title: m.hint,
          }))}
          onChange={(v) => {
            if (v === "per-clip" || v === "parallel-all" || v === "sequence") {
              setPlaybackMode(v);
              setTransport("stopped");
              setScrubTimeS(0);
            }
          }}
        />
      </section>

      {lab.runtime.boundActionCount > 0 && settingsClip != null ? (
        <section className="space-y-2">
          <TRNChipButtonGroup
            label={ANIMATION_LAB_SHOWCASE_SECTION_LABELS.loop}
            ariaLabel={ANIMATION_LAB_SHOWCASE_SECTION_LABELS.loop}
            value={settings.loopMode}
            columns={1}
            size="md"
            options={ANIMATION_LAB_SHOWCASE_LOOP_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              title: o.hint,
            }))}
            onChange={(v) => {
              if (v === "loop" || v === "once" || v === "pingpong") {
                updateClipSettings(settingsClip, { loopMode: v });
              }
            }}
          />
        </section>
      ) : null}

      <section className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-zinc-100">
          {ANIMATION_LAB_SHOWCASE_SECTION_LABELS.animations}
        </span>
        {listOrder.length === 0 ? (
          <TRNHintText tone="muted" className="mb-0 text-xs">
            This model has no animations to preview.
          </TRNHintText>
        ) : (
          <div className="flex w-full min-w-0 flex-col gap-1">
            {listOrder.map((name, index) => {
              const clipKey =
                resolveAnimationLabActionKey(new Set(lab.runtime.clipNames), name) ?? name;
              const selected = activeClipKey === clipKey;
              const showReorder = playbackMode === "sequence";
              const display = resolveAnimationLabClipDisplayName(name, catalogHints);
              const durationS = lab.runtime.clipDurationByName[name];
              const playingKey =
                resolveAnimationLabActionKey(
                  new Set(lab.runtime.clipNames),
                  livePlayback.clipName,
                ) ?? null;
              const isPlayingNow =
                transport === "playing" &&
                (playingKey === clipKey ||
                  (playbackMode === "sequence" && activeClipKey === clipKey));
              const rowDetail = {
                clipName: name,
                displayName: display,
                durationS,
                playbackMode,
                tourIndex: showReorder ? index : null,
                tourTotal: showReorder ? listOrder.length : null,
                selected,
                isPlayingNow,
              };
              const subline = formatAnimationLabClipRowSubline(rowDetail);
              const atTop = index === 0;
              const atBottom = index === listOrder.length - 1;
              return (
                <div key={name} className="flex w-full min-w-0 items-stretch gap-1">
                  {showReorder ? (
                    <div className="flex w-7 shrink-0 flex-col justify-center gap-0.5">
                      <button
                        type="button"
                        disabled={atTop}
                        className="flex h-5 w-full items-center justify-center rounded border border-zinc-600/70 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                        aria-label={`Move ${display} earlier in the tour`}
                        onClick={() => moveClipInOrder(name, "up")}
                      >
                        <ChevronUp className="h-3 w-3" aria-hidden />
                      </button>
                      <button
                        type="button"
                        disabled={atBottom}
                        className="flex h-5 w-full items-center justify-center rounded border border-zinc-600/70 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                        aria-label={`Move ${display} later in the tour`}
                        onClick={() => moveClipInOrder(name, "down")}
                      >
                        <ChevronDown className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                  <TRNButton
                    type="button"
                    size="compact"
                    disabled={playbackMode === "parallel-all"}
                    hint={<AnimationLabClipRowHintContent {...rowDetail} />}
                    className={twMerge(
                      CLIP_ROW_BUTTON_CLASS,
                      "h-auto flex-col items-start gap-0.5 py-2 shadow-none",
                      showReorder ? "min-w-0 flex-1" : "w-full",
                      selected
                        ? "border-l-2 border-l-emerald-500 border-emerald-600/50 bg-emerald-950/50 text-emerald-50"
                        : "border-zinc-700/60 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800/60 disabled:opacity-50",
                    )}
                    onClick={() => {
                      setActiveClipName(clipKey);
                      setTransport("stopped");
                      setScrubTimeS(0);
                    }}
                  >
                    <span className="block w-full truncate text-xs font-medium">{display}</span>
                    {subline != null ? (
                      <span className="block w-full truncate text-[10px] font-normal leading-tight text-zinc-400">
                        {subline}
                      </span>
                    ) : null}
                  </TRNButton>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showSmoothClipChange ? (
        <section className="rounded-md border border-zinc-800/80 bg-zinc-950/40 px-2 py-1">
          <TRNParameterSlider
            appearance="divider"
            name="Smooth clip change"
            value={soloCrossFadeS}
            min={0}
            max={2}
            step={0.01}
            unit="s"
            throttleMs={80}
            valueFormatter={(v) => v.toFixed(2)}
            className="px-0"
            onChange={setSoloCrossFadeS}
          />
        </section>
      ) : null}

      {lab.runtime.boundActionCount > 0 ? (
        <section className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-zinc-100">
            {ANIMATION_LAB_SHOWCASE_SECTION_LABELS.transport}
          </span>
          <div className="flex gap-1.5">
            <TRNButton
              type="button"
              size="compact"
              disabled={playDisabled}
              selected={transport === "playing"}
              hint={
                playDisabled && playbackMode === "per-clip"
                  ? "Select an animation in the list first"
                  : "Start playback"
              }
              className="min-h-8 flex-1 gap-1.5 text-xs"
              onClick={() => {
                setIsScrubbing(false);
                setTransport("playing");
              }}
            >
              <Play className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Play
            </TRNButton>
            <TRNButton
              type="button"
              size="compact"
              className="min-h-8 flex-1 gap-1.5 text-xs"
              disabled={transport === "stopped"}
              hint="Pause playback"
              onClick={() => {
                setScrubTimeS(timelinePositionS);
                setTransport("paused");
              }}
            >
              <Pause className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Pause
            </TRNButton>
            <TRNButton
              type="button"
              size="compact"
              className="min-h-8 flex-1 gap-1.5 text-xs"
              hint="Return to the start of the timeline"
              onClick={() => {
                setIsScrubbing(false);
                setScrubTimeS(0);
                setTransport("stopped");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Back to start
            </TRNButton>
          </div>

          <TRNFormField
            label={formatAnimationLabTimelineRangeSeconds(timelinePositionS, maxT)}
            layout="stacked"
          >
            <input
              type="range"
              min={0}
              max={maxT}
              step={0.01}
              disabled={scrubDisabled}
              value={timelinePositionS}
              className="h-2 w-full accent-emerald-500 disabled:opacity-40"
              aria-label="Scrub animation timeline"
              onPointerDown={() => {
                setIsScrubbing(true);
                setTransport("paused");
              }}
              onPointerUp={() => setIsScrubbing(false)}
              onChange={(e) => {
                setScrubTimeS(Number(e.target.value));
                setIsScrubbing(true);
                setTransport("paused");
              }}
            />
          </TRNFormField>

          <p className="text-sm font-medium text-emerald-200/95">
            {transport === "playing" ? "Now playing" : transport === "paused" ? "Paused on" : "Ready"}
            {": "}
            <span className="text-zinc-100">{nowPlayingLabel}</span>
          </p>
        </section>
      ) : null}

      <section className="border-t border-zinc-800/80 pt-2">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1.5 text-left text-xs font-semibold text-zinc-200 hover:bg-zinc-800/40"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          Fine-tune playback
          <ChevronDown
            className={twMerge(
              "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
              moreOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {moreOpen && settingsClip != null ? (
          <div className="mt-2 flex flex-col gap-1 rounded-md border border-zinc-700/60 bg-zinc-900/40 px-2 py-1">
            {fineTuneScopeCaption.length > 0 ? (
              <TRNHintText tone="muted" className="mb-0 px-0.5 text-[10px] leading-snug">
                {fineTuneScopeCaption}
              </TRNHintText>
            ) : null}
            <TRNParameterSlider
              appearance="divider"
              name="Playback speed"
              value={settings.speed}
              min={0.1}
              max={3}
              step={0.05}
              unit="×"
              throttleMs={80}
              valueFormatter={(v) => v.toFixed(1)}
              className="px-0"
              onChange={(v) => applyFineTuneSettings({ speed: v })}
            />
            <TRNParameterSlider
              appearance="divider"
              name="Move strength"
              value={settings.weight}
              min={0}
              max={1}
              step={0.05}
              throttleMs={80}
              valueFormatter={(v) => `${Math.round(v * 100)}`}
              unit="%"
              className="px-0"
              onChange={(v) => applyFineTuneSettings({ weight: v })}
            />
          </div>
        ) : null}
      </section>
        </TRNTabsContent>

        <TRNTabsContent value="twin" className="min-h-0 overflow-y-auto scrollbar-hide">
          <GlbAnimationLabTwinMachinePanel />
        </TRNTabsContent>

        <TRNTabsContent value="mapping" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <GlbAnimationLabInspectorLiveMappingTab />
        </TRNTabsContent>

        <TRNTabsContent value="graphics" className="min-h-0 overflow-y-auto scrollbar-hide">
          <GlbAnimationLabInspectorGraphicsTab />
        </TRNTabsContent>

        <TRNTabsContent value="tags" className="min-h-0 overflow-y-auto scrollbar-hide">
          <GlbAnimationLabInspectorTagSettingsTab />
        </TRNTabsContent>
      </TRNTabs>
    </aside>
  );
}
