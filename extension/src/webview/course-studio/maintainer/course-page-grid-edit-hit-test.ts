/** True when the pointer target is page-grid edit chrome (not empty canvas). */
export function isCoursePageGridEditChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest("[data-course-block-id]") != null) {
    return true;
  }
  if (target.closest(".course-page-grid__empty-slot") != null) {
    return true;
  }
  if (target.closest("[data-course-page-grid-resize-frame]") != null) {
    return true;
  }
  return false;
}
