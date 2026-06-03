import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { GitBranch, Route, Trash2, X } from "lucide-react";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../../../../ui/TRN/TRNMenu";
import { formatFlowPortTypeLabel } from "../edges/flow-edge-port-label";

export type FlowEdgeContextMenuProps = {
  clientX: number;
  clientY: number;
  edgeId: string;
  portTypeLabel: string;
  pathHighlightActive: boolean;
  onInsertReroute: () => void;
  onDeleteWire: () => void;
  onHighlightDownstream: () => void;
  onClearPathHighlight: () => void;
  onClose: () => void;
};

function clampMenuPosition(clientX: number, clientY: number) {
  const menuWidth = 220;
  const menuHeight = 168;
  const pad = 8;
  const maxLeft = Math.max(pad, window.innerWidth - menuWidth - pad);
  const maxTop = Math.max(pad, window.innerHeight - menuHeight - pad);
  return {
    left: Math.min(Math.max(pad, clientX), maxLeft),
    top: Math.min(Math.max(pad, clientY), maxTop),
  };
}

export function FlowEdgeContextMenu(props: FlowEdgeContextMenuProps) {
  const {
    clientX,
    clientY,
    edgeId,
    portTypeLabel,
    pathHighlightActive,
    onInsertReroute,
    onDeleteWire,
    onHighlightDownstream,
    onClearPathHighlight,
    onClose,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const position = clampMenuPosition(clientX, clientY);
  const typeLabel = formatFlowPortTypeLabel(portTypeLabel);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target != null && containerRef.current?.contains(target)) {
        return;
      }
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onClose]);

  const menu = (
    <div
      ref={containerRef}
      className="fixed z-[120] min-w-[200px]"
      style={{ left: position.left, top: position.top }}
      role="presentation"
      onContextMenu={(event) => event.preventDefault()}
    >
      <TRNMenuPanel tone="glass-dropdown" className="shadow-2xl shadow-black/80">
        <div className="flex flex-col gap-0.5" role="menu">
          <TRNMenuSectionTitle spacing="menuFirst">Wire</TRNMenuSectionTitle>
          <div className="px-2 pb-1 text-[11px] leading-snug text-zinc-400">
            <span className="text-zinc-500">Type </span>
            <span className="font-medium text-zinc-200">{typeLabel || "—"}</span>
            <span className="text-zinc-600"> · </span>
            <span className="text-[10px] text-zinc-500">{edgeId}</span>
          </div>
          <TRNMenuItemButton
            role="menuitem"
            icon={<GitBranch className="size-3.5 opacity-90" aria-hidden />}
            label="Insert reroute here"
            onClick={() => {
              onInsertReroute();
              onClose();
            }}
          />
          <TRNMenuItemButton
            role="menuitem"
            icon={<Route className="size-3.5 opacity-90" aria-hidden />}
            label={
              pathHighlightActive ? "Refresh downstream highlight" : "Highlight downstream"
            }
            onClick={() => {
              onHighlightDownstream();
              onClose();
            }}
          />
          {pathHighlightActive ? (
            <TRNMenuItemButton
              role="menuitem"
              icon={<X className="size-3.5 opacity-90" aria-hidden />}
              label="Clear path highlight"
              onClick={() => {
                onClearPathHighlight();
                onClose();
              }}
            />
          ) : null}
          <TRNMenuItemButton
            role="menuitem"
            icon={<Trash2 className="size-3.5 opacity-90" aria-hidden />}
            label="Delete wire"
            onClick={() => {
              onDeleteWire();
              onClose();
            }}
          />
        </div>
      </TRNMenuPanel>
    </div>
  );

  return createPortal(menu, document.body);
}
