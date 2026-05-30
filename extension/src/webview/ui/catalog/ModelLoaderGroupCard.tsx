import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from './cn.js';

export interface ModelLoaderGroupCardProps
{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/* Collapsible glass section for Model Loader dashboard groups. */
export function ModelLoaderGroupCard({
  title,
  defaultOpen = true,
  children,
  className,
  contentClassName,
}: ModelLoaderGroupCardProps)
{
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'rounded-lg border border-white/10 bg-neutral-950/75 backdrop-blur-xl overflow-hidden shadow-md shadow-black/30 ring-1 ring-black/25 transition-colors duration-200 hover:border-white/15',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10 transition-colors duration-200"
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-300 shrink-0 transition-transform duration-200" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 transition-transform duration-200" />
        )}
        <span className="text-xs font-semibold tracking-wide text-gray-100">
          {title}
        </span>
      </button>
      {open ? (
        <div
          className={cn(
            'p-3 space-y-3 transition-opacity duration-200 opacity-100',
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
