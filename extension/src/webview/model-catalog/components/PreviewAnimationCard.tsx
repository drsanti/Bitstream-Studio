import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME,
  TRNMenuItemButton,
  TRNMenuPanel,
} from "../../ui/TRN/TRNMenu.js";
import {
  TRNButton,
  TRNCard,
  TRNChipButtonGroup,
  type TRNChipButtonGroupOption,
  TRNFormField,
  TRNIconOptionGroup,
  TRNInlineToggleRow,
  TRNInteractiveCard,
  TRNParameterSlider,
} from "../../ui/TRN/index.js";
import type {
  AnimationBlendMode,
  AnimationClipLoop,
} from "../persisted-settings";

export interface ClipInfo {
  name: string;
  duration: number;
}

export interface PreviewAnimationCardProps {
  clipNames: string[];
  clipDurations: number[];
  currentClipIndex: number;
  isPlaying: boolean;
  blendMode: AnimationBlendMode;
  clipWeights: number[];
  clipSpeeds: number[];
  clipLoops: AnimationClipLoop[];
  clipScrubTimes: number[];
  crossfadeDuration: number;
  scrubTime: number | null;
  blendCompactView: boolean;
  onClipChange: (index: number) => void;
  onPlayPause: (playing: boolean) => void;
  onBlendModeChange: (mode: AnimationBlendMode) => void;
  onClipWeightChange: (index: number, weight: number) => void;
  onClipSpeedChange: (index: number, speed: number) => void;
  onClipLoopChange: (index: number, loop: AnimationClipLoop) => void;
  onClipScrubChange: (index: number, normalized: number | null) => void;
  onCrossfadeDurationChange: (duration: number) => void;
  onScrubChange: (normalized: number | null) => void;
  onBlendCompactViewChange: (compact: boolean) => void;
  onReset: () => void;
  defaultExpanded?: boolean;
  contentOnly?: boolean;
  /** When true, skip the Single / Blend mode row (host supplies playback mode elsewhere). */
  hideModeSelector?: boolean;
  /** When true, omit bottom Play / Reset rows (host supplies a transport bar). */
  hideTransport?: boolean;
  /** Controlled expanded blend clip cards in compact view (defaults to clip 0 when omitted). */
  expandedClipIndices?: readonly number[];
  onExpandedClipIndicesChange?: (
    next: readonly number[] | ((prev: readonly number[]) => readonly number[]),
  ) => void;
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "?";
  return sec < 1 ? `${(sec * 1000).toFixed(0)}ms` : `${sec.toFixed(2)}s`;
}

const LOOP_CHIP_PRESET_COUNTS = new Set<AnimationClipLoop>([2, 3, 5]);

function buildLoopChipOptions(
  value: AnimationClipLoop,
): TRNChipButtonGroupOption<AnimationClipLoop>[] {
  const base: TRNChipButtonGroupOption<AnimationClipLoop>[] = [
    { value: "loop", label: "Loop", title: "Repeat continuously" },
    { value: "once", label: "Once", title: "Play once per transport run" },
    { value: 2, label: "×2", title: "Play 2 times" },
    { value: 3, label: "×3", title: "Play 3 times" },
    { value: 5, label: "×5", title: "Play 5 times" },
  ];
  if (typeof value === "number" && !LOOP_CHIP_PRESET_COUNTS.has(value)) {
    return [{ value, label: `×${value}`, title: `Play ${value} times` }, ...base];
  }
  return base;
}

function LoopChipButtonGroup({
  value,
  onChange,
}: {
  value: AnimationClipLoop;
  onChange: (next: AnimationClipLoop) => void;
}) {
  const options = useMemo(() => buildLoopChipOptions(value), [value]);
  const columns = Math.min(6, Math.max(3, options.length)) as 3 | 4 | 5 | 6;

  return (
    <TRNChipButtonGroup
      value={value}
      options={options}
      onChange={onChange}
      columns={columns}
      size="sm"
      ariaLabel="Loop"
      className="space-y-1"
    />
  );
}

type ClipDropdownOption = {
  value: number;
  label: string;
};

