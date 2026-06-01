import { TRNHintText } from "../../../../../../../ui/TRN";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { useGlbAnimationBundleInspector } from "./use-glb-animation-bundle-inspector";

/** GLB Animation Bundle — wiring + model source (Node inspector tab). */
export function GlbAnimationBundleConnectionSection(props: NodeInspectorSettingsSectionProps) {
  const model = useGlbAnimationBundleInspector(props);

  return (
    <InspectorSettingsSectionFrame title="Connection">
      {model.refStatus.status === "ok" ? (
        <div className="rounded-md border border-emerald-900/35 bg-emerald-950/20 px-2.5 py-2 text-[11px] leading-snug text-emerald-50/95">
          <div className="text-sm font-medium text-emerald-100/95">{model.targetNodeLabel}</div>
          <div className="mt-0.5 text-base font-semibold tracking-tight text-emerald-50">
            {model.connectedEmitName}
          </div>
          <div
            className={
              model.extractionState === "error"
                ? "mt-1 text-[10px] text-red-300/95"
                : "mt-1 text-[10px] text-emerald-200/75"
            }
          >
            {model.targetStatsLine}
          </div>
          <TRNHintText tone="muted" className="mb-0 mt-2 text-[10px]">
            Open the <span className="font-semibold text-zinc-200">Animation</span> inspector tab to
            edit clips, transport, and playback mode.
          </TRNHintText>
        </div>
      ) : model.refStatus.status === "viewer_no_model" ? (
        <TRNHintText tone="warn">
          Animation output reaches a Model Viewer, but that viewer has no Model wired to{" "}
          <span className="font-mono">Model (URL)</span>. Wire your Model node into the viewer first.
        </TRNHintText>
      ) : (
        <TRNHintText tone="info">
          Connect this node&apos;s <span className="font-semibold">Animation</span> output into a{" "}
          <span className="font-semibold">Model Viewer</span>&apos;s{" "}
          <span className="font-semibold">Animation</span> input. When the viewer already receives a
          Model URL, the model name appears here.
        </TRNHintText>
      )}
    </InspectorSettingsSectionFrame>
  );
}
