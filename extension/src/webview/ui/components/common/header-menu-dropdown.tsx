import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

/**
 * Default trigger used by `GlassModalTitleBar` for the hamburger control.
 * Outside-dismiss logic skips this so toggle + dismiss do not fight.
 */
export const HEADER_MENU_TRIGGER_SELECTOR_DEFAULT =
  'button[aria-label="Menu"]';

export type UseHeaderMenuDropdownOptions = {
  /** Clicks on elements matching this selector do not dismiss (e.g. hamburger). */
  triggerSelector?: string;
};

export type UseHeaderMenuDropdownResult = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  toggle: () => void;
  close: () => void;
  menuPanelRef: RefObject<HTMLDivElement | null>;
};

/**
 * Open/close state and outside-click / Escape dismiss for a header hamburger menu.
 */
export function useHeaderMenuDropdown(
  options?: UseHeaderMenuDropdownOptions,
): UseHeaderMenuDropdownResult {
  const triggerSelector =
    options?.triggerSelector ?? HEADER_MENU_TRIGGER_SELECTOR_DEFAULT;

  const [open, setOpen] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    let removeListeners: (() => void) | undefined;

    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      const onMouseDown = (e: MouseEvent) => {
        const t = e.target;
        if (!(t instanceof Node)) {
          return;
        }
        if (t instanceof Element && t.closest(triggerSelector)) {
          return;
        }
        if (menuPanelRef.current?.contains(t)) {
          return;
        }
        setOpen(false);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", onMouseDown);
      window.addEventListener("keydown", onKeyDown);
      removeListeners = () => {
        document.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("keydown", onKeyDown);
      };
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      removeListeners?.();
    };
  }, [open, triggerSelector]);

  return useMemo(
    () => ({ open, setOpen, toggle, close, menuPanelRef }),
    [open, setOpen, toggle, close],
  );
}

export type HeaderMenuDropdownPlacement = "start" | "end";

/** Draggable glass modal shell; menu trigger is resolved inside this subtree. */
const GLASS_MODAL_ROOT_SELECTOR = "[data-glass-modal-root]";

const defaultShellClass =
  "w-full rounded-lg border border-white/10 bg-white/10 px-1 py-1 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/5";

export type HeaderMenuDropdownPanelProps = {
  open: boolean;
  menuPanelRef: RefObject<HTMLDivElement | null>;
  /**
   * Same value as `DraggableGlassModal` `panelId`. When set, the menu is portaled to
   * `document.body` so it is not clipped by the modal shell `overflow-hidden`.
   */
  glassModalPanelId?: string;
  /** `start` = align leading edge to menu button; `end` = align trailing edge (LTR: under hamburger). */
  placement?: HeaderMenuDropdownPlacement;
  /** Must match the title bar menu control (unique within the same `data-glass-modal-root`). */
  triggerSelector?: string;
  /** `aria-label` on the `role="menu"` container. */
  menuAriaLabel: string;
  children: ReactNode;
  /** Extra classes on the outer positioned wrapper. */
  className?: string;
  /** Override inner shell (border/padding). Defaults to glass panel chrome. */
  shellClassName?: string;
};

/**
 * Menu panel anchored with `position: fixed` to the header menu button inside the same
 * `[data-glass-modal-root]` as this panel (title bar trigger, body hosts the panel DOM).
 */
function queryGlassModalRootByPanelId(panelId: string): HTMLElement | null {
  return document.querySelector(
    `${GLASS_MODAL_ROOT_SELECTOR}[data-panel-id="${CSS.escape(panelId)}"]`,
  );
}

export function HeaderMenuDropdownPanel({
  open,
  menuPanelRef,
  glassModalPanelId,
  placement = "end",
  triggerSelector = HEADER_MENU_TRIGGER_SELECTOR_DEFAULT,
  menuAriaLabel,
  children,
  className,
  shellClassName,
}: HeaderMenuDropdownPanelProps) {
  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const panel = menuPanelRef.current;
    if (!panel) {
      return;
    }

    const gapPx = 6;
    const edgePx = 8;

    const updatePosition = () => {
      const root = glassModalPanelId
        ? queryGlassModalRootByPanelId(glassModalPanelId)
        : panel.closest(GLASS_MODAL_ROOT_SELECTOR);
      const trigger = root?.querySelector<HTMLElement>(triggerSelector);
      if (!trigger) {
        return;
      }
      const r = trigger.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.top = `${r.bottom + gapPx}px`;
      // Above modal shell (z-50) when portaled to document.body
      panel.style.zIndex = "10000";
      if (placement === "end") {
        panel.style.right = `${Math.max(edgePx, window.innerWidth - r.right)}px`;
        panel.style.left = "";
      } else {
        panel.style.left = `${Math.max(edgePx, r.left)}px`;
        panel.style.right = "";
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    const rootEl = glassModalPanelId
      ? queryGlassModalRootByPanelId(glassModalPanelId)
      : panel.closest(GLASS_MODAL_ROOT_SELECTOR);
    const ro = rootEl ? new ResizeObserver(updatePosition) : null;
    if (rootEl) {
      ro?.observe(rootEl);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      ro?.disconnect();
      panel.style.removeProperty("position");
      panel.style.removeProperty("top");
      panel.style.removeProperty("left");
      panel.style.removeProperty("right");
      panel.style.removeProperty("z-index");
    };
  }, [open, placement, triggerSelector, glassModalPanelId]);

  if (!open) {
    return null;
  }

  const menu = (
    <div
      ref={menuPanelRef}
      className={twMerge(
        "w-[min(16rem,calc(100vw-1rem))]",
        className,
      )}
      data-drag-handle="false"
      role="menu"
      aria-label={menuAriaLabel}
    >
      <div className={twMerge(defaultShellClass, shellClassName)}>{children}</div>
    </div>
  );

  if (glassModalPanelId) {
    return createPortal(menu, document.body);
  }

  return menu;
}
