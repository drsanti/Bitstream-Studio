import { TRNHintText } from "../../../../../ui/TRN";
import type { NodeInspectorSettingsSectionProps } from "./settings/node-inspector-settings-types";
import { GlbBundleAnimationControlPanel } from "./settings/sections/GlbBundleAnimationControlPanel";
import { useGlbAnimationBundleInspector } from "./settings/sections/use-glb-animation-bundle-inspector";

/** GLB Animation Bundle — full animation editor (Animation inspector tab). */
export function GlbAnimationBundleAnimationInspectorTab(props: NodeInspectorSettingsSectionProps) {
  const model = useGlbAnimationBundleInspector(props);

  if (model.refStatus.status !== "ok") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <TRNHintText tone="info">
          Wire this bundle to a <span className="font-semibold">Model Viewer</span> with a linked{" "}
          <span className="font-semibold">Model</span> node, then return here to edit clips.
        </TRNHintText>
      </div>
    );
  }

  if (!model.showClipCards) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="shrink-0 rounded-md border border-zinc-700/70 bg-zinc-900/50 px-2.5 py-2 text-[11px] text-zinc-300">
          <div className="font-medium text-zinc-100">{model.connectedEmitName}</div>
          <div className="mt-0.5 text-[10px] text-zinc-500">{model.targetStatsLine}</div>
        </div>
        <TRNHintText className="text-[10px]" tone="info">
          This GLB has no animation clips to list.
        </TRNHintText>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 rounded-md border border-zinc-700/70 bg-zinc-900/50 px-2.5 py-1.5 text-[10px] text-zinc-400">
        <span className="font-medium text-zinc-200">{model.connectedEmitName}</span>
        <span className="text-zinc-600"> · </span>
        {model.targetStatsLine}
      </div>
      <div className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <GlbBundleAnimationControlPanel
          clipIdsOrdered={model.clipIdsOrdered}
          clipMap={model.clipMap}
          defaultConfig={model.defaultConfig}
          durationByRef={model.durationByRef}
          labelByRef={model.labelByRef}
          playbackMode={model.playbackMode}
          soloClipRef={model.soloClipRef}
          playingRefs={model.playingRefs}
          blendPlaying={model.blendPlaying}
          onBlendPlayingChange={model.setBlendPlaying}
          onPauseInspectorTransport={model.pauseInspectorTransport}
          onUpdateConfigField={props.onUpdateConfigField}
          onCommitClipPatch={model.commitClipPatch}
          onLiveClipPatch={model.liveClipPatch}
          onSetPlayingRefs={model.setPlayingRefs}
          expandedClipIndices={model.expandedClipIndices}
          onExpandedClipIndicesChange={model.setExpandedClipIndices}
        />
      </div>
    </div>
  );
}

