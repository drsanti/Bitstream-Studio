import {
  TRNButton,
  TRNChipButtonGroup,
  TRNFormField,
  TRNHintText,
  TRNParameterSlider,
  TRNSortableSettingsCardList,
  type TRNSortableSettingsCardItem,
} from "@/ui/TRN";
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import {
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
import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";

const PLAYBACK_CARDS_PANEL_ID = `${ANIMATION_LAB_STORAGE_PREFIX}:inspector-playback-cards`;

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

export function GlbAnimationLabInspectorPlaybackTab() {
  const lab = useGlbAnimationLab();

  const timelineTimeS = useAnimationLabTimelinePositionS({
    transport: lab?.transport ?? "stopped",
    isScrubbing: lab?.isScrubbing ?? false,
    scrubTimeS: lab?.scrubTimeS ?? 0,
  });

  const sortableItems = useMemo((): TRNSortableSettingsCardItem[] => {
    if (lab == null) {
      return [];
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
      setIsScrubbing,
      setScrubTimeS,
      livePlayback,
    } = lab;

    const runtime = lab.runtime;
    const catalogHints = runtime.catalogHints ?? lab.catalogHintsApplied ?? null;

    const settingsClip =
      resolveAnimationLabActionKey(new Set(runtime.clipNames), activeClipName) ??
      runtime.clipNames[0] ??
      null;
    const settings =
      settingsClip != null
        ? (clipSettings[settingsClip] ?? DEFAULT_ANIMATION_LAB_CLIP_SETTINGS)
        : DEFAULT_ANIMATION_LAB_CLIP_SETTINGS;

    const clipDuration =
      settingsClip != null
        ? (runtime.clipDurationByName[settingsClip] ?? runtime.maxClipDurationS)
        : runtime.maxClipDurationS;
    const maxT = Math.max(0.01, clipDuration > 0 ? clipDuration : runtime.maxClipDurationS);
    const timelinePositionS = Math.min(Math.max(0, timelineTimeS), maxT);

    const activeClipKey =
      resolveAnimationLabActionKey(new Set(runtime.clipNames), activeClipName) ?? null;

    const playDisabled =
      runtime.boundActionCount === 0 ||
      (playbackMode === "per-clip" && activeClipKey == null);

    const scrubDisabled = runtime.boundActionCount === 0 || settingsClip == null;

    const listOrder =
      playbackMode === "sequence" && clipOrder.length > 0 ? clipOrder : runtime.clipNames;

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
        for (const name of runtime.clipNames) {
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

    const items: TRNSortableSettingsCardItem[] = [
      {
        id: "playback-mode",
        title: ANIMATION_LAB_SHOWCASE_SECTION_LABELS.playbackMode,
        defaultExpanded: true,
        content: (
          <TRNChipButtonGroup
            ariaLabel={ANIMATION_LAB_SHOWCASE_SECTION_LABELS.playbackMode}
            value={playbackMode}
            columns={1}
            size="sm"
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
        ),
      },
    ];

    if (runtime.boundActionCount > 0 && settingsClip != null) {
      items.push({
        id: "loop",
        title: ANIMATION_LAB_SHOWCASE_SECTION_LABELS.loop,
        defaultExpanded: true,
        content: (
          <TRNChipButtonGroup
            ariaLabel={ANIMATION_LAB_SHOWCASE_SECTION_LABELS.loop}
            value={settings.loopMode}
            columns={1}
            size="sm"
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
        ),
      });
    }

    items.push({
      id: "animations",
      title: ANIMATION_LAB_SHOWCASE_SECTION_LABELS.animations,
      defaultExpanded: true,
      content:
        listOrder.length === 0 ? (
          <TRNHintText tone="muted" className="mb-0 text-[11px]">
            This model has no animations to preview.
          </TRNHintText>
        ) : (
          <div className="flex w-full min-w-0 flex-col gap-1">
            {listOrder.map((name, index) => {
              const clipKey =
                resolveAnimationLabActionKey(new Set(runtime.clipNames), name) ?? name;
              const selected = activeClipKey === clipKey;
              const showReorder = playbackMode === "sequence";
              const display = resolveAnimationLabClipDisplayName(name, catalogHints);
              const durationS = runtime.clipDurationByName[name];
              const playingKey =
                resolveAnimationLabActionKey(
                  new Set(runtime.clipNames),
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
                      <TRNButton
                        type="button"
                        size="compact"
                        disabled={atTop}
                        className="h-5 min-w-0 px-0"
                        hint={`Move ${display} earlier in the tour`}
                        aria-label={`Move ${display} earlier in the tour`}
                        onClick={() => moveClipInOrder(name, "up")}
                      >
                        <ChevronUp className="size-3" aria-hidden />
                      </TRNButton>
                      <TRNButton
                        type="button"
                        size="compact"
                        disabled={atBottom}
                        className="h-5 min-w-0 px-0"
                        hint={`Move ${display} later in the tour`}
                        aria-label={`Move ${display} later in the tour`}
                        onClick={() => moveClipInOrder(name, "down")}
                      >
                        <ChevronDown className="size-3" aria-hidden />
                      </TRNButton>
                    </div>
                  ) : null}
                  <TRNButton
                    type="button"
                    size="compact"
                    disabled={playbackMode === "parallel-all"}
                    selected={selected}
                    hint={<AnimationLabClipRowHintContent {...rowDetail} />}
                    className={twMerge(
                      "h-auto min-h-9 flex-col items-start gap-0.5 py-2 text-left",
                      showReorder ? "min-w-0 flex-1" : "w-full",
                    )}
                    onClick={() => {
                      setActiveClipName(clipKey);
                      setTransport("stopped");
                      setScrubTimeS(0);
                    }}
                  >
                    <span className="block w-full truncate text-[11px] font-medium">{display}</span>
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
        ),
    });

    if (showSmoothClipChange) {
      items.push({
        id: "smooth-change",
        title: "Smooth clip change",
        defaultExpanded: false,
        content: (
          <TRNParameterSlider
            appearance="divider"
            name="Crossfade"
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
        ),
      });
    }

    if (runtime.boundActionCount > 0) {
      items.push({
        id: "transport",
        title: ANIMATION_LAB_SHOWCASE_SECTION_LABELS.transport,
        defaultExpanded: true,
        content: (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1">
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
                className="min-w-0 flex-1 gap-1 px-2"
                onClick={() => {
                  setIsScrubbing(false);
                  setTransport("playing");
                }}
              >
                <Play className="size-3.5 shrink-0" aria-hidden />
                Play
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                className="min-w-0 flex-1 gap-1 px-2"
                disabled={transport === "stopped"}
                hint="Pause playback"
                onClick={() => {
                  setScrubTimeS(timelinePositionS);
                  setTransport("paused");
                }}
              >
                <Pause className="size-3.5 shrink-0" aria-hidden />
                Pause
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                className="min-w-0 flex-1 gap-1 px-2"
                hint="Return to the start of the timeline"
                onClick={() => {
                  setIsScrubbing(false);
                  setScrubTimeS(0);
                  setTransport("stopped");
                }}
              >
                <RotateCcw className="size-3.5 shrink-0" aria-hidden />
                Start
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

            <p className="text-[11px] font-medium text-zinc-300">
              {transport === "playing"
                ? "Now playing"
                : transport === "paused"
                  ? "Paused on"
                  : "Ready"}
              {": "}
              <span className="text-zinc-100">{nowPlayingLabel}</span>
            </p>
          </div>
        ),
      });
    }

    if (settingsClip != null) {
      items.push({
        id: "fine-tune",
        title: "Fine-tune playback",
        defaultExpanded: false,
        content: (
          <div className="flex flex-col gap-1">
            {fineTuneScopeCaption.length > 0 ? (
              <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
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
        ),
      });
    }

    return items;
  }, [lab, timelineTimeS]);

  if (lab == null) {
    return null;
  }

  if (sortableItems.length === 0) {
    return (
      <TRNHintText tone="muted" className="mb-0 text-[11px]">
        No animations available for this model.
      </TRNHintText>
    );
  }

  return (
    <TRNSortableSettingsCardList
      panelId={PLAYBACK_CARDS_PANEL_ID}
      items={sortableItems}
      className="space-y-2"
    />
  );
}
