import React, { useState } from 'react';
import { ChevronDown, GripVertical, Zap, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn.js';

export type ParameterBadgeType = 'runtime' | 'rebuild' | 'mixed';

export interface ParameterBadge
{
  type: ParameterBadgeType;
  runtimeCount?: number;
  rebuildCount?: number;
}

export interface InspectorCollapsibleCardProps
{
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  badge?: ParameterBadge;
}

/* Sortable inspector card with icon header and optional drag handle. */
export function InspectorCollapsibleCard({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
  isExpanded: controlledIsExpanded,
  onToggle,
  onExpand,
  onCollapse,
  dragHandleProps,
  isDragging = false,
  badge,
}: InspectorCollapsibleCardProps)
{
  const [internalIsExpanded, setInternalIsExpanded] = useState(defaultExpanded);

  const isExpanded =
    controlledIsExpanded !== undefined
      ? controlledIsExpanded
      : internalIsExpanded;
  const setIsExpanded = onToggle || setInternalIsExpanded;

  const handleToggle = () =>
  {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    if (newExpandedState && onExpand)
    {
      onExpand();
    }
    else if (!newExpandedState && onCollapse)
    {
      onCollapse();
    }
  };

  const handleDragHandleClick = (e: React.MouseEvent) =>
  {
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        'bg-white/5 border border-white/10 backdrop-blur-sm rounded-md',
        isDragging && 'opacity-50',
      )}
    >
      <div
        className="cursor-pointer select-none py-1 px-2"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                onClick={handleDragHandleClick}
                className="cursor-grab active:cursor-grabbing mr-1 text-gray-400 hover:text-gray-300 transition-colors shrink-0"
                data-drag-handle="true"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
            <Icon className="h-4 w-4 text-gray-300 shrink-0" />
            <h3
              className="text-sm font-medium truncate"
              style={{ color: 'var(--color-gray-300)' }}
            >
              {title}
            </h3>
            {badge && (
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {badge.type === 'runtime' || badge.type === 'mixed' ? (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    title="Runtime: Applies immediately"
                  >
                    <Zap className="h-3 w-3" />
                    <span>Live</span>
                  </span>
                ) : null}
                {badge.type === 'rebuild' || badge.type === 'mixed' ? (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    title="Rebuild Required: Click Rebuild Vehicle to apply"
                  >
                    <Wrench className="h-3 w-3" />
                    <span>Rebuild</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-white transition-transform shrink-0',
              isExpanded ? '' : '-rotate-90',
            )}
          />
        </div>
      </div>
      {isExpanded && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

/** Alias used by model-catalog preview cards (T3D `CollapsibleCard` API). */
export const CollapsibleCard = InspectorCollapsibleCard;
export type CollapsibleCardProps = InspectorCollapsibleCardProps;
