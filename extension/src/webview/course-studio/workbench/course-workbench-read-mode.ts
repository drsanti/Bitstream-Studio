import type { LayoutNode } from "../../ui/workbench/types";
import type { WorkbenchDockSizeMemory } from "../../ui/workbench/workbench-dock-size-memory";

const AUTHOR_LAYOUT_BACKUP_KEY = "course-studio:author-workbench-layout-backup.v1";

export type AuthorWorkbenchLayoutBackup = {
  layout: LayoutNode;
  dockMemory?: WorkbenchDockSizeMemory;
};

export function isViewOnlyCourseWorkbenchLayout(layout: LayoutNode): boolean {
  return layout.type === "editor" && layout.editorType === "content";
}

function isLayoutNode(value: unknown): value is LayoutNode {
  return (
    value != null &&
    typeof value === "object" &&
    "type" in value &&
    ((value as LayoutNode).type === "editor" ||
      (value as LayoutNode).type === "split" ||
      (value as LayoutNode).type === "tabs")
  );
}

function parseAuthorWorkbenchLayoutBackup(raw: string): AuthorWorkbenchLayoutBackup | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object") {
      return null;
    }
    if ("layout" in parsed && isLayoutNode((parsed as AuthorWorkbenchLayoutBackup).layout)) {
      const row = parsed as AuthorWorkbenchLayoutBackup;
      return {
        layout: row.layout,
        dockMemory: row.dockMemory,
      };
    }
    if (isLayoutNode(parsed)) {
      return { layout: parsed };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAuthorWorkbenchLayoutBackup(
  snapshot: AuthorWorkbenchLayoutBackup | LayoutNode,
): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    const payload: AuthorWorkbenchLayoutBackup = isLayoutNode(snapshot)
      ? { layout: snapshot }
      : snapshot;
    localStorage.setItem(AUTHOR_LAYOUT_BACKUP_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function loadAuthorWorkbenchLayoutBackup(): AuthorWorkbenchLayoutBackup | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(AUTHOR_LAYOUT_BACKUP_KEY);
    if (raw == null || raw.length === 0) {
      return null;
    }
    return parseAuthorWorkbenchLayoutBackup(raw);
  } catch {
    return null;
  }
}
