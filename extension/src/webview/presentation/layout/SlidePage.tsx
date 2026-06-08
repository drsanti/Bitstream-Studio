import type { ReactNode } from "react";
import { SlideHeading } from "./SlideHeading";
import type { SlidePageProps } from "./slide-layout.types";

function SlideFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="presentation-slide-footer shrink-0 text-2xs text-[var(--text-muted)]">{children}</footer>
  );
}

export function SlidePage({
  layout,
  heading,
  footer,
  main,
  visual,
  scene,
  children,
  className = "",
}: SlidePageProps) {
  const layoutClass = `presentation-slide-page presentation-slide-page--${layout}`;

  if (layout === "immersive") {
    return (
      <div className={`${layoutClass} ${className}`}>
        <div className="presentation-slide-page__immersive">{children ?? main}</div>
      </div>
    );
  }

  if (layout === "hero-title") {
    return (
      <div className={`${layoutClass} ${className}`}>
        <div className="presentation-slide-page__hero-copy">
          {heading ? <SlideHeading {...heading} /> : null}
          {main}
        </div>
        {visual ? <div className="presentation-slide-page__hero-visual">{visual}</div> : null}
        {footer ? <SlideFooter>{footer}</SlideFooter> : null}
      </div>
    );
  }

  if (layout === "demo-rail") {
    return (
      <div className={`${layoutClass} ${className}`}>
        <div className="presentation-slide-page__rail-main">
          {heading ? <SlideHeading {...heading} /> : null}
          <div className="presentation-slide-page__body min-h-0 flex-1">{children ?? main}</div>
          {footer ? <SlideFooter>{footer}</SlideFooter> : null}
        </div>
        {scene ? <div className="presentation-slide-page__rail-scene">{scene}</div> : null}
      </div>
    );
  }

  if (layout === "split-50" || layout === "split-40-60" || layout === "split-60-40") {
    return (
      <div className={`${layoutClass} ${className}`}>
        <div className="presentation-slide-page__split-copy">
          {heading ? <SlideHeading {...heading} /> : null}
          <div className="presentation-slide-page__body min-h-0 flex-1">{children ?? main}</div>
          {footer ? <SlideFooter>{footer}</SlideFooter> : null}
        </div>
        {visual ? <div className="presentation-slide-page__split-visual">{visual}</div> : null}
      </div>
    );
  }

  if (layout === "full-center") {
    return (
      <div className={`${layoutClass} ${className}`}>
        <div className="presentation-slide-page__center">
          {heading ? <SlideHeading {...heading} /> : null}
          <div className="presentation-slide-page__body">{children ?? main}</div>
          {footer ? <SlideFooter>{footer}</SlideFooter> : null}
        </div>
      </div>
    );
  }

  if (layout === "grid-2x2" || layout === "grid-2x3") {
    return (
      <div className={`${layoutClass} ${className}`}>
        {heading ? <SlideHeading {...heading} /> : null}
        <div className="presentation-slide-page__body presentation-slide-page__grid min-h-0 flex-1">
          {children ?? main}
        </div>
        {footer ? <SlideFooter>{footer}</SlideFooter> : null}
      </div>
    );
  }

  // stack | table-focus (default single column)
  return (
    <div className={`${layoutClass} ${className}`}>
      {heading ? <SlideHeading {...heading} /> : null}
      <div className="presentation-slide-page__body min-h-0 flex-1">{children ?? main}</div>
      {footer ? <SlideFooter>{footer}</SlideFooter> : null}
    </div>
  );
}