function ClipDropdown({
  value,
  options,
  onChange,
}: {
  value: number;
  options: ClipDropdownOption[];
  onChange: (next: number) => void;
}) {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const lastTriggerRectRef = React.useRef<DOMRect | null>(null);
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const computeMenuPos = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    lastTriggerRectRef.current = rect ?? null;
    if (!rect) return null;
    return {
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    };
  };

  const effectiveMenuPos = menuPos
    ? menuPos
    : lastTriggerRectRef.current
      ? {
          top: lastTriggerRectRef.current.bottom + 6,
          left: lastTriggerRectRef.current.left,
          width: lastTriggerRectRef.current.width,
        }
      : null;

  const current = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!open) return;

    const updatePos = () => {
      const computed = computeMenuPos();
      if (!computed) return;
      setMenuPos(computed);
    };

    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="w-full flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1 text-sm text-gray-200 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const computed = computeMenuPos();
          if (computed) setMenuPos(computed);
          setOpen(true);
        }}
      >
        <span className="truncate">
          {current?.label ?? `Clip ${value + 1}`}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-300/80 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        effectiveMenuPos &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 outline-none"
            style={{
              top: effectiveMenuPos.top,
              left: effectiveMenuPos.left,
              width: effectiveMenuPos.width,
            }}
          >
            <TRNMenuPanel
              tone="glass-dropdown"
              className="max-h-64 overflow-y-auto scrollbar-hide"
            >
              <div role="listbox" aria-label="Clip" className="flex flex-col gap-1">
                {options.map((opt) => {
                  const selected = opt.value === value;
                  return (
                    <TRNMenuItemButton
                      key={opt.value}
                      tone="glass-dropdown"
                      role="option"
                      aria-selected={selected}
                      label={opt.label}
                      className={twMerge(
                        TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                        "text-sm font-medium",
                        selected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                      )}
                      rightSlot={
                        selected ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                        ) : null
                      }
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    />
                  );
                })}
              </div>
            </TRNMenuPanel>
          </div>,
          document.body,
        )}
    </div>
  );
}

interface BlendClipControlCardProps {
  index: number;
  clipName: string;
  clipDuration: number;
  blendCompactView: boolean;
  expandedClipIndices: readonly number[];
  onToggleClipExpanded: (index: number, collapsed: boolean) => void;
  speed: number;
  weight: number;
  loopValue: AnimationClipLoop;
  clipScrubTime: number;
  onClipSpeedChange: (index: number, speed: number) => void;
  onClipWeightChange: (index: number, weight: number) => void;
  onClipLoopChange: (index: number, loop: AnimationClipLoop) => void;
  onClipScrubChange: (index: number, normalized: number | null) => void;
}

function BlendClipControlCard({
  index,
  clipName,
  clipDuration,
  blendCompactView,
  expandedClipIndices,
  onToggleClipExpanded,
  speed,
  weight,
  loopValue,
  clipScrubTime,
  onClipSpeedChange,
  onClipWeightChange,
  onClipLoopChange,
  onClipScrubChange,
}: BlendClipControlCardProps) {
  const collapsed = blendCompactView && !expandedClipIndices.includes(index);
  const showCompactSummary = blendCompactView && collapsed;

  return (
    <TRNInteractiveCard
      title={`${clipName} (${formatDuration(clipDuration)})`}
      titleTrailingSlot={
        showCompactSummary ? (
          <span className="text-[11px] text-zinc-400">
            {speed.toFixed(1)}x, {Math.round(weight * 100)}%
          </span>
        ) : null
      }
      collapsible={blendCompactView}
      collapsed={blendCompactView ? collapsed : false}
      onCollapsedChange={(nextCollapsed) => {
        if (!blendCompactView) {
          return;
        }
        onToggleClipExpanded(index, nextCollapsed);
      }}
      contentClassName="space-y-2 border-t border-zinc-700/60 pt-2"
    >
      <TRNFormField label="Loop">
        <LoopChipButtonGroup
          value={loopValue}
          onChange={(v) => onClipLoopChange(index, v)}
        />
      </TRNFormField>

      <TRNParameterSlider
        name="Speed"
        value={speed}
        min={-2}
        max={4}
        step={0.1}
        onChange={(v) => onClipSpeedChange(index, v)}
        valueFormatter={(v) => `${v.toFixed(1)}x`}
      />

      <TRNParameterSlider
        name="Weight"
        value={weight}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => onClipWeightChange(index, v)}
        valueFormatter={(v) => `${Math.round(v * 100)}%`}
      />

      <TRNParameterSlider
        name="Playhead"
        value={clipScrubTime}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onClipScrubChange(index, v)}
        valueFormatter={(v) => {
          const d = clipDuration ?? 0;
          return `${((v ?? 0) * d).toFixed(2)}s`;
        }}
      />
    </TRNInteractiveCard>
  );
}

