import { FlowCanvasBackground } from "@ternion/t3d/ui";
import { WebviewLauncherNebulaLayer } from "./WebviewLauncherNebulaLayer";

export type WebviewFlowShellBackgroundProps = {
  /** Host element class for flow-bubble pointer repulsion (e.g. `webview-launcher`). */
  interactionRootClass: string;
};

/**
 * Shared animated shell: deep-space nebula + flow canvas bubbles + vignette.
 */
export function WebviewFlowShellBackground({
  interactionRootClass,
}: WebviewFlowShellBackgroundProps) {
  return (
    <div
      className="t3d-flow-canvas-bg pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="t3d-flow-canvas-bg__base absolute inset-0" />
      <WebviewLauncherNebulaLayer />
      <FlowCanvasBackground
        interactionRootClass={interactionRootClass}
        className="t3d-flow-canvas-bg__canvas pointer-events-none absolute inset-0 z-2 h-full w-full"
      />
      <div className="t3d-flow-canvas-bg__vignette absolute inset-0" />
    </div>
  );
}
