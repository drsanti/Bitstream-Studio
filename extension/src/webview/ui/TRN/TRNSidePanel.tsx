import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  PanelLeftOpen,
  PanelRightOpen,
  X,
} from "lucide-react";

import { useScrollbarEdgeReveal } from "../hooks/useScrollbarEdgeReveal.js";
import { useScrollOverflowHint } from "../hooks/useScrollOverflowHint.js";

/** Visual size of `Panel*Open` in floating-only mode (`h-4 w-4`); keep clamp math aligned. */
const FLOATING_EXPAND_ICON_PX = 16;

/** Matches Tailwind `w-1` resize strip — collapse proximity begins after this inset. */
const INNER_EDGE_RESIZE_STRIP_PX = 4;

type Side = "left" | "right";
type Mode = "docked" | "overlay";
type BackdropMode = "none" | "dim" | "blur";
type Variant = "default" | "inspector" | "settings";
type CollapsedPresentation = "rail" | "floating-only";
type OverlayOffset = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type TRNSidePanelToggleReason =
  | "button"
  | "inner-edge"
  | "hotkey"
  | "outside-click"
  | "esc"
  | "programmatic";

export type TRNSidePanelProps = {
  children: ReactNode;
  side?: Side;
  mode?: Mode;
  variant?: Variant;
  title?: ReactNode;
  /** Muted one-line summary under {@link title} in the expanded header. */
  subtitle?: ReactNode;
  /** Label on the floating collapsed expand control (defaults to string `title`). */
  collapsedFloatingLabel?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  /** When true, shows width × height (px) of the panel chrome in the footer while expanded. */
  showDimensionsFooter?: boolean;
  className?: string;
  contentClassName?: string;
  /**
   * When true, the scroll area uses a 1px scrollbar that appears only when the
   * pointer is near the right edge (see `useScrollbarEdgeReveal`).
   * Ignored when `contentScrollOverflowHint` is true.
   */
  contentEdgeRevealScrollbar?: boolean;
  /**
   * When true (default), hides the native scrollbar (no layout shift) and shows top/bottom
   * chevron hints when content overflows. Set false to restore the classic scrollbar area;
   * combine with `contentEdgeRevealScrollbar` for edge-reveal thumb only.
   */
  contentScrollOverflowHint?: boolean;
  /** Hit zone width from the right edge for revealing the scrollbar (px). */
  contentScrollbarEdgePx?: number;
  /** Delay before hiding the scrollbar after the pointer leaves the scroll area. */
  contentScrollbarHideDelayMs?: number;
  headerClassName?: string;
  footerClassName?: string;
  width?: number;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  persistKey?: string;
  resizable?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  collapsedWidth?: number;
  collapsedPresentation?: CollapsedPresentation;
  collapsedFloatingAnchor?: OverlayOffset;
  /** Layout box (px) for floating collapsed anchor correction; icon uses `h-4 w-4` (16px). */
  collapsedFloatingSize?: number;
  collapsedFloatingZIndex?: number;
  /**
   * When true (default), expanded panels show a collapse control near the inner vertical edge
   * (adjacent to main content); right dock → left edge, left dock → right edge.
   */
  showInnerEdgeCollapse?: boolean;
  /** Pointer proximity depth from the inner edge, past the resize strip (px). */
  innerEdgeCollapseZonePx?: number;
  /** Delay before hiding the inner-edge control after the pointer leaves the zone (ms). */
  innerEdgeCollapseHideDelayMs?: number;
  onToggle?: (nextCollapsed: boolean, reason: TRNSidePanelToggleReason) => void;
  onCollapsedChange?: (next: boolean) => void;
  animated?: boolean;
  animationDurationMs?: number;
  animationEasing?: string;
  glass?: boolean;
  glassOpacity?: number;
  glassBlurPx?: number;
  glassBorderOpacity?: number;
  overlayZIndex?: number;
  overlayOffset?: OverlayOffset;
  backdrop?: BackdropMode;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  /** Legacy single hotkey, e.g. "ctrl+\\". */
  toggleHotkey?: string | null;
  /** Multiple hotkeys, e.g. ["ctrl+\\\\", "cmd+\\\\"]. */
  toggleHotkeys?: string[];
  showCloseButton?: boolean;
  onRequestClose?: () => void;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function parsePx(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.endsWith("px")) {
      const parsed = Number.parseFloat(trimmed.slice(0, -2));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  return target.isContentEditable;
}

function matchHotkey(evt: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) {
    return false;
  }
  const key = parts[parts.length - 1];
  const needCtrl = parts.includes("ctrl");
  const needMeta = parts.includes("meta") || parts.includes("cmd");
  const needAlt = parts.includes("alt");
  const needShift = parts.includes("shift");
  if (evt.ctrlKey !== needCtrl) {
    return false;
  }
  if (evt.metaKey !== needMeta) {
    return false;
  }
  if (evt.altKey !== needAlt) {
    return false;
  }
  if (evt.shiftKey !== needShift) {
    return false;
  }
  return evt.key.toLowerCase() === key;
}

