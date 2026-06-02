import { type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type TRNCardHeaderProps = {
  title: ReactNode;
  leadingSlot?: ReactNode;
  trailingSlot?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function TRNCardHeader({
  title,
  leadingSlot,
  trailingSlot,
  className = "",
  titleClassName = "",
}: TRNCardHeaderProps) {
  return (
    <div
      data-trn-card-header
      className={twMerge(
        "mb-1 flex min-w-0 items-center justify-between gap-2",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {leadingSlot != null ? (
          <span className="inline-flex shrink-0 items-center">{leadingSlot}</span>
        ) : null}
        <span
          className={
            "inline-flex h-5 min-w-0 items-center truncate text-xs font-semibold leading-none normal-case tracking-normal text-zinc-100 " +
            titleClassName
          }
        >
          {title}
        </span>
      </div>
      <div className="inline-flex shrink-0 items-center gap-1.5">
        {trailingSlot != null ? trailingSlot : null}
      </div>
    </div>
  );
}
