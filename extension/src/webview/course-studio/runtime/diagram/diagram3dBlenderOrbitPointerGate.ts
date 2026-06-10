/**
 * Course Studio 3D viewport orbit policy:
 * - Alt + LMB drag → rotate
 * - Alt + Shift + LMB drag → pan (OrbitControls: Shift on ROTATE action)
 * - Scroll → zoom (dolly); middle/right mouse blocked
 * - Plain LMB → select / gizmo / drag box select; Shift+drag additive box select
 *
 * Install on the same DOM node as drei OrbitControls (`events.connected` / Canvas eventSource).
 */

export function resolveDiagram3dOrbitDomElement(
  eventsConnected: unknown,
  canvasElement: HTMLCanvasElement,
): HTMLElement {
  if (eventsConnected instanceof HTMLElement) {
    return eventsConnected;
  }
  return canvasElement;
}

export function syncDiagram3dOrbitControlsForPointer(
  controls: { enableRotate: boolean; enablePan: boolean; enabled: boolean },
  event: Pick<PointerEvent, "altKey" | "shiftKey" | "pointerType">,
): void {
  if (event.pointerType === "touch") {
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enabled = true;
    return;
  }
  if (event.altKey && event.shiftKey) {
    controls.enabled = true;
    controls.enableRotate = false;
    controls.enablePan = true;
    return;
  }
  if (event.altKey) {
    controls.enabled = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    return;
  }
  // Keep `enabled` true — drei OrbitControls skips `update()` when false, which freezes
  // camera aim and leaves the scene black even though meshes/lights are mounted.
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enabled = true;
}

/** Block RMB/MMB only — plain LMB must reach R3F for object pick / box select. */
export function shouldGateOrbitControlsPointerDown(event: PointerEvent): boolean {
  if (event.pointerType === "touch") {
    return false;
  }
  if (event.button === 1 || event.button === 2) {
    return true;
  }
  return false;
}

export function installDiagram3dBlenderOrbitPointerGate(domElement: HTMLElement): () => void {
  const onPointerDownCapture = (event: PointerEvent) => {
    if (shouldGateOrbitControlsPointerDown(event)) {
      event.stopImmediatePropagation();
    }
  };
  domElement.addEventListener("pointerdown", onPointerDownCapture, true);
  return () => {
    domElement.removeEventListener("pointerdown", onPointerDownCapture, true);
  };
}

export function installDiagram3dBlenderOrbitModifierPolicy(
  domElement: HTMLElement,
  getControls: () => { enableRotate: boolean; enablePan: boolean; enabled: boolean } | null,
): () => void {
  const onPointerDownCapture = (event: PointerEvent) => {
    const controls = getControls();
    if (controls == null) {
      return;
    }
    syncDiagram3dOrbitControlsForPointer(controls, event);
  };
  const onPointerUp = () => {
    const controls = getControls();
    if (controls == null) {
      return;
    }
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enabled = true;
  };
  domElement.addEventListener("pointerdown", onPointerDownCapture, true);
  domElement.ownerDocument.addEventListener("pointerup", onPointerUp);
  return () => {
    domElement.removeEventListener("pointerdown", onPointerDownCapture, true);
    domElement.ownerDocument.removeEventListener("pointerup", onPointerUp);
  };
}
