import { TRNHintText } from "@/ui/TRN";
import { GlbPreviewPlaybackControls } from "../../../../sensor-studio/core/viewport/GlbPreviewPlaybackControls";
import { rotationPreviewGlbDisplayPath } from "./rotation-preview-glb-display-path";
import { useRotationPreviewGlbAnimation } from "./rotation-preview-glb-animation-context";

const HUD_STACK_CLASS =
  "pointer-events-auto absolute bottom-2 left-2 z-10 flex max-w-[min(calc(100%-1rem),360px)] flex-col items-start gap-1";

const INFO_PANEL_CLASS =
  "nodrag nowheel w-full min-w-0 rounded-md border border-zinc-700/70 bg-zinc-950/85 px-2 py-1.5 font-mono text-[10px] leading-snug text-zinc-300 shadow-md shadow-black/40 ring-1 ring-white/5 backdrop-blur-sm";

export function RotationPreviewGlbPlaybackHud() {
  const ctx = useRotationPreviewGlbAnimation();
  if (ctx == null) {
    return null;
  }

  const { runtime, transport, flowOwnsPlayback } = ctx;
  const shortPath = rotationPreviewGlbDisplayPath(ctx.fetchUrl);
  const clipList =
    runtime.clipNames.length > 0
      ? runtime.clipNames.join(", ")
      : runtime.gltfClipCount > 0
        ? "(unnamed clips)"
        : "none";

  return (
    <div
      className={HUD_STACK_CLASS}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className={INFO_PANEL_CLASS} role="status" aria-live="polite">
        <div className="font-sans text-[11px] font-medium text-zinc-100">
          {ctx.modelLabel}
        </div>
        {ctx.dedupeKey.length > 0 ? (
          <div className="truncate text-zinc-500" title={ctx.dedupeKey}>
            {ctx.dedupeKey}
          </div>
        ) : null}
        <div className="truncate text-cyan-200/90" title={ctx.fetchUrl}>
          {shortPath}
        </div>
        <div className="mt-1 text-zinc-400">
          GLTF clips: {runtime.gltfClipCount} · mixer actions: {runtime.boundActionCount}
        </div>
        <div className="truncate text-zinc-500" title={clipList}>
          {clipList}
        </div>
        <div className="mt-0.5 text-zinc-500">
          Transport: <span className="text-zinc-200">{transport}</span>
          {flowOwnsPlayback ? " · flow drives animation" : null}
        </div>
        {runtime.gltfClipCount > 0 && runtime.boundActionCount === 0 ? (
          <TRNHintText tone="warn" className="mb-0 mt-1 text-[10px]">
            Clips parsed but no actions bound — check GLB skinning / loader.
          </TRNHintText>
        ) : null}
        {runtime.gltfClipCount === 0 ? (
          <TRNHintText tone="muted" className="mb-0 mt-1 text-[10px]">
            This GLB has no animation clips; transport only applies to rigged GLBs.
          </TRNHintText>
        ) : null}
      </div>
      {runtime.boundActionCount > 0 ? (
        <GlbPreviewPlaybackControls
          transport={transport}
          flowOwnsPlayback={flowOwnsPlayback}
          onPlay={() => ctx.setTransport("playing")}
          onPause={() => ctx.setTransport("paused")}
          onStop={() => ctx.setTransport("stopped")}
        />
      ) : null}
    </div>
  );
}
