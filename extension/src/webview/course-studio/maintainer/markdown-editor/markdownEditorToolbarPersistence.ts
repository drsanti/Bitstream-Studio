import {
  DEFAULT_MARKDOWN_TOOLBAR_ORDER,
  MARKDOWN_TOOLBAR_ACTION_IDS,
  type MarkdownToolbarActionId,
} from "./markdownEditorActions";

export const MARKDOWN_TOOLBAR_PREFS_STORAGE_KEY = "course-studio.markdown-editor.toolbar.v1";

export type MarkdownToolbarPrefsV1 = {
  order: MarkdownToolbarActionId[];
  hidden: MarkdownToolbarActionId[];
};

export function defaultMarkdownToolbarPrefs(): MarkdownToolbarPrefsV1 {
  return {
    order: [...DEFAULT_MARKDOWN_TOOLBAR_ORDER],
    hidden: [],
  };
}

function isActionId(value: unknown): value is MarkdownToolbarActionId {
  return (
    typeof value === "string" &&
    (MARKDOWN_TOOLBAR_ACTION_IDS as readonly string[]).includes(value)
  );
}

export function normalizeMarkdownToolbarPrefs(raw: unknown): MarkdownToolbarPrefsV1 {
  const defaults = defaultMarkdownToolbarPrefs();
  if (raw == null || typeof raw !== "object") {
    return defaults;
  }
  const record = raw as Partial<MarkdownToolbarPrefsV1>;
  const orderRaw = Array.isArray(record.order) ? record.order.filter(isActionId) : [];
  const hiddenRaw = Array.isArray(record.hidden) ? record.hidden.filter(isActionId) : [];

  const order: MarkdownToolbarActionId[] = [];
  for (const id of orderRaw) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }
  for (const id of MARKDOWN_TOOLBAR_ACTION_IDS) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }

  const hidden = hiddenRaw.filter((id, index, list) => list.indexOf(id) === index);
  return { order, hidden };
}

export function loadMarkdownToolbarPrefs(): MarkdownToolbarPrefsV1 {
  if (typeof localStorage === "undefined") {
    return defaultMarkdownToolbarPrefs();
  }
  try {
    const raw = localStorage.getItem(MARKDOWN_TOOLBAR_PREFS_STORAGE_KEY);
    if (raw == null) {
      return defaultMarkdownToolbarPrefs();
    }
    return normalizeMarkdownToolbarPrefs(JSON.parse(raw));
  } catch {
    return defaultMarkdownToolbarPrefs();
  }
}

export function saveMarkdownToolbarPrefs(prefs: MarkdownToolbarPrefsV1): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(
    MARKDOWN_TOOLBAR_PREFS_STORAGE_KEY,
    JSON.stringify(normalizeMarkdownToolbarPrefs(prefs)),
  );
}

export function visibleMarkdownToolbarActions(prefs: MarkdownToolbarPrefsV1): MarkdownToolbarActionId[] {
  const hidden = new Set(prefs.hidden);
  return prefs.order.filter((id) => !hidden.has(id));
}

export function moveToolbarAction(
  prefs: MarkdownToolbarPrefsV1,
  id: MarkdownToolbarActionId,
  direction: -1 | 1,
): MarkdownToolbarPrefsV1 {
  const order = [...prefs.order];
  const index = order.indexOf(id);
  if (index === -1) {
    return prefs;
  }
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= order.length) {
    return prefs;
  }
  const [item] = order.splice(index, 1);
  order.splice(nextIndex, 0, item);
  return { ...prefs, order };
}

export function setToolbarActionVisible(
  prefs: MarkdownToolbarPrefsV1,
  id: MarkdownToolbarActionId,
  visible: boolean,
): MarkdownToolbarPrefsV1 {
  const hidden = new Set(prefs.hidden);
  if (visible) {
    hidden.delete(id);
  } else {
    hidden.add(id);
  }
  return { ...prefs, hidden: [...hidden] };
}