type PersistedSidePanelState = {
  width?: number;
  collapsed?: boolean;
};

type PersistSlice = {
  width: number;
  collapsed: boolean;
};

function readPersistedSidePanelState(
  persistKey: string | undefined,
  resolvedMinWidth: number,
  resolvedMaxWidth: number,
  resolvedDefaultWidth: number,
  defaultCollapsed: boolean,
): PersistSlice {
  const fallback: PersistSlice = {
    width: resolvedDefaultWidth,
    collapsed: defaultCollapsed,
  };
  if (persistKey == null || persistKey.trim().length === 0) {
    return fallback;
  }
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(persistKey);
    if (raw == null) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as PersistedSidePanelState;
    const width =
      typeof parsed.width === "number"
        ? clamp(parsed.width, resolvedMinWidth, resolvedMaxWidth)
        : resolvedDefaultWidth;
    const collapsed =
      typeof parsed.collapsed === "boolean"
        ? parsed.collapsed
        : defaultCollapsed;
    return { width, collapsed };
  } catch {
    return fallback;
  }
}

type VariantPreset = {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  collapsedWidth: number;
  backdrop: BackdropMode;
  glass: boolean;
};

function getVariantPreset(variant: Variant, mode: Mode): VariantPreset {
  if (variant === "inspector") {
    return {
      defaultWidth: mode === "overlay" ? 360 : 340,
      minWidth: 260,
      maxWidth: 680,
      collapsedWidth: 48,
      backdrop: mode === "overlay" ? "blur" : "none",
      glass: mode === "overlay",
    };
  }
  if (variant === "settings") {
    return {
      defaultWidth: mode === "overlay" ? 320 : 300,
      minWidth: 220,
      maxWidth: 520,
      collapsedWidth: 44,
      backdrop: mode === "overlay" ? "dim" : "none",
      glass: false,
    };
  }
  return {
    defaultWidth: 320,
    minWidth: 220,
    maxWidth: 560,
    collapsedWidth: 44,
    backdrop: "none",
    glass: false,
  };
}

