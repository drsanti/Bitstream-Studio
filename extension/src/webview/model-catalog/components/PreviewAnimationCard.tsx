import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  GripVertical,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME,
  TRNMenuItemButton,
  TRNMenuPanel,
} from "../../ui/TRN/TRNMenu.js";
import {
  CollapsibleCard,
  Button,
  LabeledSlider,
  LabeledSwitch,
} from "@ternion/t3d/ui";
import type {
  AnimationBlendMode,
  AnimationClipLoop,
} from "../persisted-settings";
import { OptionButtonGroup } from "../../ui/components/OptionButtonGroup";

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
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "?";
  return sec < 1 ? `${(sec * 1000).toFixed(0)}ms` : `${sec.toFixed(2)}s`;
}

function formatLoopLabel(loop: AnimationClipLoop): string {
  if (loop === "once") return "Once";
  if (loop === "loop") return "Loop";
  return `${loop} times`;
}

type LoopDropdownOption = {
  value: AnimationClipLoop;
  label: string;
};

type ClipDropdownOption = {
  value: number;
  label: string;
};

function LoopDropdown({
  value,
  onChange,
}: {
  value: AnimationClipLoop;
  onChange: (next: AnimationClipLoop) => void;
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

  const options = React.useMemo<LoopDropdownOption[]>(() => {
    const base: LoopDropdownOption[] = [
      { value: "loop", label: "Loop" },
      { value: "once", label: "Once" },
      { value: 2, label: "2 times" },
      { value: 3, label: "3 times" },
      { value: 5, label: "5 times" },
    ];

    if (typeof value === "number") {
      const presets = new Set([2, 3, 5]);
      if (!presets.has(value)) {
        return [{ value, label: `${value} times` }, ...base];
      }
    }

    return base;
  }, [value]);

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
          // Compute position synchronously so the menu can render on the first open render.
          const computed = computeMenuPos();
          if (computed) setMenuPos(computed);
          setOpen(true);
        }}
      >
        <span className="truncate">{formatLoopLabel(value)}</span>
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
              <div role="listbox" aria-label="Loop" className="flex flex-col gap-1">
                {options.map((opt) => {
                  const selected = opt.value === value;
                  return (
                    <TRNMenuItemButton
                      key={String(opt.value)}
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

interface DraggableClipControlCardProps {
  i: number;
  clipName: string;
  clipDuration: number;
  blendCompactView: boolean;
  expanded: boolean;
  showCompactSummary: boolean;
  speed: number;
  weight: number;
  loopValue: AnimationClipLoop;
  clipScrubTime: number;
  expandedClipIndex: number | null;
  setExpandedClipIndex: React.Dispatch<React.SetStateAction<number | null>>;
  onClipSpeedChange: (index: number, speed: number) => void;
  onClipWeightChange: (index: number, weight: number) => void;
  onClipLoopChange: (index: number, loop: AnimationClipLoop) => void;
  onClipScrubChange: (index: number, normalized: number | null) => void;
  children: React.ReactNode;
}

function DraggableClipControlCard({
  i,
  clipName,
  clipDuration,
  blendCompactView,
  expanded,
  showCompactSummary,
  speed,
  weight,
  loopValue,
  clipScrubTime,
  expandedClipIndex,
  setExpandedClipIndex,
  onClipSpeedChange,
  onClipWeightChange,
  onClipLoopChange,
  onClipScrubChange,
}: DraggableClipControlCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = React.useRef({
    active: false,
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const onDragPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: position.x,
      startY: position.y,
      moved: false,
    };
  };

  const onDragPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startClientX;
    const dy = e.clientY - dragRef.current.startClientY;

    if (!dragRef.current.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      dragRef.current.moved = true;
    }

    setPosition({
      x: dragRef.current.startX + dx,
      y: dragRef.current.startY + dy,
    });
  };

  const onDragPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="rounded-lg border border-white/10 bg-white/2 overflow-hidden"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-1 text-left text-sm hover:bg-white/10"
        onClick={() => {
          if (dragRef.current.moved) {
            // If user dragged, don't toggle accordion.
            dragRef.current.moved = false;
            return;
          }
          setExpandedClipIndex(
            blendCompactView ? (expandedClipIndex === i ? null : i) : i,
          );
        }}
      >
        {blendCompactView ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-200" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-200" />
          )
        ) : null}

        <div
          role="button"
          aria-label="Drag clip card"
          title="Drag"
          className="cursor-move select-none inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onClick={(e) => {
            // Prevent accidental accordion toggle when clicking the handle.
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <GripVertical className="h-3.5 w-3.5 text-gray-300" />
        </div>

        <span className="flex-1 truncate">
          {clipName} ({formatDuration(clipDuration)})
        </span>

        {showCompactSummary && !expanded && (
          <span className="text-xs text-gray-200">
            {speed.toFixed(1)}x, {Math.round((weight ?? 0) * 100)}%
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-2 p-3 pt-2 border-t border-white/10">
          {/** Loop */}
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400">Loop</label>
            <LoopDropdown
              value={loopValue}
              onChange={(v) => onClipLoopChange(i, v)}
            />
          </div>

          {/** Speed */}
          <LabeledSlider
            label="Speed"
            value={speed}
            min={-2}
            max={4}
            step={0.1}
            onChange={(v) => onClipSpeedChange(i, v)}
            formatValue={(v) => `${v.toFixed(1)}x`}
          />

          {/** Weight */}
          <LabeledSlider
            label="Weight"
            value={weight}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => onClipWeightChange(i, v)}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />

          <LabeledSlider
            label="Playhead"
            value={clipScrubTime}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onClipScrubChange(i, v)}
            formatValue={(v) => {
              const d = clipDuration ?? 0;
              return `${((v ?? 0) * d).toFixed(2)}s`;
            }}
          />
        </div>
      )}
    </div>
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
}: PreviewAnimationCardProps) {
  const [expandedClipIndex, setExpandedClipIndex] = useState<number | null>(0);
  const actionButtonClass =
    'gap-2 border border-emerald-300/25 bg-emerald-500/6! text-emerald-50 hover:bg-emerald-500/12!';
  const clips: ClipInfo[] = clipNames.map((name, i) => ({
    name: name || `Clip ${i + 1}`,
    duration: clipDurations[i] ?? 0,
  }));

  const currentScrub = scrubTime ?? 0;

  const singleModeContent = (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Clip</label>
        <ClipDropdown
          value={currentClipIndex}
          options={clips.map((c, i) => ({
            value: i,
            label: `${c.name} (${formatDuration(c.duration)})`,
          }))}
          onChange={onClipChange}
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs text-gray-400">Loop</label>
        <LoopDropdown
          value={clipLoops[currentClipIndex]}
          onChange={(v) => onClipLoopChange(currentClipIndex, v)}
        />
      </div>
      <LabeledSlider
        label="Speed"
        value={clipSpeeds[currentClipIndex] ?? 1}
        min={-2}
        max={4}
        step={0.1}
        onChange={(v) => onClipSpeedChange(currentClipIndex, v)}
        formatValue={(v) => `${v.toFixed(1)}x`}
      />
      <LabeledSlider
        label="Crossfade duration"
        value={crossfadeDuration}
        min={0.2}
        max={1}
        step={0.1}
        onChange={onCrossfadeDurationChange}
        formatValue={(v) => `${v.toFixed(1)}s`}
      />
      <LabeledSlider
        label="Timeline"
        value={currentScrub ?? 0}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onScrubChange(v)}
        formatValue={(v) => {
          const d = clipDurations[currentClipIndex] ?? 0;
          return `${((v ?? 0) * d).toFixed(2)}s`;
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPlayPause(!isPlaying)}
          className={actionButtonClass}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const blendModeContent = (
    <div className="space-y-3">
      <div className="space-y-3 rounded-lg border border-white/10 bg-white/2 p-3">
        <LabeledSwitch
          label="Compact View"
          checked={blendCompactView}
          onChange={onBlendCompactViewChange}
        />
      </div>
      <div className="space-y-2">
        {clips.map((c, i) => {
          const isExpanded = !blendCompactView || expandedClipIndex === i;
          const weight = clipWeights[i] ?? 0;
          const speed = clipSpeeds[i] ?? 1;
          return (
            <DraggableClipControlCard
              key={i}
              i={i}
              clipName={c.name}
              clipDuration={c.duration}
              blendCompactView={blendCompactView}
              expanded={isExpanded}
              expandedClipIndex={expandedClipIndex}
              setExpandedClipIndex={setExpandedClipIndex}
              showCompactSummary={blendCompactView && !isExpanded}
              speed={speed}
              weight={weight}
              loopValue={clipLoops[i]}
              clipScrubTime={clipScrubTimes[i] ?? 0}
              onClipSpeedChange={onClipSpeedChange}
              onClipWeightChange={onClipWeightChange}
              onClipLoopChange={onClipLoopChange}
              onClipScrubChange={onClipScrubChange}
            >
              {/** children intentionally unused; all UI is in this component **/}
              null
            </DraggableClipControlCard>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPlayPause(!isPlaying)}
          className={actionButtonClass}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className={actionButtonClass}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );

  const content = (
    <div className="space-y-3">
      {clipNames.length > 0 ? (
        <>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Mode</label>
            <OptionButtonGroup
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
          </div>
          {blendMode === "single" ? singleModeContent : blendModeContent}
        </>
      ) : (
        <p className="text-sm text-gray-500">No animations in this model.</p>
      )}
    </div>
  );

  if (contentOnly) return content;

  return (
    <CollapsibleCard
      title="Animation"
      icon={Play}
      defaultExpanded={defaultExpanded}
    >
      {content}
    </CollapsibleCard>
  );
}
