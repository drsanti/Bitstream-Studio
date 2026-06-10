const PREFIX = "course-studio:page-inspector.";

const KEYS = {
  cardOrder: `${PREFIX}cardOrder.v1`,
  cardCollapsed: `${PREFIX}cardCollapsed.v1`,
  contextSplitRatio: `${PREFIX}contextSplitRatio.v1`,
} as const;

export const DEFAULT_COURSE_PAGE_INSPECTOR_CONTEXT_SPLIT_RATIO = 0.4;
const MIN_CONTEXT_SPLIT_RATIO = 0.22;
const MIN_PROPERTIES_SPLIT_RATIO = 0.28;

export type CoursePageInspectorCardId =
  | "add-block"
  | "document-identity"
  | "telemetry-link-health"
  | "presentation-pack"
  | "element-checklist";

export const DEFAULT_PAGE_INSPECTOR_CARD_ORDER: readonly CoursePageInspectorCardId[] = [
  "add-block",
  "document-identity",
  "telemetry-link-health",
  "element-checklist",
  "presentation-pack",
];

const CARD_IDS = new Set<string>(DEFAULT_PAGE_INSPECTOR_CARD_ORDER);

function isPageInspectorCardId(value: string): value is CoursePageInspectorCardId {
  return CARD_IDS.has(value);
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function readPageInspectorCardOrder(): CoursePageInspectorCardId[] {
  const raw = safeGet(KEYS.cardOrder);
  if (raw == null || raw.length === 0) {
    return [...DEFAULT_PAGE_INSPECTOR_CARD_ORDER];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_PAGE_INSPECTOR_CARD_ORDER];
    }
    const out: CoursePageInspectorCardId[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && isPageInspectorCardId(item) && !out.includes(item)) {
        out.push(item);
      }
    }
    for (const id of DEFAULT_PAGE_INSPECTOR_CARD_ORDER) {
      if (!out.includes(id)) {
        out.push(id);
      }
    }
    return out;
  } catch {
    return [...DEFAULT_PAGE_INSPECTOR_CARD_ORDER];
  }
}

export function writePageInspectorCardOrder(order: readonly CoursePageInspectorCardId[]): void {
  safeSet(KEYS.cardOrder, JSON.stringify([...order]));
}

export function defaultPageInspectorCardCollapsed(): Record<CoursePageInspectorCardId, boolean> {
  return {
    "add-block": false,
    "document-identity": false,
    "telemetry-link-health": true,
    "presentation-pack": true,
    "element-checklist": true,
  };
}

export function readPageInspectorCardCollapsed(): Record<CoursePageInspectorCardId, boolean> {
  const defaults = defaultPageInspectorCardCollapsed();
  const raw = safeGet(KEYS.cardCollapsed);
  if (raw == null || raw.length === 0) {
    return defaults;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaults;
    }
    const obj = parsed as Record<string, unknown>;
    const out = { ...defaults };
    for (const id of DEFAULT_PAGE_INSPECTOR_CARD_ORDER) {
      if (obj[id] === true) {
        out[id] = true;
      } else if (obj[id] === false) {
        out[id] = false;
      }
    }
    return out;
  } catch {
    return defaults;
  }
}

export function writePageInspectorCardCollapsed(
  next: Record<CoursePageInspectorCardId, boolean>,
): void {
  safeSet(KEYS.cardCollapsed, JSON.stringify(next));
}

export function mergePageInspectorCardOrder(
  stored: readonly CoursePageInspectorCardId[],
  visible: readonly CoursePageInspectorCardId[],
): CoursePageInspectorCardId[] {
  const visibleSet = new Set(visible);
  const ordered = stored.filter((id) => visibleSet.has(id));
  for (const id of visible) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
}

export function clampCoursePageInspectorContextSplitRatio(raw: number): number {
  return Math.max(
    MIN_CONTEXT_SPLIT_RATIO,
    Math.min(1 - MIN_PROPERTIES_SPLIT_RATIO, raw),
  );
}

export function readCoursePageInspectorContextSplitRatio(): number {
  const raw = safeGet(KEYS.contextSplitRatio);
  if (raw == null || raw.length === 0) {
    return DEFAULT_COURSE_PAGE_INSPECTOR_CONTEXT_SPLIT_RATIO;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_COURSE_PAGE_INSPECTOR_CONTEXT_SPLIT_RATIO;
  }
  return clampCoursePageInspectorContextSplitRatio(parsed);
}

export function writeCoursePageInspectorContextSplitRatio(ratio: number): void {
  safeSet(KEYS.contextSplitRatio, String(clampCoursePageInspectorContextSplitRatio(ratio)));
}
