import { ChevronDown, ChevronUp, Pin, PinOff } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react";
import { twMerge } from "tailwind-merge";
import {
  TRNWindow,
  type TRNWindowProps,
  type TRNWindowShellProps,
} from "./TRNWindow.js";

/** Match `TRNWindow` window-action icons (`TRN_WINDOW_HEADER_ACTION_STROKE`). */
const TOOLBOX_HEADER_ICON_STROKE = 2.5;

/** Must match `TRNWindow` title row height (`h-6` = 24px); larger values leave an empty strip when collapsed. */
const TOOLBOX_HEADER_MIN_PX = 24;
const DEFAULT_DRAG_EDGE_SNAP_PX = 12;
const DEFAULT_EXPANDED_MIN_HEIGHT = 120;

/** Glass tuning when “pin” (readability) is active — overrides toolbox preset while pinned. */
export const TRN_TOOLBOX_PIN_GLASS_OPACITY = 0.78;
export const TRN_TOOLBOX_PIN_GLASS_BORDER_OPACITY = 0.86;
export const TRN_TOOLBOX_PIN_GLASS_BLUR_PX = 10;

export type TRNToolboxPanelPinControl = "off" | "toggle";

export type TRNToolboxPanelProps = Omit<
  TRNWindowProps,
  "showMaximize" | "headerActions"
> & {
  /**
   * Uncontrolled: initial collapsed state. Ignored when `collapsed` is controlled.
   * If `persistRectStorageKey` is set, storage may override on first load.
   */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * When `persistRectStorageKey` is set, also persist collapsed under `"{key}:collapsed"`.
   * Default `true`.
   */
  persistCollapsed?: boolean;
  /** Optional extra header controls (after the collapse button, before any close/max actions). */
  toolbarActions?: ReactNode;
  /**
   * Header pin control: temporary **more opaque** glass for readability vs default transparent toolbox preset.
   * Default `toggle`.
   */
  pinControl?: TRNToolboxPanelPinControl;
  /**
   * When `persistRectStorageKey` is set, persist pin state under `"{key}:pinOpaque"`.
   * Default `true`.
   */
  persistPinOpaque?: boolean;
  /**
   * When focus is **inside** the panel shell, **Escape** collapses the panel (capture-phase listener).
   * Default `true`. Does not steal Esc from nested modals if focus is outside the shell.
   */
  collapseOnEscape?: boolean;
};

function readStoredCollapsed(persistKey: string): boolean | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const v = localStorage.getItem(`${persistKey}:collapsed`);
    if (v === "true") {
      return true;
    }
    if (v === "false") {
      return false;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeStoredCollapsed(persistKey: string, collapsed: boolean): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      `${persistKey}:collapsed`,
      collapsed ? "true" : "false",
    );
  } catch {
    // ignore
  }
}

function readStoredPinOpaque(persistKey: string): boolean | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const v = localStorage.getItem(`${persistKey}:pinOpaque`);
    if (v === "true") {
      return true;
    }
    if (v === "false") {
      return false;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeStoredPinOpaque(persistKey: string, pinOpaque: boolean): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      `${persistKey}:pinOpaque`,
      pinOpaque ? "true" : "false",
    );
  } catch {
    // ignore
  }
}

function assignRef<T>(ref: Ref<T | null> | undefined, value: T | null): void {
  if (ref == null) {
    return;
  }
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as MutableRefObject<T | null>).current = value;
}

/**
 * Viewport toolbox overlay: composes {@link TRNWindow} with no maximize, optional left/right
 * edge snap while dragging, a more transparent default glass preset, and collapse/expand.
 */
