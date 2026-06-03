/*******************************************************************************
 * File Name        : TRNInputGroup.tsx
 *
 * Description      : Stacks multiple TRNInput rows with shared shell and dividers.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Children, Fragment, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type TRNInputGroupProps = {
  children: ReactNode;
  className?: string;
};

/** Groups ghost-variant inputs (SSID + password style) inside one rounded shell. */
export function TRNInputGroup(props: TRNInputGroupProps) {
  const { children, className } = props;
  const items = Children.toArray(children).filter((child) => child != null && child !== false);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={twMerge("overflow-hidden rounded-md bg-zinc-900/40", className)}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <div className="mx-2 border-t border-zinc-800/70" role="separator" />
          ) : null}
          {child}
        </Fragment>
      ))}
    </div>
  );
}
