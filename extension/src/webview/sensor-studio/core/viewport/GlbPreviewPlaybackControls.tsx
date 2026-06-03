import { Pause, Play, Square } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN";
import type { GlbPreviewUserTransport } from "../../features/editor/gltf/glb-preview-user-transport";

const CONTROL_PILL_CLASS =
  "nodrag nowheel pointer-events-auto flex items-center gap-0.5 rounded-full border border-zinc-700/70 bg-zinc-950/80 p-0.5 shadow-md shadow-black/40 ring-1 ring-white/5 backdrop-blur-sm";

const ICON_BTN_CLASS =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-zinc-400 shadow-none transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 active:scale-95 disabled:pointer-events-none disabled:opacity-40";

export function GlbPreviewPlaybackControls(props: {
  transport: GlbPreviewUserTransport;
  flowOwnsPlayback: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}) {
  const { transport, flowOwnsPlayback, onPlay, onPause, onStop } = props;
  const flowHint =
    "Animation is driven by the flow graph or inspector. Disconnect animation wires to use manual preview transport.";

  return (
    <div
      className={CONTROL_PILL_CLASS}
      role="group"
      aria-label="GLB animation preview transport"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <TRNButton
        type="button"
        size="compact"
        className={twMerge(ICON_BTN_CLASS, transport === "playing" && "text-emerald-300")}
        disabled={flowOwnsPlayback}
        hint={flowOwnsPlayback ? flowHint : "Play all GLB animation clips in this preview"}
        aria-label="Play GLB animations"
        onClick={onPlay}
      >
        <Play size={14} aria-hidden />
      </TRNButton>
      <TRNButton
        type="button"
        size="compact"
        className={twMerge(ICON_BTN_CLASS, transport === "paused" && "text-amber-300/90")}
        disabled={flowOwnsPlayback}
        hint={flowOwnsPlayback ? flowHint : "Pause GLB animation preview"}
        aria-label="Pause GLB animations"
        onClick={onPause}
      >
        <Pause size={14} aria-hidden />
      </TRNButton>
      <TRNButton
        type="button"
        size="compact"
        className={ICON_BTN_CLASS}
        disabled={flowOwnsPlayback}
        hint={flowOwnsPlayback ? flowHint : "Stop and reset GLB animation preview to the start"}
        aria-label="Stop GLB animations"
        onClick={onStop}
      >
        <Square size={12} aria-hidden />
      </TRNButton>
    </div>
  );
}
