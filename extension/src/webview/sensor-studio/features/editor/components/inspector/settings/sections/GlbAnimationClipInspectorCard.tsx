import { useCallback, useId, useMemo } from "react";
import { Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNInteractiveCard,
  TRNParameterSlider,
  TRNScrubNumberInput,
  TRNSelect,
  type TRNSelectOption,
  TRNToggleSwitch,
} from "../../../../../../../ui/TRN";
import {
  resolveFlowWireClipTrimRange,
  type FlowWireAnimationClipV1,
  type FlowWireAnimationMarkerV1,
  type StudioGlbAnimationLoopModeV1,
} from "../../../../nodes/animation/flow-wire-animation";

const MASK_SELECT_OPTIONS: TRNSelectOption[] = [
  { value: "none", label: "None" },
  { value: "upper-body", label: "Upper body (stub)" },
  { value: "arms", label: "Arms (stub)" },
  { value: "legs", label: "Legs (stub)" },
];

function formatTimeS(t: number): string {
  if (!Number.isFinite(t)) {
    return "0.00s";
  }
  return `${t.toFixed(2)}s`;
}

function approxFrame(timeS: number, fps: number): number {
  return Math.round(timeS * fps);
}

/** Sub-collapsible panel: rely on {@link TRNInteractiveCard} shell only — avoid stacking duplicate `border`/`rounded` utilities. */
const SUB_CARD_SHELL = twMerge(
  "border-zinc-800/75 bg-zinc-950/20 shadow-none",
  "ring-1 ring-zinc-800/40",
);

export type GlbAnimationClipInspectorCardProps = {
  durationS: number;
  clip: FlowWireAnimationClipV1;
  /** Commit with undo (sliders, toggles, structural edits). */
  onCommitClipPatch: (patch: Partial<FlowWireAnimationClipV1>) => void;
  playing: boolean;
  onTogglePlay: () => void;
  soloActive: boolean;
  onToggleSolo: () => void;
  onStepFrame: (deltaSec: number) => void;
  onStopToTrimStart: () => void;
};

