import { Film, Layers, Pause, Play, RotateCcw } from "lucide-react";
import type { AnimationBlendMode } from "../../../../../../../model-catalog/persisted-settings";
import { TRNButton, TRNHintText, TRNIconOptionGroup, TRNInlineToggleRow } from "../../../../../../../ui/TRN";

export type GlbBundleAnimationTransportBarProps = {
  isPlaying: boolean;
  catalogBlendMode: AnimationBlendMode;
  sequenceMode: boolean;
  showReset: boolean;
  onPlayPause: (playing: boolean) => void;
  onReset: () => void;
  onBlendModeChange: (mode: AnimationBlendMode) => void;
  onSequenceToggle: (checked: boolean) => void;
};

/** Sticky transport + playback policy for GLB Animation Bundle inspector. */
export function GlbBundleAnimationTransportBar(props: GlbBundleAnimationTransportBarProps) {
  const {
    isPlaying,
    catalogBlendMode,
    sequenceMode,
    showReset,
    onPlayPause,
    onReset,
    onBlendModeChange,
    onSequenceToggle,
  } = props;

  return (
    <div className="sticky top-0 z-10 shrink-0 space-y-2 border-b border-zinc-800/80 bg-zinc-950/95 pb-2 pt-0.5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <TRNButton
          size="compact"
          onClick={() => onPlayPause(!isPlaying)}
          prefixIcon={
            isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />
          }
        >
          {isPlaying ? "Pause" : "Play"}
        </TRNButton>
        {showReset ? (
          <TRNButton
            size="compact"
            onClick={onReset}
            prefixIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
          >
            Reset all clips
          </TRNButton>
        ) : null}
        <span className="text-[10px] text-zinc-500">
          {isPlaying ? "Transport active" : "Paused — scrub clips or press Play"}
        </span>
      </div>
      <TRNIconOptionGroup
        label="Playback"
        value={sequenceMode ? "blend" : catalogBlendMode}
        layout="row"
        disabled={sequenceMode}
        options={[
          {
            value: "single",
            label: "Single",
            title: "One clip at a time (solo)",
            icon: Film,
          },
          {
            value: "blend",
            label: "Parallel",
            title: "Multiple clips with weights (parallel mix)",
            icon: Layers,
          },
        ]}
        onChange={(v) => onBlendModeChange(v as AnimationBlendMode)}
      />
      <TRNInlineToggleRow
        label="Sequence (one clip at a time)"
        hint="Plays enabled clips in list order; advances when a once loop reaches trim end."
        checked={sequenceMode}
        onCheckedChange={onSequenceToggle}
      />
      {sequenceMode ? (
        <TRNHintText className="text-[10px]">
          Sequence uses the same per-clip controls as Parallel. Mode buttons are disabled while
          sequence is on.
        </TRNHintText>
      ) : null}
    </div>
  );
}
