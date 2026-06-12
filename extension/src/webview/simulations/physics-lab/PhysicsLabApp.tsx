"use no memo";

import { useEffect } from "react";
import { getSimulationMeta } from "../catalog/simulationCatalog.js";
import type { SimulationAppProps } from "../catalog/types.js";
import {
  SimulationCanvas,
  SimulationSidePanel,
} from "../shared/index.js";
import { usePhysicsLabViewportInteraction } from "./hooks/usePhysicsLabViewportInteraction.js";
import { PhysicsLabScene } from "./scene/PhysicsLabScene.js";
import { usePhysicsLabStore } from "./store/physicsLabStore.js";
import { PhysicsLabInspector } from "./ui/PhysicsLabInspector.js";
import { PhysicsLabOutliner } from "./ui/PhysicsLabOutliner.js";
import { PhysicsLabSpawnPalette } from "./ui/PhysicsLabSpawnPalette.js";
import { PhysicsLabToolbar } from "./ui/PhysicsLabToolbar.js";
import { PhysicsLabViewportMarquee } from "./ui/PhysicsLabViewportMarquee.js";

export function PhysicsLabApp({ onBack }: SimulationAppProps) {
  const meta = getSimulationMeta("physics-lab");
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const undo = usePhysicsLabStore((s) => s.undo);
  const redo = usePhysicsLabStore((s) => s.redo);
  const deleteSelectedBodies = usePhysicsLabStore((s) => s.deleteSelectedBodies);
  const setGizmoMode = usePhysicsLabStore((s) => s.setGizmoMode);
  const toggleProjectionMode = usePhysicsLabStore((s) => s.toggleProjectionMode);

  const {
    canvasAreaRef,
    onCanvasPointerDown,
    onRegisterBoxSelectProjector,
    markObjectHit,
    marqueeBox,
  } = usePhysicsLabViewportInteraction();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (event.key === "5") {
        event.preventDefault();
        toggleProjectionMode();
        return;
      }

      if (workbenchMode !== "edit") {
        return;
      }

      if (event.key.toLowerCase() === "g" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setGizmoMode("translate");
        return;
      }
      if (event.key.toLowerCase() === "r" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setGizmoMode("rotate");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedBodies();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelectedBodies, redo, setGizmoMode, toggleProjectionMode, undo, workbenchMode]);

  return (
    <div className="fixed inset-0 z-400 flex min-h-0 flex-col bg-zinc-950">
      <div className="relative min-h-0 flex-1">
        <div
          ref={canvasAreaRef}
          className="absolute inset-0 touch-none"
          onPointerDown={onCanvasPointerDown}
        >
          <SimulationCanvas>
            <PhysicsLabScene
              onRegisterBoxSelectProjector={onRegisterBoxSelectProjector}
              onObjectPointerDown={markObjectHit}
            />
          </SimulationCanvas>
          {marqueeBox != null ? <PhysicsLabViewportMarquee rect={marqueeBox} /> : null}
        </div>
        <PhysicsLabToolbar
          title={meta?.title ?? "Physics Lab"}
          subtitle={meta?.subtitle}
          onBack={onBack}
        />
        <SimulationSidePanel title="Scene" side="left" className="top-[7.5rem]">
          <PhysicsLabSpawnPalette />
          <PhysicsLabOutliner />
        </SimulationSidePanel>
        <SimulationSidePanel title="Inspector" side="right">
          <PhysicsLabInspector />
        </SimulationSidePanel>
      </div>
    </div>
  );
}