export function GlbAnimationClipInspectorCard(props: GlbAnimationClipInspectorCardProps) {
  const {
    durationS,
    clip,
    onCommitClipPatch,
    playing,
    onTogglePlay,
    soloActive,
    onToggleSolo,
    onStepFrame,
    onStopToTrimStart,
  } = props;

  const uid = useId();
  const maskPresetFieldId = `${uid}-mask-preset`;
  const fps = 30;
  const { trimStartS: trimStart, trimEndS: trimEnd } = useMemo(
    () => resolveFlowWireClipTrimRange(clip, durationS),
    [clip, durationS],
  );
  const trimSpan = useMemo(() => Math.max(0.001, trimEnd - trimStart), [trimEnd, trimStart]);
  const loopMode: StudioGlbAnimationLoopModeV1 = clip.loopMode ?? "loop";
  const fadeIn = typeof clip.fadeInMs === "number" && Number.isFinite(clip.fadeInMs) ? clip.fadeInMs : 0;
  const fadeOut = typeof clip.fadeOutMs === "number" && Number.isFinite(clip.fadeOutMs) ? clip.fadeOutMs : 0;
  const weight = typeof clip.weight === "number" && Number.isFinite(clip.weight) ? clip.weight : 1;
  const markers = clip.markers ?? [];
  const maskSelectValue = clip.maskPreset ?? "none";

  const setLoopMode = useCallback(
    (next: StudioGlbAnimationLoopModeV1) => {
      onCommitClipPatch({ loopMode: next });
    },
    [onCommitClipPatch],
  );

  const addMarkerAtPlayhead = useCallback(() => {
    const nextMarkers: FlowWireAnimationMarkerV1[] = [
      ...markers,
      { timeS: clip.timeS, label: `Marker ${markers.length + 1}` },
    ];
    onCommitClipPatch({ markers: nextMarkers });
  }, [clip.timeS, markers, onCommitClipPatch]);

  const updateMarkerLabel = useCallback(
    (idx: number, label: string) => {
      const next = markers.map((m, i) => (i === idx ? { ...m, label } : m));
      onCommitClipPatch({ markers: next });
    },
    [markers, onCommitClipPatch],
  );

  const removeMarker = useCallback(
    (idx: number) => {
      const next = markers.filter((_, i) => i !== idx);
      onCommitClipPatch({ markers: next.length > 0 ? next : undefined });
    },
    [markers, onCommitClipPatch],
  );

  const subCardContentClass = "border-t border-zinc-800/60 px-2 pb-2 pt-1.5 space-y-2";

  return (
    <div className="nodrag flex flex-col gap-2 text-[10px] text-zinc-400">
      <div className="flex flex-wrap items-center justify-end gap-1 border-b border-zinc-800/80 pb-2">
        <TRNButton
          size="compact"
          type="button"
          className="min-w-0! px-1.5"
          selected={soloActive}
          onClick={onToggleSolo}
          title="Solo this clip in the Model Viewer preview"
        >
          Solo
        </TRNButton>
      </div>

      <TRNParameterSlider
        appearance="divider"
        name="Timeline"
        value={Math.min(trimEnd, Math.max(trimStart, clip.timeS))}
        min={trimStart}
        max={trimEnd}
        step={0.01}
        onChange={(v) => onCommitClipPatch({ timeS: v })}
        valueFormatter={(v) => (
          <span className="text-[10px] font-normal tabular-nums text-zinc-400">
            {formatTimeS(v)} / {formatTimeS(trimEnd)} ({formatTimeS(trimSpan)} trim) · ~{approxFrame(v - trimStart, fps)}{" "}
            f @ {fps}
          </span>
        )}
        className="px-0 py-0"
      />

      <div className="flex flex-wrap items-center gap-1">
        <TRNButton
          size="compact"
          type="button"
          className="min-w-0! px-1.5"
          onClick={() => onStepFrame(-1 / fps)}
          title="Step back one frame"
        >
          <SkipBack className="size-3.5" strokeWidth={2} aria-hidden />
        </TRNButton>
        <TRNButton
          size="compact"
          type="button"
          className="min-w-0! px-2"
          selected={playing}
          onClick={onTogglePlay}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-3.5" strokeWidth={2} aria-hidden /> : <Play className="size-3.5" strokeWidth={2} aria-hidden />}
        </TRNButton>
        <TRNButton
          size="compact"
          type="button"
          className="min-w-0! px-1.5"
          onClick={onStopToTrimStart}
          title="Stop playback and jump to trim start"
        >
          <Square className="size-3.5" strokeWidth={2} aria-hidden />
        </TRNButton>
        <TRNButton
          size="compact"
          type="button"
          className="min-w-0! px-1.5"
          onClick={() => onStepFrame(1 / fps)}
          title="Step forward one frame"
        >
          <SkipForward className="size-3.5" strokeWidth={2} aria-hidden />
        </TRNButton>
        <span className="ml-1 shrink-0 text-zinc-500">Speed</span>
        <TRNScrubNumberInput
          value={clip.speed ?? 1}
          min={-4}
          max={4}
          step={0.05}
          fractionDigits={2}
          pointerScrubEnabled={false}
          onChange={(v) => onCommitClipPatch({ speed: v })}
          className="min-w-0 shrink"
          inputClassName="h-6 w-[4.25rem] rounded border border-zinc-700/80 bg-zinc-950/60 px-1 py-0 font-mono text-[10px] text-zinc-200"
          aria-label="Clip playback speed"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Loop</span>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["once", "Once"],
              ["loop", "Loop"],
              ["pingpong", "Ping‑pong"],
            ] as const
          ).map(([id, lab]) => (
            <TRNButton
              key={id}
              size="compact"
              type="button"
              selected={loopMode === id}
              onClick={() => setLoopMode(id)}
            >
              {lab}
            </TRNButton>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TRNFormField label="Trim in (s)" id={`${uid}-trim-in`}>
          <TRNScrubNumberInput
            id={`${uid}-trim-in`}
            value={trimStart}
            min={0}
            max={Math.max(0, trimEnd)}
            step={0.01}
            fractionDigits={2}
            pointerScrubEnabled={false}
            onChange={(v) => onCommitClipPatch({ trimStartS: Math.max(0, v) })}
            inputClassName="h-6 w-full rounded border border-zinc-700/80 bg-zinc-950/60 px-1 font-mono text-[10px] text-zinc-200"
            aria-label="Trim in seconds"
          />
        </TRNFormField>
        <TRNFormField label="Trim out (s)" id={`${uid}-trim-out`}>
          <TRNScrubNumberInput
            id={`${uid}-trim-out`}
            value={trimEnd}
            min={0}
            step={0.01}
            fractionDigits={2}
            pointerScrubEnabled={false}
            onChange={(v) => onCommitClipPatch({ trimEndS: Math.max(0, v) })}
            inputClassName="h-6 w-full rounded border border-zinc-700/80 bg-zinc-950/60 px-1 font-mono text-[10px] text-zinc-200"
            aria-label="Trim out seconds"
          />
        </TRNFormField>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TRNFormField label="Fade in (ms)" id={`${uid}-fade-in`}>
          <TRNScrubNumberInput
            id={`${uid}-fade-in`}
            value={fadeIn}
            min={0}
            step={10}
            fractionDigits={0}
            pointerScrubEnabled={false}
            onChange={(v) => onCommitClipPatch({ fadeInMs: Math.max(0, v) })}
            inputClassName="h-6 w-full rounded border border-zinc-700/80 bg-zinc-950/60 px-1 font-mono text-[10px] text-zinc-200"
            aria-label="Fade in milliseconds"
          />
        </TRNFormField>
        <TRNFormField label="Fade out (ms)" id={`${uid}-fade-out`}>
          <TRNScrubNumberInput
            id={`${uid}-fade-out`}
            value={fadeOut}
            min={0}
            step={10}
            fractionDigits={0}
            pointerScrubEnabled={false}
            onChange={(v) => onCommitClipPatch({ fadeOutMs: Math.max(0, v) })}
            inputClassName="h-6 w-full rounded border border-zinc-700/80 bg-zinc-950/60 px-1 font-mono text-[10px] text-zinc-200"
            aria-label="Fade out milliseconds"
          />
        </TRNFormField>
      </div>

      <TRNInteractiveCard
        title="Advanced preview"
        collapsible
        defaultCollapsed
        className={SUB_CARD_SHELL}
        headerClassName="py-1.5 pl-2 pr-1"
        headerTitleClassName="text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
        contentClassName={subCardContentClass}
      >
        <TRNHintText tone="info" className="text-[10px]">
          Preview uses the connected <span className="font-semibold text-zinc-200">Model Viewer</span> when this bundle
          is wired to its <span className="font-mono text-zinc-200">Animation</span> input. Fade in/out (ms) crossfade
          on the mixer when clips start or stop (including solo).
        </TRNHintText>
        <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-800/60 bg-zinc-950/40 px-2 py-1.5">
          <span className="min-w-0 flex-1 text-[10px] leading-snug text-zinc-400">
            Follow inspector playhead <span className="text-zinc-500">(reserved)</span>
          </span>
          <TRNToggleSwitch
            checked={clip.followInspectorPlayhead === true}
            ariaLabel="Follow inspector playhead"
            onCheckedChange={(next) =>
              onCommitClipPatch({ followInspectorPlayhead: next ? true : undefined })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-800/60 bg-zinc-950/40 px-2 py-1.5">
          <span className="min-w-0 flex-1 text-[10px] leading-snug text-zinc-400">
            Restart time when soloing this clip <span className="text-zinc-500">(reserved)</span>
          </span>
          <TRNToggleSwitch
            checked={clip.restartOnSolo === true}
            ariaLabel="Restart time when soloing this clip"
            onCheckedChange={(next) => onCommitClipPatch({ restartOnSolo: next ? true : undefined })}
          />
        </div>
      </TRNInteractiveCard>

      <TRNInteractiveCard
        title="Clip facts"
        collapsible
        defaultCollapsed
        className={SUB_CARD_SHELL}
        headerClassName="py-1.5 pl-2 pr-1"
        headerTitleClassName="text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
        contentClassName={subCardContentClass}
      >
        <ul className="list-inside list-disc space-y-1 text-[10px] text-zinc-400">
          <li>
            Duration (GLB): <span className="font-mono text-zinc-200">{formatTimeS(durationS)}</span>
          </li>
          <li>
            Markers: <span className="font-mono text-zinc-200">{markers.length}</span>
          </li>
          <li>Root motion / scale keys: not inferred in this build (placeholder).</li>
        </ul>
      </TRNInteractiveCard>

      <TRNInteractiveCard
        title="Layering and masks"
        collapsible
        defaultCollapsed
        className={SUB_CARD_SHELL}
        headerClassName="py-1.5 pl-2 pr-1"
        headerTitleClassName="text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
        contentClassName={subCardContentClass}
      >
        <TRNParameterSlider
          appearance="divider"
          name="Weight"
          value={weight}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onCommitClipPatch({ weight: v })}
          valueFormatter={(v) => <span className="tabular-nums text-zinc-300">{v.toFixed(2)}</span>}
          className="px-0 py-0"
        />
        <TRNFormField label="Mask preset" id={maskPresetFieldId} className="space-y-1.5">
          <TRNSelect
            ariaLabel="Mask preset"
            value={maskSelectValue}
            options={MASK_SELECT_OPTIONS}
            size="sm"
            className="min-w-0"
            buttonClassName="min-h-7 text-[10px]"
            panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
            onValueChange={(next) =>
              onCommitClipPatch({
                maskPreset: next === "none" ? undefined : next,
              })
            }
          />
        </TRNFormField>
        <TRNHintText className="text-[10px]">
          Bone-level masks are not applied in the preview yet; values persist on the bundle for future wiring.
        </TRNHintText>
      </TRNInteractiveCard>

      <TRNInteractiveCard
        title="Markers / events"
        collapsible
        defaultCollapsed
        className={SUB_CARD_SHELL}
        headerClassName="py-1.5 pl-2 pr-1"
        headerTitleClassName="text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
        contentClassName={subCardContentClass}
      >
        <div className="flex flex-wrap gap-1">
          <TRNButton size="compact" type="button" onClick={addMarkerAtPlayhead}>
            Add marker @ playhead
          </TRNButton>
        </div>
        {markers.length === 0 ? (
          <TRNHintText className="text-[10px]">No markers yet.</TRNHintText>
        ) : (
          <ul className="space-y-1.5">
            {markers.map((m, idx) => (
              <li key={`${m.timeS}-${idx}`} className="flex items-center gap-1">
                <span className="w-14 shrink-0 font-mono text-[10px] text-zinc-500">{formatTimeS(m.timeS)}</span>
                <input
                  id={`${uid}-mk-${idx}`}
                  value={m.label}
                  onChange={(e) => updateMarkerLabel(idx, e.target.value)}
                  aria-label={`Marker label at ${formatTimeS(m.timeS)}`}
                  className="nodrag h-6 min-w-0 flex-1 rounded border border-zinc-700/80 bg-zinc-950/60 px-1.5 font-mono text-[10px] text-zinc-200"
                />
                <TRNButton
                  size="compact"
                  type="button"
                  className="min-w-0! shrink-0 self-end px-1"
                  onClick={() => removeMarker(idx)}
                  aria-label={`Remove marker ${idx + 1}`}
                >
                  ×
                </TRNButton>
              </li>
            ))}
          </ul>
        )}
      </TRNInteractiveCard>
    </div>
  );
}