export function TRNToolboxPanel(props: TRNToolboxPanelProps) {
  const {
    defaultCollapsed = false,
    collapsed: collapsedProp,
    onCollapsedChange,
    persistCollapsed = true,
    toolbarActions,
    pinControl = "toggle",
    persistPinOpaque = true,
    collapseOnEscape = true,
    children,
    minHeight: minHeightProp,
    resizable: resizableProp,
    heightMode = "auto",
    modal = false,
    showFooter = false,
    glass = true,
    glassPreset = "toolbox",
    glassOpacity: glassOpacityProp,
    glassBorderOpacity: glassBorderOpacityProp,
    glassBlurPx: glassBlurPxProp,
    dragEdgeSnapPx = DEFAULT_DRAG_EDGE_SNAP_PX,
    persistRectStorageKey,
    shellProps: userShellProps,
    shellRef: userShellRef,
    className: userClassName,
    ...rest
  } = props;

  const shellRef = useRef<HTMLDivElement | null>(null);

  const setShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      shellRef.current = node;
      assignRef(userShellRef, node);
    },
    [userShellRef],
  );

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (defaultCollapsed) {
      return true;
    }
    if (persistRectStorageKey != null && persistCollapsed) {
      const fromStore = readStoredCollapsed(persistRectStorageKey);
      if (fromStore != null) {
        return fromStore;
      }
    }
    return false;
  });

  const [internalPinOpaque, setInternalPinOpaque] = useState(() => {
    if (
      persistRectStorageKey != null &&
      persistPinOpaque &&
      pinControl !== "off"
    ) {
      const fromStore = readStoredPinOpaque(persistRectStorageKey);
      if (fromStore != null) {
        return fromStore;
      }
    }
    return false;
  });

  const collapsed = collapsedProp ?? internalCollapsed;
  const pinOpaque = pinControl === "off" ? false : internalPinOpaque;

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (onCollapsedChange) {
        onCollapsedChange(next);
      } else {
        setInternalCollapsed(next);
      }
    },
    [onCollapsedChange],
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const togglePinOpaque = useCallback(() => {
    setInternalPinOpaque((p) => !p);
  }, []);

  useEffect(() => {
    if (!persistRectStorageKey || !persistCollapsed) {
      return;
    }
    writeStoredCollapsed(persistRectStorageKey, collapsed);
  }, [collapsed, persistRectStorageKey, persistCollapsed]);

  useEffect(() => {
    if (!persistRectStorageKey || !persistPinOpaque || pinControl === "off") {
      return;
    }
    writeStoredPinOpaque(persistRectStorageKey, pinOpaque);
  }, [pinOpaque, persistPinOpaque, persistRectStorageKey, pinControl]);

  useEffect(() => {
    if (!collapseOnEscape || collapsed) {
      return;
    }
    const onKey = (evt: KeyboardEvent): void => {
      if (evt.key !== "Escape" || evt.defaultPrevented) {
        return;
      }
      const shell = shellRef.current;
      if (shell == null) {
        return;
      }
      const active = document.activeElement;
      if (active != null && !shell.contains(active)) {
        return;
      }
      evt.preventDefault();
      setCollapsed(true);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [collapseOnEscape, collapsed, setCollapsed]);

  const minHeight = collapsed
    ? TOOLBOX_HEADER_MIN_PX
    : (minHeightProp ?? DEFAULT_EXPANDED_MIN_HEIGHT);
  const resizable = collapsed ? false : (resizableProp ?? true);

  const glassOpacityEffective =
    glass && pinOpaque ? TRN_TOOLBOX_PIN_GLASS_OPACITY : glassOpacityProp;

  const glassBorderOpacityEffective =
    glass && pinOpaque
      ? TRN_TOOLBOX_PIN_GLASS_BORDER_OPACITY
      : glassBorderOpacityProp;

  const glassBlurEffective =
    glass && pinOpaque ? TRN_TOOLBOX_PIN_GLASS_BLUR_PX : glassBlurPxProp;

  const mergedShellProps = useMemo((): TRNWindowShellProps => {
    const tabIndexForEsc =
      collapseOnEscape === true
        ? (userShellProps?.tabIndex ?? -1)
        : userShellProps?.tabIndex;
    return {
      ...userShellProps,
      tabIndex: tabIndexForEsc,
      "data-trn-toolbox-panel": true,
    };
  }, [collapseOnEscape, userShellProps]);

  const headerActions = (
    <>
      {pinControl === "toggle" ? (
        <button
          type="button"
          className="h-6 min-w-6 rounded border-0 bg-transparent px-1 pt-[2px] text-xs text-zinc-100 hover:bg-white/10"
          onClick={togglePinOpaque}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          aria-pressed={pinOpaque}
          title={
            pinOpaque
              ? "More transparent glass (see 3D scene)"
              : "More opaque glass (readability)"
          }
          aria-label={
            pinOpaque ? "Use more transparent glass" : "Use more opaque glass"
          }
        >
          <span className="inline-flex items-center justify-center text-zinc-200">
            {pinOpaque ? (
              <Pin className="h-3.5 w-3.5" strokeWidth={TOOLBOX_HEADER_ICON_STROKE} aria-hidden />
            ) : (
              <PinOff
                className="h-3.5 w-3.5 text-zinc-400"
                strokeWidth={TOOLBOX_HEADER_ICON_STROKE}
                aria-hidden
              />
            )}
          </span>
        </button>
      ) : null}
      {toolbarActions}
      <button
        type="button"
        className={twMerge(
          "h-6 min-w-6 rounded border-0 bg-transparent px-1 text-xs text-zinc-100 hover:bg-white/10",
          collapsed ? "pt-0.5" : null,
        )}
        onClick={toggleCollapsed}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand panel" : "Collapse panel"}
        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
      >
        <span className="inline-flex items-center justify-center text-zinc-200">
          {collapsed ? (
            <ChevronDown
              className="h-3.5 w-3.5"
              strokeWidth={TOOLBOX_HEADER_ICON_STROKE}
              aria-hidden
            />
          ) : (
            <ChevronUp
              className="h-3.5 w-3.5"
              strokeWidth={TOOLBOX_HEADER_ICON_STROKE}
              aria-hidden
            />
          )}
        </span>
      </button>
    </>
  );

  return (
    <TRNWindow
      {...rest}
      className={twMerge(
        userClassName,
        collapsed ? "overflow-hidden" : undefined,
      )}
      minHeight={minHeight}
      resizable={resizable}
      heightMode={heightMode}
      modal={modal}
      showFooter={showFooter}
      glass={glass}
      glassPreset={glassPreset}
      glassOpacity={glassOpacityEffective}
      glassBorderOpacity={glassBorderOpacityEffective}
      glassBlurPx={glassBlurEffective}
      dragEdgeSnapPx={dragEdgeSnapPx}
      persistRectStorageKey={persistRectStorageKey}
      showMaximize={false}
      headerActions={headerActions}
      shellRef={setShellRef}
      shellProps={mergedShellProps}
      showContent={!collapsed}
    >
      {collapsed ? null : children}
    </TRNWindow>
  );
}
