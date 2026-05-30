import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { GlassModalBody } from "./GlassModalBody";
import { GlassModalResizeHandles } from "./GlassModalResizeHandles";
import { GlassModalTitleBar } from "./GlassModalTitleBar";
import { GLASS_MODAL_SHELL_MARGIN_PX } from "./glass-modal-constants";
import { shellGlass } from "./glass-modal-styles";
import type { DraggableGlassModalProps } from "./types";
import { useGlassModalLayout } from "./useGlassModalLayout";

/** Draggable, resizable glass modal; renders through a portal to `document.body`. */
export function DraggableGlassModal(props: DraggableGlassModalProps) {
  const {
    title,
    description,
    bodyDensity,
    icon,
    menuIcon,
    closeIcon,
    onMenuClick,
    children,
    onClose,
    className,
    panelId,
  } = props;

  const {
    mounted,
    containerRef,
    position,
    width,
    height,
    isDragging,
    handlePointerDown,
    endDrag,
    handleLostPointerCapture,
    handleResizePointerDown,
  } = useGlassModalLayout(props);

  const portalContent = (
    /* Shell: fixed position, drag/resize handlers */
    <div
      ref={containerRef}
      data-glass-modal-root
      {...(panelId ? { "data-panel-id": panelId } : {})}
      className={twMerge(
        shellGlass,
        "fixed z-50 flex flex-col",
        isDragging && "cursor-grabbing",
        className,
      )}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${width}px`,
        height: `${height}px`,
        margin: GLASS_MODAL_SHELL_MARGIN_PX,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={handleLostPointerCapture}
    >
      {/* Header */}
      <GlassModalTitleBar
        title={title}
        icon={icon}
        menuIcon={menuIcon}
        closeIcon={closeIcon}
        onMenuClick={onMenuClick}
        onClose={onClose}
        isDragging={isDragging}
      />
      {/* Body */}
      <GlassModalBody description={description} density={bodyDensity}>
        {children}
      </GlassModalBody>
      {/* Resize hit areas */}
      <GlassModalResizeHandles onResizePointerDown={handleResizePointerDown} />
    </div>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(portalContent, document.body);
}
