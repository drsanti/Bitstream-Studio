import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { TRNGlassPreset } from "./TRNCard.js";

export type TRNSectionContainerProps = {
  title: string;
  /** Icon or badge rendered before the title text (same row). */
  titleLeadingSlot?: ReactNode;
  /** Actions or meta rendered after the title (same row, end-aligned). */
  titleTrailingSlot?: ReactNode;
  /** Tailwind classes merged onto the title `<span>` (default: uppercase section caption). */
  headerTitleClassName?: string;
  children?: ReactNode;
  className?: string;
  glass?: boolean;
  glassPreset?: TRNGlassPreset;
};

export function TRNSectionContainer(props: TRNSectionContainerProps) {
  const {
    title,
    titleLeadingSlot,
    titleTrailingSlot,
    headerTitleClassName,
    children,
    className,
    glass = false,
    glassPreset = "medium",
  } = props;
  const shellGlassClass =
    glassPreset === "soft"
      ? "border-zinc-700/85 bg-zinc-900/72 backdrop-blur-sm"
      : glassPreset === "strong"
        ? "border-zinc-700/70 bg-zinc-900/32 backdrop-blur-lg"
        : "border-zinc-700/80 bg-zinc-900/55 backdrop-blur-md";
  const showToolbarHeader =
    titleLeadingSlot != null || titleTrailingSlot != null || headerTitleClassName != null;

  return (
    <section
      className={twMerge(
        "flex h-full min-h-0 flex-col rounded-md border p-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        glass ? shellGlassClass : "border-zinc-700/80 bg-zinc-950/85",
        className,
      )}
    >
      {showToolbarHeader ? (
        <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {titleLeadingSlot != null ? (
              <span className="inline-flex shrink-0 items-center">{titleLeadingSlot}</span>
            ) : null}
            <span
              className={twMerge(
                "min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-zinc-400",
                headerTitleClassName,
              )}
            >
              {title}
            </span>
          </div>
          {titleTrailingSlot != null ? (
            <div className="inline-flex shrink-0 items-center">{titleTrailingSlot}</div>
          ) : null}
        </div>
      ) : (
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
