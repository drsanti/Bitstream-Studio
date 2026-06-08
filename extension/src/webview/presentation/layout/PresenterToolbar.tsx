import { BookOpen, Crosshair, Maximize2, Presentation, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { flatSlides } from "../chapters/registry";
import { useChapterStore } from "../app/useChapterStore";
import { usePresentationPresenterStore } from "../store/usePresentationPresenterStore";

function ToolbarButton({
  label,
  hint,
  active,
  onClick,
  children,
}: {
  label: string;
  hint: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <TRNTooltip
      content={hint}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      disableHoverFx
      triggerWrapper="span"
      triggerClassName="inline-flex"
      trigger={
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[var(--text-secondary)] transition-colors ${
            active
              ? "border-[var(--accent-cyan)] bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)]"
              : "border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          {children}
        </button>
      }
    />
  );
}

export function PresenterToolbar() {
  const presentMode = usePresentationPresenterStore((s) => s.presentMode);
  const laserEnabled = usePresentationPresenterStore((s) => s.laserEnabled);
  const zoom = usePresentationPresenterStore((s) => s.zoom);
  const togglePresentMode = usePresentationPresenterStore((s) => s.togglePresentMode);
  const toggleLaser = usePresentationPresenterStore((s) => s.toggleLaser);
  const zoomIn = usePresentationPresenterStore((s) => s.zoomIn);
  const zoomOut = usePresentationPresenterStore((s) => s.zoomOut);
  const resetViewport = usePresentationPresenterStore((s) => s.resetViewport);
  const toggleFullscreen = useChapterStore((s) => s.toggleFullscreen);
  const readerOpen = useChapterStore((s) => s.readerOpen);
  const toggleReader = useChapterStore((s) => s.toggleReader);
  const slideIndex = useChapterStore((s) => s.slideIndex);
  const slideHasTheory = Boolean(flatSlides[slideIndex]?.theory);

  return (
    <div className="flex items-center gap-1.5">
      {slideHasTheory ? (
        <ToolbarButton
          label="Theory reader"
          hint="Theory reader (R) — deep-dive markdown for this slide"
          active={readerOpen}
          onClick={toggleReader}
        >
          <BookOpen size={15} strokeWidth={2} />
        </ToolbarButton>
      ) : null}
      <ToolbarButton
        label="Present mode"
        hint="Present mode (P) — hide sidebar"
        active={presentMode}
        onClick={togglePresentMode}
      >
        <Presentation size={15} strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        label="Laser pointer"
        hint="Laser pointer (L) — pauses 3D orbit while active"
        active={laserEnabled}
        onClick={toggleLaser}
      >
        <Crosshair size={15} strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton label="Zoom in" hint="Zoom in (+)" onClick={zoomIn}>
        <ZoomIn size={15} strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton label="Zoom out" hint="Zoom out (−)" onClick={zoomOut}>
        <ZoomOut size={15} strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        label="Reset zoom"
        hint={`Reset zoom (0) — ${Math.round(zoom * 100)}%`}
        onClick={resetViewport}
      >
        <RotateCcw size={14} strokeWidth={2} />
      </ToolbarButton>
      <span className="hidden text-2xs text-[var(--text-muted)] md:inline">{Math.round(zoom * 100)}%</span>
      <ToolbarButton label="Fullscreen" hint="Fullscreen (F)" onClick={toggleFullscreen}>
        <Maximize2 size={14} strokeWidth={2} />
      </ToolbarButton>
    </div>
  );
}
