export type DashboardWidgetSelectionModifiers = {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
};

export function dashboardSelectionIsAdditive(
  modifiers: DashboardWidgetSelectionModifiers,
): boolean {
  return modifiers.shiftKey || modifiers.ctrlKey || modifiers.metaKey;
}

/** Primary (anchor) widget — last in selection order. */
export function dashboardPrimaryHighlightedWidgetId(
  ids: readonly string[],
): string | null {
  return ids.length > 0 ? ids[ids.length - 1]! : null;
}

export function dashboardWidgetSelectionAfterClick(
  current: readonly string[],
  clickedId: string,
  modifiers: DashboardWidgetSelectionModifiers,
): string[] {
  if (!dashboardSelectionIsAdditive(modifiers)) {
    return [clickedId];
  }
  if (modifiers.ctrlKey || modifiers.metaKey) {
    if (current.includes(clickedId)) {
      return current.filter((id) => id !== clickedId);
    }
    return [...current, clickedId];
  }
  if (current.includes(clickedId)) {
    return [...current];
  }
  return [...current, clickedId];
}

export function dashboardWidgetSelectionAfterMarquee(
  current: readonly string[],
  marqueeIds: readonly string[],
  modifiers: DashboardWidgetSelectionModifiers,
): string[] {
  if (marqueeIds.length === 0) {
    return dashboardSelectionIsAdditive(modifiers) ? [...current] : [];
  }
  if (!dashboardSelectionIsAdditive(modifiers)) {
    return [...marqueeIds];
  }
  const merged = new Set(current);
  for (const id of marqueeIds) {
    merged.add(id);
  }
  return [...merged];
}

export function rectsIntersect(
  a: Pick<DOMRect, "left" | "top" | "right" | "bottom">,
  b: Pick<DOMRect, "left" | "top" | "right" | "bottom">,
): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function clientRectFromPoints(
  startClientX: number,
  startClientY: number,
  clientX: number,
  clientY: number,
): { left: number; top: number; right: number; bottom: number } {
  const left = Math.min(startClientX, clientX);
  const top = Math.min(startClientY, clientY);
  const right = Math.max(startClientX, clientX);
  const bottom = Math.max(startClientY, clientY);
  return { left, top, right, bottom };
}

export function collectGridMarqueeSelectionIds(args: {
  root: HTMLElement;
  marqueeRect: Pick<DOMRect, "left" | "top" | "right" | "bottom">;
  validIds: ReadonlySet<string>;
  selector: string;
  readId: (element: HTMLElement) => string | null;
}): string[] {
  const { root, marqueeRect, validIds, selector, readId } = args;
  const selected = new Set<string>();
  for (const element of root.querySelectorAll<HTMLElement>(selector)) {
    const id = readId(element);
    if (id == null || !validIds.has(id)) {
      continue;
    }
    if (rectsIntersect(element.getBoundingClientRect(), marqueeRect)) {
      selected.add(id);
    }
  }
  return [...selected];
}

/** Collect widget / group ids whose bounds intersect the marquee (client coords). */
export function collectDashboardMarqueeSelectionIds(args: {
  root: HTMLElement;
  marqueeRect: Pick<DOMRect, "left" | "top" | "right" | "bottom">;
  validIds: ReadonlySet<string>;
}): string[] {
  const { root, marqueeRect, validIds } = args;
  const widgetIds = collectGridMarqueeSelectionIds({
    root,
    marqueeRect,
    validIds,
    selector: "[data-dashboard-widget-id]",
    readId: (element) => element.dataset.dashboardWidgetId ?? null,
  });
  const selected = new Set(widgetIds);

  for (const element of root.querySelectorAll<HTMLElement>("[data-dashboard-group-id]")) {
    const id = element.dataset.dashboardGroupId;
    if (id == null || !validIds.has(id)) {
      continue;
    }
    if (!rectsIntersect(element.getBoundingClientRect(), marqueeRect)) {
      continue;
    }
    const childWidgetIds = [
      ...element.querySelectorAll<HTMLElement>("[data-dashboard-widget-id]"),
    ]
      .map((child) => child.dataset.dashboardWidgetId)
      .filter((childId): childId is string => childId != null && selected.has(childId));
    if (childWidgetIds.length > 0) {
      continue;
    }
    selected.add(id);
  }

  return [...selected];
}
