/*******************************************************************************
 * File Name : SensorCfgTabTrigger.tsx
 *
 * Description : Sensor tab trigger with optional unsaved-draft indicator dot.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { TRNTabsTrigger } from "../../ui/TRN";

/** Tab label with amber dot when the sensor cfg draft differs from baseline. */
export function SensorCfgTabTrigger(props: {
  value: string;
  label: string;
  dirty?: boolean;
  className?: string;
})
{
  const { value, label, dirty, className } = props;

  return (
    <TRNTabsTrigger value={value} className={className}>
      <span className="inline-flex min-w-0 items-center justify-center gap-1">
        {dirty ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-amber-400"
            aria-hidden
            title="Unsaved changes"
          />
        ) : null}
        <span className="truncate">{label}</span>
      </span>
    </TRNTabsTrigger>
  );
}
