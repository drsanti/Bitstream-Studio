/*******************************************************************************
 * File Name : SensorCfgCardHeaderTrailing.tsx
 *
 * Description : Card header trailing row — apply icon + transient ack badge.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { TRNTransientStatusBadge } from "../../../ui/TRN";
import { SensorCfgCardApplyIcon } from "./SensorCfgCardApplyIcon.js";

type AckState = {
  state: "idle" | "pending" | "ok" | "error";
  message?: string;
};

export type SensorCfgCardApplyProps = {
  dirty: boolean;
  disabled?: boolean;
  title?: string;
  onApply: () => void;
};

export function SensorCfgCardHeaderTrailing(props: {
  dirty: boolean;
  applyDisabled?: boolean;
  applyTitle?: string;
  onApply?: () => void;
  ack: AckState;
})
{
  const { dirty, applyDisabled, applyTitle, onApply, ack } = props;

  return (
    <div className="inline-flex shrink-0 items-center gap-1.5">
      {onApply != null ? (
        <SensorCfgCardApplyIcon
          dirty={dirty}
          disabled={applyDisabled}
          title={applyTitle}
          onApply={onApply}
        />
      ) : null}
      <TRNTransientStatusBadge state={ack.state} message={ack.message} />
    </div>
  );
}