export function PreviewAnimationCard({
  clipNames,
  clipDurations,
  currentClipIndex,
  isPlaying,
  blendMode,
  clipWeights,
  clipSpeeds,
  clipLoops,
  clipScrubTimes,
  crossfadeDuration,
  scrubTime,
  blendCompactView,
  onClipChange,
  onPlayPause,
  onBlendModeChange,
  onClipWeightChange,
  onClipSpeedChange,
  onClipLoopChange,
  onClipScrubChange,
  onCrossfadeDurationChange,
  onScrubChange,
  onBlendCompactViewChange,
  onReset,
  defaultExpanded = true,
  contentOnly = false,
  hideModeSelector = false,
  hideTransport = false,
  expandedClipIndices: expandedClipIndicesProp,
  onExpandedClipIndicesChange,
}: PreviewAnimationCardProps) {
  const [expandedClipIndicesInternal, setExpandedClipIndicesInternal] = useState<number[]>([0]);
  const expandedClipIndices = expandedClipIndicesProp ?? expandedClipIndicesInternal;
  const setExpandedClipIndices =
    onExpandedClipIndicesChange ?? setExpandedClipIndicesInternal;

  const onToggleClipExpanded = useCallback(
    (index: number, collapsed: boolean) => {
      setExpandedClipIndices((prev) => {
        const next = new Set(prev);
        if (collapsed) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return [...next].sort((a, b) => a - b);
      });
    },
    [setExpandedClipIndices],
  );
  const clips: ClipInfo[] = clipNames.map((name, i) => ({
    name: name || `Clip ${i + 1}`,
    duration: clipDurations[i] ?? 0,
  }));

  const currentScrub = scrubTime ?? 0;

  const singleModeContent = (
    <div className="space-y-3">
      <div className="space-y-2">
        <TRNFormField label="Clip">
          <ClipDropdown
            value={currentClipIndex}
            options={clips.map((c, i) => ({
              value: i,
              label: `${c.name} (${formatDuration(c.duration)})`,
            }))}
            onChange={onClipChange}
          />
        </TRNFormField>
      </div>
      <TRNFormField label="Loop">
        <LoopChipButtonGroup
          value={clipLoops[currentClipIndex] ?? "loop"}
          onChange={(v) => onClipLoopChange(currentClipIndex, v)}
        />
      </TRNFormField>
      <TRNParameterSlider
        name="Speed"
        value={clipSpeeds[currentClipIndex] ?? 1}
        min={-2}
        max={4}
        step={0.1}
        onChange={(v) => onClipSpeedChange(currentClipIndex, v)}
        valueFormatter={(v) => `${v.toFixed(1)}x`}
      />
      <TRNParameterSlider
        name="Crossfade duration"
        value={crossfadeDuration}
        min={0.2}
        max={1}
        step={0.1}
        onChange={onCrossfadeDurationChange}
        valueFormatter={(v) => `${v.toFixed(1)}s`}
      />
      <TRNParameterSlider
        name="Timeline"
        value={currentScrub ?? 0}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onScrubChange(v)}
        valueFormatter={(v) => {
          const d = clipDurations[currentClipIndex] ?? 0;
          return `${((v ?? 0) * d).toFixed(2)}s`;
        }}
      />
      {hideTransport ? null : (
        <div className="flex items-center gap-2">
          <TRNButton
            size="compact"
            onClick={() => onPlayPause(!isPlaying)}
            prefixIcon={
              isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )
            }
          >
            {isPlaying ? "Pause" : "Play"}
          </TRNButton>
        </div>
      )}
    </div>
  );

  const blendModeContent = (
    <div className="space-y-3">
      <TRNInlineToggleRow
        label="Compact view"
        checked={blendCompactView}
        onCheckedChange={onBlendCompactViewChange}
      />
      <div className="space-y-2">
        {clips.map((c, i) => (
          <BlendClipControlCard
            key={i}
            index={i}
            clipName={c.name}
            clipDuration={c.duration}
            blendCompactView={blendCompactView}
            expandedClipIndices={expandedClipIndices}
            onToggleClipExpanded={onToggleClipExpanded}
            speed={clipSpeeds[i] ?? 1}
            weight={clipWeights[i] ?? 0}
            loopValue={clipLoops[i]}
            clipScrubTime={clipScrubTimes[i] ?? 0}
            onClipSpeedChange={onClipSpeedChange}
            onClipWeightChange={onClipWeightChange}
            onClipLoopChange={onClipLoopChange}
            onClipScrubChange={onClipScrubChange}
          />
        ))}
      </div>
      {hideTransport ? null : (
        <div className="flex items-center gap-2">
          <TRNButton
            size="compact"
            onClick={() => onPlayPause(!isPlaying)}
            prefixIcon={
              isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )
            }
          >
            {isPlaying ? "Pause" : "Play"}
          </TRNButton>
          <TRNButton
            size="compact"
            onClick={onReset}
            prefixIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </TRNButton>
        </div>
      )}
    </div>
  );

  const content = (
    <div className="space-y-3">
      {clipNames.length > 0 ? (
        <>
          {!hideModeSelector ? (
            <TRNIconOptionGroup
              label="Mode"
              value={blendMode}
              layout="row"
              options={[
                {
                  value: "single",
                  label: "Single",
                  title: "Single clip mode",
                  icon: Play,
                },
                {
                  value: "blend",
                  label: "Blend",
                  title: "Blend multiple clips",
                  icon: Layers,
                },
              ]}
              onChange={(v) => onBlendModeChange(v as AnimationBlendMode)}
            />
          ) : null}
          {blendMode === "single" ? singleModeContent : blendModeContent}
        </>
      ) : (
        <p className="text-sm text-gray-500">No animations in this model.</p>
      )}
    </div>
  );

  if (contentOnly) return content;

  return (
    <TRNCard
      title="Animation"
      icon={<Play className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
      glass
      glassPreset="soft"
    >
      {content}
    </TRNCard>
  );
}
