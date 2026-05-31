export type ScreenPoint = {
  clientX: number;
  clientY: number;
};

/** Anchor add-node menu at last graph pointer, else viewport center of the flow wrapper. */
export function resolveAddNodeMenuAnchor(args: {
  wrapper: HTMLElement | null;
  lastPointer: ScreenPoint | null;
}): ScreenPoint {
  const { wrapper, lastPointer } = args;
  if (wrapper != null && lastPointer != null) {
    const rect = wrapper.getBoundingClientRect();
    if (
      lastPointer.clientX >= rect.left &&
      lastPointer.clientX <= rect.right &&
      lastPointer.clientY >= rect.top &&
      lastPointer.clientY <= rect.bottom
    ) {
      return lastPointer;
    }
  }
  if (wrapper != null) {
    const rect = wrapper.getBoundingClientRect();
    return {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };
  }
  return {
    clientX: window.innerWidth / 2,
    clientY: window.innerHeight / 2,
  };
}
