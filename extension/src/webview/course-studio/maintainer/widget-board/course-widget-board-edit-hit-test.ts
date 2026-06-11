/** True when the pointer target is widget-board edit chrome (not empty canvas). */
export function isCourseWidgetBoardEditChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest("[data-course-widget-editor-id]") != null) {
    return true;
  }
  if (target.closest("[data-course-widget-board-add-btn]") != null) {
    return true;
  }
  if (target.closest("[data-course-widget-board-resize-frame]") != null) {
    return true;
  }
  return false;
}
