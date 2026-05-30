import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CardProps {
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Merged with default header row classes (e.g. `py-0` to remove vertical padding). */
  headerClassName?: string;
  /** Merged with default body wrapper (`p-4`). Use `p-0` for full-bleed layouts. */
  contentClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  headerActions,
  headerClassName,
  contentClassName,
  children,
  footer,
  className = '',
}) => {
  return (
    <div
      className={`bg-card text-card-foreground rounded-lg border border-border shadow-sm ${className}`}
    >
      {title && (
        <div
          className={twMerge(
            'border-b border-border flex items-center justify-between gap-3 px-4 py-4',
            headerClassName,
          )}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 min-w-0">
            {title}
          </h3>
          {headerActions}
        </div>
      )}
      <div className={twMerge('p-4', contentClassName)}>{children}</div>
      {footer && (
        <div className="p-4 border-t border-border bg-muted/50">{footer}</div>
      )}
    </div>
  );
};
