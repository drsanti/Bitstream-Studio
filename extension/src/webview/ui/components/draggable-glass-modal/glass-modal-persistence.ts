import { clampPosition, sanitize } from "./glass-modal-geometry";
import type { Point2D } from "./types";

const STORAGE_PREFIX = "ternion:glass-modal:" as const;
const SCHEMA_VERSION = 1 as const;

export type PersistedGlassModalLayout = {
  v: typeof SCHEMA_VERSION;
  x: number;
  y: number;
  width: number;
  height: number;
};

function storageKey(panelId: string): string {
  return `${STORAGE_PREFIX}${panelId}`;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Load saved position/size for a panel, clamped to current viewport and min/max bounds.
 */
export function loadPersistedGlassModalLayout(
  panelId: string | undefined,
  defaults: { position: Point2D; width: number; height: number },
  constraints: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  },
): { position: Point2D; width: number; height: number } {
  if (
    !panelId ||
    typeof window === "undefined" ||
    typeof localStorage === "undefined"
  ) {
    return { ...defaults };
  }

  try {
    const raw = localStorage.getItem(storageKey(panelId));
    if (!raw) {
      return { ...defaults };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedGlassModalLayout>;
    if (parsed.v !== SCHEMA_VERSION) {
      return { ...defaults };
    }
    if (
      !isFiniteNumber(parsed.x) ||
      !isFiniteNumber(parsed.y) ||
      !isFiniteNumber(parsed.width) ||
      !isFiniteNumber(parsed.height)
    ) {
      return { ...defaults };
    }

    const width = Math.min(
      constraints.maxWidth,
      Math.max(constraints.minWidth, sanitize(parsed.width, defaults.width)),
    );
    const height = Math.min(
      constraints.maxHeight,
      Math.max(constraints.minHeight, sanitize(parsed.height, defaults.height)),
    );

    const position = clampPosition({
      x: sanitize(parsed.x, defaults.position.x),
      y: sanitize(parsed.y, defaults.position.y),
    });

    return { position, width, height };
  } catch {
    return { ...defaults };
  }
}

export function savePersistedGlassModalLayout(
  panelId: string | undefined,
  layout: { position: Point2D; width: number; height: number },
): void {
  if (
    !panelId ||
    typeof window === "undefined" ||
    typeof localStorage === "undefined"
  ) {
    return;
  }
  try {
    const payload: PersistedGlassModalLayout = {
      v: SCHEMA_VERSION,
      x: layout.position.x,
      y: layout.position.y,
      width: layout.width,
      height: layout.height,
    };
    localStorage.setItem(storageKey(panelId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
