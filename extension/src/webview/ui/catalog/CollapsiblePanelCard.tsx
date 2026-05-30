import React from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { cn } from './cn.js';

export interface CollapsiblePanelCardProps
{
  title: string;
  open: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  bodyClassName?: string;
}

/* Glass side panel with edge collapse control (Model Catalog / Model Loader). */
export function CollapsiblePanelCard({
  title,
  open,
  onToggle,
  side,
  children,
  className,
  headerLeading,
  headerTrailing,
  bodyClassName,
}: CollapsiblePanelCardProps)
{
  const CollapseIcon =
    side === 'left'
      ? open
        ? PanelLeftClose
        : PanelLeftOpen
      : open
        ? PanelRightClose
        : PanelRightOpen;

  const edgeButtonBase =
    'absolute top-1/2 -translate-y-1/2 bg-transparent backdrop-blur-none border border-transparent text-white px-2 py-4 z-100 hover:bg-white/10 hover:border-white/10 transition-all';

  const edgeButtonClass =
    side === 'left'
      ? 'right-0 rounded-r-lg translate-x-full'
      : 'left-0 rounded-l-lg -translate-x-full';

  if (!open)
  {
    return (
      <div
        className={cn('relative h-full z-100', className)}
        aria-label={`${title} collapsed`}
      >
        <button
          type="button"
          className={cn(edgeButtonBase, edgeButtonClass)}
          onClick={onToggle}
          title={`Expand ${title}`}
          aria-label={`Expand ${title}`}
        >
          <CollapseIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-full z-100 rounded-b-lg border border-white/10 bg-neutral-950/75 bg-linear-to-b from-white/10 to-transparent backdrop-blur-xl shadow-md shadow-black/30 ring-1 ring-white/8 overflow-visible flex flex-col',
        className,
      )}
    >
      <button
        type="button"
        className={cn(edgeButtonBase, edgeButtonClass)}
        onClick={onToggle}
        title={`Collapse ${title}`}
        aria-label={`Collapse ${title}`}
      >
        <CollapseIcon className="h-4 w-4" />
      </button>

      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {headerLeading ? (
            <div className="shrink-0 flex items-center">{headerLeading}</div>
          ) : null}
          <div className="text-xs font-semibold text-gray-100 truncate">
            {title}
          </div>
        </div>
        {headerTrailing ? (
          <div className="shrink-0 flex items-center">{headerTrailing}</div>
        ) : null}
      </div>

      <div
        className={cn(
          'flex-1 overflow-y-auto p-3 scrollbar-dark-small',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
