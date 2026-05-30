/*******************************************************************************
 * File Name : sensorCfgGenericCardApply.ts
 *
 * Description : Shared card-scoped apply helpers for non-BMI270 sensor panels.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback } from "react";
import type { SensorCfgCardApplyProps } from "../components/panels/SensorCfgCardHeaderTrailing.js";
import {
  sensorCfgApplyScopeLabel,
  type SensorCfgApplyScope,
} from "./applySensorConfigScope.js";
import {
  useSensorDeltaCardDirty,
  useSensorMinPublishCardDirty,
  useSensorOperationCardDirty,
  useSensorSamplingCardDirty,
} from "./configPaneCardDirty.js";

export type GenericSensorCardId = "operation" | "sampling" | "delta" | "minPublish";

/** Map a generic sensor card to BS2 apply scope. */
export function genericSensorApplyScope(
  sourceId: number,
  cardId: GenericSensorCardId,
): SensorCfgApplyScope
{
  switch (cardId)
  {
    case "operation":
      return { kind: "sensor-operation", sourceId };
    case "sampling":
      return { kind: "sensor-sampling", sourceId };
    case "delta":
      return { kind: "sensor-delta", sourceId };
    case "minPublish":
      return { kind: "sensor-min-publish", sourceId };
  }
}

/** Dirty flags + makeCardApply for DPS368 / SHT40 / BMM350 control panels. */
export function useGenericSensorCardApply(args: {
  sourceId: number;
  draftUntilApply?: boolean;
  canApplyCard?: boolean;
  applyBusy?: boolean;
  applyLockedReason?: string;
  onApplyCard?: (scope: SensorCfgApplyScope) => void;
  beginCardAck: (cardId: GenericSensorCardId) => void;
})
{
  const {
    sourceId,
    draftUntilApply,
    canApplyCard = false,
    applyBusy = false,
    applyLockedReason,
    onApplyCard,
    beginCardAck,
  } = args;

  const operationDirty = useSensorOperationCardDirty(sourceId);
  const samplingDirty = useSensorSamplingCardDirty(sourceId);
  const deltaDirty = useSensorDeltaCardDirty(sourceId);
  const minPublishDirty = useSensorMinPublishCardDirty(sourceId);

  const cardApplyDisabled = !canApplyCard || applyBusy;

  const handleApplyCard = useCallback(
    (scope: SensorCfgApplyScope, cardId: GenericSensorCardId) => {
      beginCardAck(cardId);
      onApplyCard?.(scope);
    },
    [beginCardAck, onApplyCard],
  );

  const makeCardApply = useCallback(
    (cardId: GenericSensorCardId, dirty: boolean): SensorCfgCardApplyProps | undefined => {
      if (!draftUntilApply || onApplyCard == null)
      {
        return undefined;
      }
      const scope = genericSensorApplyScope(sourceId, cardId);
      const applyTitle =
        cardApplyDisabled && applyLockedReason != null && applyLockedReason.length > 0
          ? applyLockedReason
          : sensorCfgApplyScopeLabel(scope);
      return {
        dirty,
        disabled: cardApplyDisabled,
        title: applyTitle,
        onApply: () => handleApplyCard(scope, cardId),
      };
    },
    [
      applyLockedReason,
      cardApplyDisabled,
      draftUntilApply,
      handleApplyCard,
      onApplyCard,
      sourceId,
    ],
  );

  return {
    operationDirty,
    samplingDirty,
    deltaDirty,
    minPublishDirty,
    makeCardApply,
  };
}
