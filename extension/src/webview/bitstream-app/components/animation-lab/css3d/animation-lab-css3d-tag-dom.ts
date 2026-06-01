/**
 * CSS3DObject reparents tag elements into the Three.js renderer DOM.
 * Before React unmounts a tag, move its card back under the hidden anchor
 * so commitDeletion does not call removeChild on a relocated node.
 */
export function restoreAnimationLabTwinTagElement(
  anchor: HTMLElement,
  element: HTMLElement,
): void {
  if (element.parentElement === anchor) {
    return;
  }
  try {
    anchor.appendChild(element);
  } catch {
    // Node may already be detached during fast toggles.
  }
}
