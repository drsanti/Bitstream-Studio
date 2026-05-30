import { useCallback, useRef, type MutableRefObject, type RefObject } from "react";
import type { UseProject4TelemetryResult } from "../../hooks/useProject4Telemetry";
import { Project4TwinViewport } from "../twin/Project4TwinViewport";
import { Project4HudRoot } from "./Project4HudRoot";

export type Project4ViewportShellProps = {
  telemetryRef: RefObject<UseProject4TelemetryResult>;
  telemetry: UseProject4TelemetryResult;
  driveKeyboardEnabled: boolean;
  /** When set, receives the viewport bounds element (for `TRNWindow` `boundsRef` etc.). */
  viewportBoundsRef?: RefObject<HTMLDivElement | null>;
};

/**
 * Full-viewport stack: R3F canvas + pointer-events-safe draggable HUD (PROJECT_INFO § Overlay UI & HUD).
 */
export function Project4ViewportShell(props: Project4ViewportShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const assignContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      const external = props.viewportBoundsRef;
      if (external != null) {
        (external as MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [props.viewportBoundsRef],
  );

  return (
    <div
      ref={assignContainerRef}
      className="relative isolate h-full w-full min-h-0 overflow-hidden bg-zinc-950"
    >
      <div className="absolute inset-0 min-h-0">
        <Project4TwinViewport telemetryRef={props.telemetryRef} />
      </div>
      <Project4HudRoot
        containerRef={containerRef}
        telemetry={props.telemetry}
        driveKeyboardEnabled={props.driveKeyboardEnabled}
      />
    </div>
  );
}
