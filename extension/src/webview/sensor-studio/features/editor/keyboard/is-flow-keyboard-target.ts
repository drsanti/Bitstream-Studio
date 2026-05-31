/** Skip graph shortcuts when the user is typing in a form control (node-animator parity). */
export function isFlowKeyboardTarget(target: EventTarget | null): boolean {
  if (target == null || typeof HTMLElement === "undefined") {
    return false;
  }
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  return target.isContentEditable;
}
