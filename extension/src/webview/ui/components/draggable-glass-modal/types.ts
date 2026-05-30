import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Panel position in viewport CSS pixels. */
export type Point2D = { x: number; y: number };

/** Which resize edge or corner is active (compass: n/e/s/w + diagonals). */
export type ResizeHandleKind =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

/** Body padding: `default` matches launcher cards; `compact` trims gutters for dense tools. */
export type GlassModalBodyDensity = "default" | "compact";

/** Root component props. */
export type DraggableGlassModalProps = {
  title: string;
  description?: string;
  /** Body inset padding. Use `compact` for log-heavy panels. Default: `default`. */
  bodyDensity?: GlassModalBodyDensity;
  icon?: LucideIcon;
  /** Shown when `onMenuClick` is set. Defaults to lucide `Menu`. */
  menuIcon?: LucideIcon;
  /** Shown when `onClose` is set. Defaults to lucide `X`. */
  closeIcon?: LucideIcon;
  /** If set, a menu control is shown (uses `menuIcon`). */
  onMenuClick?: () => void;
  onClose?: () => void;
  children: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  onPositionChange?: (position: Point2D) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  /** Optional id (e.g. persistence). */
  panelId?: string;
};
