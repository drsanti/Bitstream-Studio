import React, { useState } from "react";
import {
  Cable,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleX,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type CollapsibleCardStatus = "success" | "error" | "neutral";

export type CollapsibleCardStatusIconVariant = "default" | "websocket" | "serial";

export interface CollapsibleCardProps {
  title: string;
  /** Optional leading icon (E84 / T3D pattern). When `status` is set, status icon takes precedence. */
  icon?: LucideIcon;
  /** Optional text/node shown in the header next to the title (e.g. "COM10 @ 115200 baud"). */
  titleSupplement?: React.ReactNode;
  /**
   * Optional controls in the header row (between the title and the chevron).
   * Not part of the title toggle target — use for icon buttons, etc.
   */
  headerActions?: React.ReactNode;
  /** Extra classes on the expandable body wrapper (below the header). */
  contentClassName?: string;
  /**
   * When `false`, body is always shown, header is not a toggle, and the chevron is hidden.
   * @default true
   */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Optional connection/status indicator: Lucide icon with light green (success), light red (error), gray (neutral). */
  status?: CollapsibleCardStatus;
  /** Icon variant when status is set: default (circle icons), websocket (Globe), serial (Cable). */
  statusIconVariant?: CollapsibleCardStatusIconVariant;
  children: React.ReactNode;
  className?: string;
}

const statusConfig: Record<
  CollapsibleCardStatus,
  { Icon: LucideIcon; className: string; title: string }
> = {
  success: {
    Icon: CircleCheck,
    className: "text-green-400",
    title: "Connected",
  },
  error: {
    Icon: CircleX,
    className: "text-red-400",
    title: "Disconnected",
  },
  neutral: {
    Icon: Circle,
    className: "text-gray-400",
    title: "Unknown",
  },
};

const variantIcon: Record<CollapsibleCardStatusIconVariant, LucideIcon> = {
  default: CircleCheck,
  websocket: Globe,
  serial: Cable,
};

export function CollapsibleCard({
  title,
  icon: TitleIcon,
  titleSupplement,
  headerActions,
  contentClassName,
  collapsible = true,
  defaultOpen = true,
  status,
  statusIconVariant = "default",
  children,
  className = "",
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const statusCfg = status !== undefined ? statusConfig[status] : null;
  const StatusOrVariantIcon =
    statusCfg && statusIconVariant !== "default"
      ? variantIcon[statusIconVariant]
      : statusCfg?.Icon;

  const LeadingIcon = StatusOrVariantIcon ?? TitleIcon;
  const leadingIconClassName =
    statusCfg?.className ?? (LeadingIcon ? "text-gray-300" : "");

  const toggle = () => {
    if (collapsible) {
      setOpen((prev) => !prev);
    }
  };

  const expanded = !collapsible || open;

  const titleBlock = (
    <>
      {LeadingIcon ? (
        <span
          className="inline-flex shrink-0"
          title={statusCfg?.title}
        >
          <LeadingIcon
            className={twMerge("h-4 w-4", leadingIconClassName)}
            aria-hidden
          />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <h3 className="truncate text-sm font-medium text-gray-300">{title}</h3>
        {titleSupplement != null ? (
          <span className="min-w-0 truncate text-xs font-normal text-gray-400 sm:text-sm">
            {titleSupplement}
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      className={twMerge(
        "flex flex-col overflow-hidden rounded-md border border-white/10 bg-white/5 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex min-w-0 items-stretch">
        {collapsible ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2 px-2 py-1 text-left transition-colors hover:bg-white/5"
          >
            {titleBlock}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-left">
            {titleBlock}
          </div>
        )}
        {headerActions != null ? (
          <div
            className="flex shrink-0 items-center gap-0.5 self-center pr-0.5"
            data-collapsible-card-header-actions
          >
            {headerActions}
          </div>
        ) : null}
        {collapsible ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? "Collapse section" : "Expand section"}
            className="flex shrink-0 items-center justify-center px-1.5 py-1 text-white transition-colors hover:bg-white/5"
          >
            <ChevronDown
              className={twMerge(
                "h-4 w-4 transition-transform",
                open ? "" : "-rotate-90",
              )}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div
          className={twMerge("space-y-3 px-3 pb-3", contentClassName)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
