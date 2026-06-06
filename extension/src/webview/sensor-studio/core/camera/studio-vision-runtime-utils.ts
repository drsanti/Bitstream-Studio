export function applyVisionDetectionEdge(args: {
  prevDetected: boolean;
  nextDetected: boolean;
  triggerOnEnter: boolean;
  triggerOnExit: boolean;
  pendingTriggerEdge: boolean;
}): { wasDetected: boolean; pendingTriggerEdge: boolean } {
  let pendingTriggerEdge = args.pendingTriggerEdge;
  let wasDetected = args.prevDetected;
  if (args.nextDetected !== args.prevDetected) {
    const fireEnter = args.nextDetected && args.triggerOnEnter;
    const fireExit = !args.nextDetected && args.triggerOnExit;
    if (fireEnter || fireExit) {
      pendingTriggerEdge = true;
    }
    wasDetected = args.nextDetected;
  }
  return { wasDetected, pendingTriggerEdge };
}

export function consumeVisionTriggerEdge<T extends { triggerEdge: boolean }>(
  st: { pendingTriggerEdge: boolean; snapshot: T },
): T {
  const triggerEdge = st.pendingTriggerEdge;
  st.pendingTriggerEdge = false;
  return { ...st.snapshot, triggerEdge };
}

export function visionMinInferIntervalMs(targetFps: number): number {
  return 1000 / Math.max(1, targetFps);
}
