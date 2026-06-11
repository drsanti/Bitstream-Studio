/** True when the pointer target is dashboard edit chrome (widget, group, add slot, toolbar). */
export function isDashboardEditChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest(".nodrag") != null) {
    return true;
  }
  if (target.closest("[data-dashboard-widget-id]") != null) {
    return true;
  }
  if (target.closest("[data-dashboard-group-id]") != null) {
    return true;
  }
  if (target.closest(".dashboard-grid-empty-slot") != null) {
    return true;
  }
  if (target.closest("[data-dashboard-resize-frame]") != null) {
    return true;
  }
  return false;
}
