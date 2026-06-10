import { Smile } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { TRNEmojiPickerPanel } from "./TRNEmojiPickerPanel";
import { TRNIconButton } from "./TRNIconButton";
import { rememberTrnEmoji } from "./trnEmojiRecent";
import {
  TRN_FLOATING_MENU_DEFAULT_MAX_HEIGHT_PX,
  TRN_FLOATING_MENU_VIEWPORT_PADDING_PX,
  resolveTrnFloatingMenuPlacement,
} from "./trn-floating-menu-placement";

const EMOJI_PANEL_WIDTH_PX = 280;
const EMOJI_PANEL_ESTIMATE_HEIGHT_PX = 320;

type EmojiMenuBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export type TRNEmojiPickerTriggerContext = {
  open: boolean;
  disabled?: boolean;
  toggle: () => void;
};

function resolveEmojiPanelHorizontal(triggerRect: DOMRect): Pick<EmojiMenuBox, "left" | "width"> {
  const panelWidth = Math.min(
    EMOJI_PANEL_WIDTH_PX,
    window.innerWidth - TRN_FLOATING_MENU_VIEWPORT_PADDING_PX * 2,
  );
  let left = triggerRect.right - panelWidth;
  left = Math.max(
    TRN_FLOATING_MENU_VIEWPORT_PADDING_PX,
    Math.min(left, window.innerWidth - panelWidth - TRN_FLOATING_MENU_VIEWPORT_PADDING_PX),
  );
  return { left, width: panelWidth };
}

export function TRNEmojiPickerPopover({
  onPick,
  disabled,
  trigger,
  hint = "Insert emoji at the text cursor",
  open: openProp,
  onOpenChange,
}: {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  trigger?:
    | ReactNode
    | ((context: TRNEmojiPickerTriggerContext) => ReactNode);
  hint?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) {
      setOpenInternal(next);
    }
  };

  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuBox, setMenuBox] = useState<EmojiMenuBox | null>(null);

  const toggle = () => {
    if (!disabled) {
      setOpen(!open);
    }
  };

  const handlePick = (emoji: string) => {
    rememberTrnEmoji(emoji);
    onPick(emoji);
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }

    const updateMenuBox = () => {
      const root = rootRef.current;
      if (root == null) {
        return;
      }
      const rect = root.getBoundingClientRect();
      const measuredHeight = menuRef.current?.offsetHeight ?? EMOJI_PANEL_ESTIMATE_HEIGHT_PX;
      const placement = resolveTrnFloatingMenuPlacement({
        triggerRect: rect,
        menuHeightPx: measuredHeight,
        maxHeightCapPx: TRN_FLOATING_MENU_DEFAULT_MAX_HEIGHT_PX,
      });
      const horizontal = resolveEmojiPanelHorizontal(rect);
      setMenuBox({
        ...horizontal,
        top: placement.top,
        maxHeight: placement.maxHeight,
      });
    };

    updateMenuBox();
    const raf = window.requestAnimationFrame(updateMenuBox);
    window.addEventListener("resize", updateMenuBox);
    window.addEventListener("scroll", updateMenuBox, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateMenuBox);
      window.removeEventListener("scroll", updateMenuBox, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (root == null) {
        return;
      }
      const target = event.target;
      if (target instanceof Node && !root.contains(target) && !(menu?.contains(target) ?? false)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerContext: TRNEmojiPickerTriggerContext = { open, disabled, toggle };
  const triggerNode =
    typeof trigger === "function" ? trigger(triggerContext) : trigger;

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const menuPanel =
    open && menuBox != null && portalTarget != null
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-10000 outline-none"
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
              maxHeight: menuBox.maxHeight,
            }}
          >
            <TRNEmojiPickerPanel
              onPick={handlePick}
              className="max-h-full w-full overflow-hidden"
            />
          </div>,
          portalTarget,
        )
      : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      {triggerNode != null ? (
        <span className="inline-flex">{triggerNode}</span>
      ) : (
        <TRNIconButton
          variant="ghost"
          className="h-6 w-6"
          icon={<Smile size={14} strokeWidth={2} aria-hidden />}
          label="Insert emoji"
          nativeTitle={false}
          hint={hint}
          disabled={disabled}
          onClick={toggle}
        />
      )}
      {menuPanel}
    </div>
  );
}