export function TRNSidePanel(props: TRNSidePanelProps) {
  const {
    children,
    side = "right",
    mode = "docked",
    variant = "default",
    title,
    subtitle,
    collapsedFloatingLabel,
    actions,
    footer,
    showDimensionsFooter = false,
    className = "",
    contentClassName = "",
    contentEdgeRevealScrollbar = false,
    contentScrollOverflowHint = true,
    contentScrollbarEdgePx,
    contentScrollbarHideDelayMs,
    headerClassName = "",
    footerClassName = "",
    width,
    defaultWidth,
    minWidth,
    maxWidth,
    onWidthChange,
    persistKey,
    resizable = true,
    collapsible = true,
    collapsed,
    defaultCollapsed = false,
    collapsedWidth,
    collapsedPresentation = "rail",
    collapsedFloatingAnchor,
    collapsedFloatingSize = FLOATING_EXPAND_ICON_PX,
    collapsedFloatingZIndex,
    showInnerEdgeCollapse = true,
    innerEdgeCollapseZonePx = 12,
    innerEdgeCollapseHideDelayMs = 220,
    onToggle,
    onCollapsedChange,
    animated = true,
    animationDurationMs = 440,
    animationEasing = "cubic-bezier(0.22, 1, 0.36, 1)",
    glass,
    glassOpacity = 0.72,
    glassBlurPx = 12,
    glassBorderOpacity = 0.35,
    overlayZIndex = 30,
    overlayOffset,
    backdrop,
    closeOnOutsideClick = false,
    closeOnEsc = true,
    toggleHotkey = null,
    toggleHotkeys,
    showCloseButton = false,
    onRequestClose,
  } = props;
  const preset = getVariantPreset(variant, mode);
  const resolvedDefaultWidth = defaultWidth ?? preset.defaultWidth;
  const resolvedMinWidth = minWidth ?? preset.minWidth;
  const resolvedMaxWidth = maxWidth ?? preset.maxWidth;
  const resolvedCollapsedWidth = collapsedWidth ?? preset.collapsedWidth;
  const resolvedBackdrop = backdrop ?? preset.backdrop;
  const resolvedGlass = glass ?? preset.glass;

  const isWidthControlled = width != null;
  const isCollapsedControlled = collapsed != null;
  const [persistSlice, setPersistSlice] = useState<PersistSlice>(() => {
    const fromDisk = readPersistedSidePanelState(
      persistKey,
      resolvedMinWidth,
      resolvedMaxWidth,
      resolvedDefaultWidth,
      defaultCollapsed,
    );
    return {
      width: isWidthControlled ? resolvedDefaultWidth : fromDisk.width,
      collapsed: isCollapsedControlled ? defaultCollapsed : fromDisk.collapsed,
    };
  });
  const activeWidth = isWidthControlled ? (width as number) : persistSlice.width;
  const clampedWidth = clamp(activeWidth, resolvedMinWidth, resolvedMaxWidth);
  const effectiveCollapsed = isCollapsedControlled
    ? (collapsed as boolean)
    : persistSlice.collapsed;

  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const resizeSeparatorRef = useRef<HTMLDivElement | null>(null);
  const applyWidthRef = useRef<(nextWidth: number) => void>(() => {});
  const panelRef = useRef<HTMLElement | null>(null);
  const useFloatingCollapsed = collapsedPresentation === "floating-only";
  const [floatingOnlyTriggerVisible, setFloatingOnlyTriggerVisible] = useState(
    useFloatingCollapsed && effectiveCollapsed && collapsible,
  );
  const showFloatingOnlyTrigger = floatingOnlyTriggerVisible;
  const [floatingAnchorCorrection, setFloatingAnchorCorrection] = useState({
    top: 0,
    left: 0,
  });

  const innerEdgeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const innerEdgeCollapseButtonRef = useRef<HTMLButtonElement | null>(null);
  const [innerEdgeAffordanceVisible, setInnerEdgeAffordanceVisible] = useState(false);

  const showInnerEdgeCollapseAffordance =
    showInnerEdgeCollapse &&
    collapsible &&
    !effectiveCollapsed &&
    !showFloatingOnlyTrigger;

  const clearInnerEdgeHideTimer = () => {
    if (innerEdgeHideTimerRef.current != null) {
      clearTimeout(innerEdgeHideTimerRef.current);
      innerEdgeHideTimerRef.current = null;
    }
  };

  const scheduleInnerEdgeHide = () => {
    clearInnerEdgeHideTimer();
    innerEdgeHideTimerRef.current = window.setTimeout(() => {
      innerEdgeHideTimerRef.current = null;
      setInnerEdgeAffordanceVisible(false);
    }, innerEdgeCollapseHideDelayMs);
  };

  const updateInnerEdgeFromClientPoint = (clientX: number, clientY: number) => {
    if (!showInnerEdgeCollapseAffordance) {
      return;
    }
    const panelEl = panelRef.current;
    if (panelEl == null) {
      return;
    }
    const rect = panelEl.getBoundingClientRect();
    /** Vertical seam between main content and panel (both sides of the line). */
    const seamX = side === "right" ? rect.left : rect.right;
    const horizontalDist = Math.abs(clientX - seamX);
    const bandPx = INNER_EDGE_RESIZE_STRIP_PX + innerEdgeCollapseZonePx;
    const verticallyAligned =
      clientY >= rect.top && clientY <= rect.bottom;
    const inRevealZone =
      horizontalDist <= bandPx && verticallyAligned;
    const btn = innerEdgeCollapseButtonRef.current;
    let overCollapseBtn = false;
    if (innerEdgeAffordanceVisible && btn) {
      const br = btn.getBoundingClientRect();
      overCollapseBtn =
        clientX >= br.left &&
        clientX <= br.right &&
        clientY >= br.top &&
        clientY <= br.bottom;
    }
    if (inRevealZone || overCollapseBtn) {
      clearInnerEdgeHideTimer();
      setInnerEdgeAffordanceVisible(true);
    } else {
      scheduleInnerEdgeHide();
    }
  };

  const updateInnerEdgeFromPointerRef = useRef(updateInnerEdgeFromClientPoint);
  updateInnerEdgeFromPointerRef.current = updateInnerEdgeFromClientPoint;

  useEffect(() => {
    if (!showInnerEdgeCollapseAffordance) {
      return;
    }
    const onMove = (e: PointerEvent) => {
      updateInnerEdgeFromPointerRef.current(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, [showInnerEdgeCollapseAffordance]);

  useEffect(() => {
    return () => {
      clearInnerEdgeHideTimer();
    };
  }, []);

  useEffect(() => {
    if (!showInnerEdgeCollapseAffordance) {
      setInnerEdgeAffordanceVisible(false);
      clearInnerEdgeHideTimer();
    }
  }, [showInnerEdgeCollapseAffordance]);

  useEffect(() => {
    if (effectiveCollapsed) {
      setInnerEdgeAffordanceVisible(false);
      clearInnerEdgeHideTimer();
    }
  }, [effectiveCollapsed]);

  const resolvedHotkeys = useMemo(() => {
    const keys: string[] = [];
    if (toggleHotkey != null && toggleHotkey.trim().length > 0) {
      keys.push(toggleHotkey.trim().toLowerCase());
    }
    if (toggleHotkeys != null) {
      for (const key of toggleHotkeys) {
        const normalized = key.trim().toLowerCase();
        if (normalized.length > 0) {
          keys.push(normalized);
        }
      }
    }
    const deduped = Array.from(new Set(keys));
    return deduped;
  }, [toggleHotkey, toggleHotkeys]);

  const setWidth = (next: number) => {
    const clamped = clamp(next, resolvedMinWidth, resolvedMaxWidth);
    if (!isWidthControlled) {
      setPersistSlice((s) => ({ ...s, width: clamped }));
    }
    onWidthChange?.(clamped);
  };

  applyWidthRef.current = setWidth;

  const setCollapsed = (
    next: boolean,
    reason: TRNSidePanelToggleReason = "programmatic",
  ) => {
    if (!isCollapsedControlled) {
      setPersistSlice((s) => ({ ...s, collapsed: next }));
    }
    onToggle?.(next, reason);
    onCollapsedChange?.(next);
  };

  useEffect(() => {
    if (isWidthControlled) {
      return;
    }
    setPersistSlice((prev) => ({
      ...prev,
      width: clamp(prev.width, resolvedMinWidth, resolvedMaxWidth),
    }));
  }, [isWidthControlled, resolvedMinWidth, resolvedMaxWidth]);

  useEffect(() => {
    if (persistKey == null || persistKey.trim().length === 0) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(persistKey);
      if (raw == null) {
        return;
      }
      const parsed = JSON.parse(raw) as PersistedSidePanelState;
      setPersistSlice((prev) => {
        let nextWidth = prev.width;
        let nextCollapsed = prev.collapsed;
        if (!isWidthControlled && typeof parsed.width === "number") {
          nextWidth = clamp(parsed.width, resolvedMinWidth, resolvedMaxWidth);
        }
        if (!isCollapsedControlled && typeof parsed.collapsed === "boolean") {
          nextCollapsed = parsed.collapsed;
        }
        return { width: nextWidth, collapsed: nextCollapsed };
      });
    } catch {
      /* ignore invalid persisted data */
    }
  }, [
    persistKey,
    isWidthControlled,
    isCollapsedControlled,
    resolvedMinWidth,
    resolvedMaxWidth,
  ]);

  useEffect(() => {
    if (persistKey == null || persistKey.trim().length === 0) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const state: PersistedSidePanelState = {
      width: clampedWidth,
      collapsed: effectiveCollapsed,
    };
    window.localStorage.setItem(persistKey, JSON.stringify(state));
  }, [persistKey, clampedWidth, effectiveCollapsed]);

  useEffect(() => {
    if (!closeOnEsc || onRequestClose == null || mode !== "overlay") {
      return;
    }
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key !== "Escape") {
        return;
      }
      evt.preventDefault();
      onRequestClose();
      setCollapsed(true, "esc");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOnEsc, mode, onRequestClose]);

  useEffect(() => {
    if (resolvedHotkeys.length === 0) {
      return;
    }
    const onKeyDown = (evt: KeyboardEvent) => {
      if (isEditableTarget(evt.target)) {
        return;
      }
      const matched = resolvedHotkeys.some((hotkey) => matchHotkey(evt, hotkey));
      if (!matched) {
        return;
      }
      evt.preventDefault();
      if (mode === "overlay" && onRequestClose != null && !effectiveCollapsed) {
        onRequestClose();
        setCollapsed(true, "hotkey");
        return;
      }
      setCollapsed(!effectiveCollapsed, "hotkey");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resolvedHotkeys, mode, onRequestClose, effectiveCollapsed]);

  useEffect(() => {
    if (!closeOnOutsideClick || mode !== "overlay" || onRequestClose == null) {
      return;
    }
    const onPointerDown = (evt: PointerEvent) => {
      const root = panelRef.current;
      if (root == null) {
        return;
      }
      const target = evt.target;
      if (target instanceof Node && !root.contains(target)) {
        onRequestClose();
        setCollapsed(true, "outside-click");
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [closeOnOutsideClick, mode, onRequestClose]);

  useEffect(() => {
    const onPointerMove = (evt: PointerEvent) => {
      if (dragRef.current == null) {
        return;
      }
      const delta = evt.clientX - dragRef.current.startX;
      const next =
        side === "right"
          ? dragRef.current.startWidth - delta
          : dragRef.current.startWidth + delta;
      applyWidthRef.current(next);
    };
    const onPointerUp = (evt: PointerEvent) => {
      const el = resizeSeparatorRef.current;
      if (el != null && el.hasPointerCapture(evt.pointerId)) {
        el.releasePointerCapture(evt.pointerId);
      }
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [side]);

  const panelWidth = effectiveCollapsed
    ? useFloatingCollapsed
      ? 0
      : resolvedCollapsedWidth
    : clampedWidth;
  const transitionDuration = animated ? `${animationDurationMs}ms` : "0ms";
  const transitionTimingFunction = animationEasing;

  const panelStyle: CSSProperties = useMemo(() => {
    const base: CSSProperties = {
      width: panelWidth,
      transitionProperty: "width, transform, opacity, background-color, border-color",
      transitionDuration,
      transitionTimingFunction,
      backdropFilter:
        mode === "overlay" && resolvedGlass ? `blur(${glassBlurPx}px)` : undefined,
      WebkitBackdropFilter:
        mode === "overlay" && resolvedGlass ? `blur(${glassBlurPx}px)` : undefined,
    };
    if (mode === "overlay") {
      base.position = "absolute";
      base.top = overlayOffset?.top ?? 0;
      base.bottom = overlayOffset?.bottom ?? 0;
      base.zIndex = overlayZIndex;
      if (side === "right") {
        base.right = overlayOffset?.right ?? 0;
      } else {
        base.left = overlayOffset?.left ?? 0;
      }
      if (effectiveCollapsed) {
        base.transform = side === "right" ? "translateX(0)" : "translateX(0)";
      }
    }
    return base;
  }, [
    panelWidth,
    transitionDuration,
    transitionTimingFunction,
    mode,
    resolvedGlass,
    glassBlurPx,
    overlayZIndex,
    overlayOffset,
    side,
    effectiveCollapsed,
  ]);

  const surfaceStyle: CSSProperties =
    mode === "overlay" && resolvedGlass
      ? {
          backgroundColor: `color-mix(in srgb, rgb(24 24 27) ${Math.round(
            glassOpacity * 100
          )}%, transparent)`,
          borderColor: `color-mix(in srgb, rgb(63 63 70) ${Math.round(
            glassBorderOpacity * 100
          )}%, transparent)`,
        }
      : {};
  const contentFadeStyle: CSSProperties = {
    opacity: effectiveCollapsed ? 0 : 1,
    transitionProperty: "opacity",
    transitionDuration,
    transitionTimingFunction,
  };

  const collapseIcon =
    side === "right" ? (
      effectiveCollapsed ? (
        <ChevronLeft className="h-3.5 w-3.5" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5" />
      )
    ) : effectiveCollapsed ? (
      <ChevronRight className="h-3.5 w-3.5" />
    ) : (
      <ChevronLeft className="h-3.5 w-3.5" />
    );

  const variantClassName =
    variant === "inspector"
      ? "border-cyan-500/35"
      : variant === "settings"
        ? "border-indigo-400/40"
        : "";

  const resizeGripAccentClass =
    variant === "inspector"
      ? "hover:bg-cyan-400/15 active:bg-cyan-400/25 focus-visible:bg-cyan-400/18 focus-visible:ring-cyan-400/40 "
      : variant === "settings"
        ? "hover:bg-indigo-400/15 active:bg-indigo-400/25 focus-visible:bg-indigo-400/18 focus-visible:ring-indigo-400/40 "
        : "hover:bg-zinc-400/15 active:bg-zinc-400/25 focus-visible:bg-zinc-400/20 focus-visible:ring-zinc-400/45 ";

  const floatingAnchorStyle: CSSProperties = useMemo(() => {
    if (collapsedFloatingAnchor != null) {
      return collapsedFloatingAnchor;
    }
    if (side === "right") {
      return { right: 0, top: "50%", transform: "translateY(-50%)" };
    }
    return { left: 0, top: "50%", transform: "translateY(-50%)" };
  }, [collapsedFloatingAnchor, side]);

  useEffect(() => {
    if (!useFloatingCollapsed || !collapsible) {
      setFloatingOnlyTriggerVisible(false);
      return;
    }
    if (!effectiveCollapsed) {
      setFloatingOnlyTriggerVisible(false);
      return;
    }
    if (!animated || animationDurationMs <= 0) {
      setFloatingOnlyTriggerVisible(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setFloatingOnlyTriggerVisible(true);
    }, animationDurationMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [
    animated,
    animationDurationMs,
    collapsible,
    effectiveCollapsed,
    useFloatingCollapsed,
  ]);

  useEffect(() => {
    if (!showFloatingOnlyTrigger) {
      setFloatingAnchorCorrection({ top: 0, left: 0 });
      return;
    }

    const recalculateAnchorCorrection = () => {
      const container = panelRef.current;
      if (container == null) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const iconSize = collapsedFloatingSize;
      const rawTop = parsePx(floatingAnchorStyle.top);
      const rawBottom = parsePx(floatingAnchorStyle.bottom);
      const rawLeft = parsePx(floatingAnchorStyle.left);
      const rawRight = parsePx(floatingAnchorStyle.right);

      let targetTop: number | null = null;
      if (rawTop != null) {
        targetTop = rawTop;
      } else if (rawBottom != null) {
        targetTop = containerRect.height - rawBottom - iconSize;
      }

      let targetLeft: number | null = null;
      if (rawLeft != null) {
        targetLeft = rawLeft;
      } else if (rawRight != null) {
        targetLeft = containerRect.width - rawRight - iconSize;
      }

      const margin = 0;
      const clampedTop =
        targetTop != null
          ? clamp(targetTop, margin, Math.max(margin, containerRect.height - iconSize - margin))
          : null;
      const clampedLeft =
        targetLeft != null
          ? clamp(targetLeft, margin, Math.max(margin, containerRect.width - iconSize - margin))
          : null;

      setFloatingAnchorCorrection({
        top:
          targetTop != null && clampedTop != null
            ? Math.round(clampedTop - targetTop)
            : 0,
        left:
          targetLeft != null && clampedLeft != null
            ? Math.round(clampedLeft - targetLeft)
            : 0,
      });
    };

    recalculateAnchorCorrection();
    window.addEventListener("resize", recalculateAnchorCorrection);
    return () => window.removeEventListener("resize", recalculateAnchorCorrection);
  }, [showFloatingOnlyTrigger, collapsedFloatingSize, floatingAnchorStyle]);

  const panelHeaderClassName =
    "flex items-center gap-1 border-b px-2 py-1.5 " +
    (resolvedGlass ? "border-zinc-600/70 bg-zinc-900/50 " : "border-zinc-700/80 ");
  const panelTitleClassName =
    "text-xs font-semibold truncate min-w-0 " +
    (resolvedGlass ? "text-zinc-50" : "text-zinc-100");
  const panelActionButtonClassName =
    "inline-flex items-center justify-center rounded border " +
    (resolvedGlass
      ? "border-zinc-600/75 bg-zinc-900/55 text-zinc-100 hover:bg-zinc-800/70"
      : "border-zinc-700/80 hover:bg-zinc-800/70");
  const collapsedHeaderClassName =
    "border-b p-1 " +
    (resolvedGlass ? "border-zinc-600/70 bg-zinc-900/45" : "border-zinc-700/80");
  const panelFooterClassName =
    "border-t px-2 py-1.5 text-xs " +
    (resolvedGlass ? "border-zinc-600/70 bg-zinc-900/40 " : "border-zinc-700/80 ");

  const [panelDimensions, setPanelDimensions] = useState({ width: 0, height: 0 });

  const scrollEdgeReveal = useScrollbarEdgeReveal(
    contentEdgeRevealScrollbar && !contentScrollOverflowHint,
    {
      edgePx: contentScrollbarEdgePx,
      hideDelayMs: contentScrollbarHideDelayMs,
    },
  );

  const overflowHintEnabled =
    contentScrollOverflowHint && !effectiveCollapsed;
  const overflowHint = useScrollOverflowHint(overflowHintEnabled);

  const hasExplicitContentPadding =
    /\bp-\d+/.test(contentClassName) ||
    /\bpx-\d+/.test(contentClassName) ||
    /\bpy-\d+/.test(contentClassName) ||
    /\bpt-\d+/.test(contentClassName) ||
    /\bpr-\d+/.test(contentClassName) ||
    /\bpb-\d+/.test(contentClassName) ||
    /\bpl-\d+/.test(contentClassName);
  const defaultContentPaddingClass = hasExplicitContentPadding ? "" : "p-2 ";

  useEffect(() => {
    if (!showDimensionsFooter) {
      return;
    }
    const element = panelRef.current;
    if (element == null) {
      return;
    }
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setPanelDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showDimensionsFooter]);

  const dimensionsFooter =
    showDimensionsFooter ? (
      <div
        className="tabular-nums font-mono text-[10px] leading-tight text-zinc-500"
        aria-live="polite"
      >
        <span className="text-zinc-400">Panel</span>{" "}
        <span className="text-zinc-300">
          {panelDimensions.width} × {panelDimensions.height} px
        </span>
      </div>
    ) : null;

  const showFooterStrip =
    !effectiveCollapsed && (footer != null || showDimensionsFooter);

  const expandPanelLabel =
    collapsedFloatingLabel ??
    (typeof title === "string" ? title : undefined);

  return (
    <>
      {showFloatingOnlyTrigger ? (
        <button
          type="button"
          className={
            "pointer-events-auto group absolute inline-flex items-center gap-1.5 rounded-md border border-zinc-700/80 bg-zinc-950/90 px-2 py-1.5 shadow-lg outline-none transition-colors duration-150 ease-out hover:border-zinc-600/80 hover:bg-zinc-900/95 focus-visible:ring-2 focus-visible:ring-zinc-500/60 focus-visible:ring-offset-0 " +
            (side === "right"
              ? "flex-row-reverse "
              : "")
          }
          style={{
            ...floatingAnchorStyle,
            marginTop: floatingAnchorCorrection.top,
            marginLeft: floatingAnchorCorrection.left,
            opacity: 1,
            zIndex:
              collapsedFloatingZIndex ??
              (mode === "overlay" ? overlayZIndex + 1 : 10),
          }}
          aria-label={
            expandPanelLabel != null
              ? `Expand ${expandPanelLabel}`
              : "Expand panel"
          }
          onClick={() => setCollapsed(false, "button")}
        >
          <span className="trn-side-panel-expand-icon inline-flex shrink-0 text-zinc-400 transition-colors duration-150 group-hover:text-zinc-200">
            {side === "right" ? (
              <PanelRightOpen className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            )}
          </span>
          {expandPanelLabel != null && expandPanelLabel.length > 0 ? (
            <span
              className={
                "max-w-[7.5rem] truncate text-[10px] font-semibold leading-tight text-zinc-300 transition-colors duration-150 group-hover:text-zinc-100 " +
                (side === "right" ? "text-right" : "text-left")
              }
            >
              {expandPanelLabel}
            </span>
          ) : null}
        </button>
      ) : null}
      {mode === "overlay" && resolvedBackdrop !== "none" ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            zIndex: overlayZIndex - 1,
            top: overlayOffset?.top ?? 0,
            right: overlayOffset?.right ?? 0,
            bottom: overlayOffset?.bottom ?? 0,
            left: overlayOffset?.left ?? 0,
            backgroundColor:
              resolvedBackdrop === "dim"
                ? "color-mix(in srgb, black 30%, transparent)"
                : "color-mix(in srgb, black 16%, transparent)",
            backdropFilter: resolvedBackdrop === "blur" ? "blur(4px)" : undefined,
            WebkitBackdropFilter: resolvedBackdrop === "blur" ? "blur(4px)" : undefined,
          }}
          onClick={() => {
            if (closeOnOutsideClick) {
              onRequestClose?.();
              setCollapsed(true, "outside-click");
            }
          }}
        />
      ) : null}
      <div
        ref={panelRef}
        style={panelStyle}
        className="relative h-full min-h-0 shrink-0 overflow-visible"
      >
      <aside
        className={
          "h-full min-h-0 w-full border border-zinc-700/80 bg-zinc-950/95 flex flex-col overflow-hidden " +
          variantClassName +
          " " +
          (mode === "overlay" ? "shadow-xl " : "") +
          (showFloatingOnlyTrigger
            ? "border-0 bg-transparent shadow-none pointer-events-none "
            : "") +
          className
        }
      >
      {!showFloatingOnlyTrigger ? (
      <div style={{ ...surfaceStyle, ...contentFadeStyle }} className="h-full min-h-0 flex flex-col">
        {!effectiveCollapsed ? (
          <div
            className={
              panelHeaderClassName + headerClassName
            }
          >
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className={panelTitleClassName}>
                {title ?? (side === "right" ? "Side Panel" : "Panel")}
              </div>
              {subtitle != null ? (
                <div className="truncate text-[10px] font-normal leading-tight text-zinc-400">
                  {subtitle}
                </div>
              ) : null}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {actions}
              {collapsible ? (
                <button
                  type="button"
                  className={
                    "h-6 w-6 " + panelActionButtonClassName
                  }
                  aria-label="Collapse panel"
                  onClick={() => setCollapsed(true, "button")}
                >
                  {collapseIcon}
                </button>
              ) : null}
              {showCloseButton ? (
                <button
                  type="button"
                  className={
                    "h-6 w-6 " + panelActionButtonClassName
                  }
                  aria-label="Close panel"
                  onClick={() => onRequestClose?.()}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        ) : !useFloatingCollapsed ? (
          <div className={collapsedHeaderClassName}>
            <button
              type="button"
              className={
                "h-8 w-full " + panelActionButtonClassName
              }
              aria-label="Expand panel"
              onClick={() => setCollapsed(false, "button")}
            >
              {collapseIcon}
            </button>
          </div>
        ) : null}

        {!effectiveCollapsed ? (
          contentScrollOverflowHint ? (
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                ref={overflowHint.scrollRef}
                tabIndex={0}
                className={
                  "scrollbar-hide min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40 " +
                  defaultContentPaddingClass +
                  contentClassName
                }
              >
                <div
                  ref={overflowHint.contentRef}
                  className="flex h-full min-h-0 min-w-0 flex-col"
                >
                  {children}
                </div>
              </div>
              {overflowHint.canScrollUp ? (
                <div
                  className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex flex-col items-center bg-linear-to-b from-zinc-950 from-35% via-zinc-950/90 to-transparent pb-12 pt-2"
                  role="img"
                  aria-label="More content above. Scroll up or use the mouse wheel to view."
                >
                  <ChevronsUp
                    className="h-5 w-5 text-zinc-500 motion-safe:animate-bounce"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
              ) : null}
              {overflowHint.canScrollDown ? (
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center bg-linear-to-t from-zinc-950 from-35% via-zinc-950/90 to-transparent pb-2 pt-12"
                  role="img"
                  aria-label="More content below. Scroll or use the mouse wheel to view."
                >
                  <ChevronsDown
                    className="h-5 w-5 text-zinc-500 motion-safe:animate-bounce"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div
              ref={scrollEdgeReveal.ref}
              className={
                "min-h-0 flex-1 overflow-y-auto " +
                defaultContentPaddingClass +
                (contentEdgeRevealScrollbar ? scrollEdgeReveal.revealClassName + " " : "") +
                contentClassName
              }
              onMouseMove={scrollEdgeReveal.onMouseMove}
              onMouseEnter={scrollEdgeReveal.onMouseEnter}
              onMouseLeave={scrollEdgeReveal.onMouseLeave}
            >
              <div className="flex h-full min-h-0 min-w-0 flex-col">{children}</div>
            </div>
          )
        ) : !useFloatingCollapsed ? (
          <div className="min-h-0 flex-1 flex items-center justify-center text-zinc-400">
            <button
              type="button"
              className={
                "group h-8 w-8 " + panelActionButtonClassName
              }
              aria-label="Expand panel"
              onClick={() => setCollapsed(false, "button")}
            >
              <span className="trn-side-panel-expand-icon inline-flex text-zinc-400 transition-colors duration-150 group-hover:text-zinc-200">
                {side === "right" ? (
                  <PanelRightOpen className="h-4 w-4" aria-hidden />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" aria-hidden />
                )}
              </span>
            </button>
          </div>
        ) : null}

        {showFooterStrip ? (
          <div className={panelFooterClassName + footerClassName}>
            <div className="flex flex-col gap-1">
              {dimensionsFooter}
              {footer != null ? <div className="text-zinc-400">{footer}</div> : null}
            </div>
          </div>
        ) : null}
      </div>
      ) : null}
      </aside>

      {showInnerEdgeCollapseAffordance ? (
        <button
          ref={innerEdgeCollapseButtonRef}
          type="button"
          tabIndex={-1}
          aria-hidden={!innerEdgeAffordanceVisible}
          className={
            "group absolute top-1/2 z-40 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded border-0 bg-transparent p-0 shadow-none outline-none transition-opacity duration-200 motion-safe:transition-opacity motion-reduce:transition-none " +
            (side === "right"
              ? "left-0 -translate-x-1/2 "
              : "right-0 translate-x-1/2 ") +
            (innerEdgeAffordanceVisible
              ? "pointer-events-auto opacity-100 focus-visible:ring-2 focus-visible:ring-zinc-500/60 focus-visible:ring-offset-0"
              : "pointer-events-none opacity-0")
          }
          aria-label="Collapse panel"
          onClick={() => setCollapsed(true, "inner-edge")}
        >
          <span
            className={
              "inline-flex text-zinc-400 transition-colors duration-150 group-hover:text-zinc-200 " +
              (innerEdgeAffordanceVisible ? "trn-side-panel-expand-icon " : "")
            }
          >
            {side === "right" ? (
              <PanelRightOpen
                className="h-4 w-4 rotate-180"
                aria-hidden
              />
            ) : (
              <PanelLeftOpen
                className="h-4 w-4 rotate-180"
                aria-hidden
              />
            )}
          </span>
        </button>
      ) : null}

      {resizable && !(effectiveCollapsed && useFloatingCollapsed) ? (
        <div
          ref={resizeSeparatorRef}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel width"
          aria-valuenow={Math.round(clampedWidth)}
          aria-valuemin={resolvedMinWidth}
          aria-valuemax={resolvedMaxWidth}
          tabIndex={0}
          className={
            "pointer-events-auto nodrag nopan absolute top-0 bottom-0 z-50 w-3 cursor-col-resize touch-none transition-colors select-none " +
            "bg-transparent focus-visible:outline-none focus-visible:ring-2 " +
            resizeGripAccentClass +
            (side === "right"
              ? "left-0 -translate-x-1/2"
              : "right-0 translate-x-1/2")
          }
          title="Drag to resize panel · Double-click to reset width · Arrow keys when focused"
          onPointerDown={(evt) => {
            if (evt.button !== 0) {
              return;
            }
            dragRef.current = { startX: evt.clientX, startWidth: clampedWidth };
            evt.preventDefault();
            evt.stopPropagation();
            evt.currentTarget.setPointerCapture(evt.pointerId);
          }}
          onDoubleClick={() => setWidth(resolvedDefaultWidth)}
          onKeyDown={(evt) => {
            const step = evt.shiftKey ? 24 : 12;
            const growRight = side === "right" ? "ArrowLeft" : "ArrowRight";
            const shrinkRight = side === "right" ? "ArrowRight" : "ArrowLeft";
            if (evt.key === growRight) {
              evt.preventDefault();
              setWidth(clampedWidth + step);
              return;
            }
            if (evt.key === shrinkRight) {
              evt.preventDefault();
              setWidth(clampedWidth - step);
              return;
            }
            if (evt.key === "Home") {
              evt.preventDefault();
              setWidth(resolvedMinWidth);
              return;
            }
            if (evt.key === "End") {
              evt.preventDefault();
              setWidth(resolvedMaxWidth);
            }
          }}
        />
      ) : null}
      </div>
    </>
  );
}
