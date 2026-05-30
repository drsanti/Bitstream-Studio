import { useCallback, useEffect, useMemo, useState } from "react";
import { TRNSortableContainer, TRNSortableItem } from "@/ui/TRN";
import { BMM350DeltaThresholdCard } from "./cards/BMM350DeltaThresholdCard";
import { BMM350MinPublishIntervalCard } from "./cards/BMM350MinPublishIntervalCard";
import { BMM350OperationCard } from "./cards/BMM350OperationCard";
import { BMM350SamplingFrequencyCard } from "./cards/BMM350SamplingFrequencyCard";
import { SENSOR_SOURCE_ID_BMM350 } from "../../constants/sensorSourceIds.js";
import type { SensorConfigAckState } from "../../types/sensorConfigAck";
import type { Bmm350CardId, Bmm350AckState, SensorPublishMode } from "./types";
import {
  cardAckForDraftMode,
  runSensorCfgCardChange,
} from "../shared/sensorConfigPanelDraft.js";
import type { SensorCfgApplyScope } from "../../../sensor-telemetry/lib/applySensorConfigScope.js";
import { useGenericSensorCardApply } from "../../../sensor-telemetry/lib/sensorCfgGenericCardApply.js";

export function BMM350ControlPanel(props: {
  enabled: boolean;
  onEnabledChange: (nextValue: boolean) => void;
  dataRateMs: number;
  onSamplingFrequencyChange: (nextValue: number) => void;
  publishMode: SensorPublishMode;
  onPublishModeChange: (nextMode: SensorPublishMode) => void;
  deltaX100: number;
  onDeltaX100Change: (nextValue: number) => void;
  minPublishIntervalMs: number;
  onMinPublishIntervalMsChange: (nextValue: number) => void;
  ack: SensorConfigAckState;
  ackSensorSourceId: number;
  draftUntilApply?: boolean;
  canApplyCard?: boolean;
  applyBusy?: boolean;
  applyLockedReason?: string;
  onApplyCard?: (scope: SensorCfgApplyScope) => void;
}) {
  const {
    enabled,
    onEnabledChange,
    dataRateMs,
    onSamplingFrequencyChange,
    publishMode,
    onPublishModeChange,
    deltaX100,
    onDeltaX100Change,
    minPublishIntervalMs,
    onMinPublishIntervalMsChange,
    ack,
    ackSensorSourceId,
    draftUntilApply,
    canApplyCard = false,
    applyBusy = false,
    applyLockedReason,
    onApplyCard,
  } = props;

  const operationControlsDisabled = !enabled;
  const isPeriodicMode = publishMode === 0;
  const [cardOrder, setCardOrder] = useState<Bmm350CardId[]>([
    "operation",
    "sampling",
    "delta",
    "minPublish",
  ]);
  const [collapsedCards, setCollapsedCards] = useState<Record<Bmm350CardId, boolean>>({
    operation: false,
    sampling: false,
    delta: false,
    minPublish: false,
  });
  const [activeAckCard, setActiveAckCard] = useState<Bmm350CardId | null>(null);
  const [cardAck, setCardAck] = useState<Record<Bmm350CardId, Bmm350AckState>>({
    operation: { state: "idle" },
    sampling: { state: "idle" },
    delta: { state: "idle" },
    minPublish: { state: "idle" },
  });

  const toggleCardCollapsed = useCallback((cardId: Bmm350CardId) => {
    setCollapsedCards((previous) => ({
      ...previous,
      [cardId]: !previous[cardId],
    }));
  }, []);

  const beginCardAck = useCallback((cardId: Bmm350CardId) => {
    setActiveAckCard(cardId);
    setCardAck((prev) => ({
      ...prev,
      [cardId]: { state: "pending", message: "Applying config..." },
    }));
  }, []);

  const {
    operationDirty,
    samplingDirty,
    deltaDirty,
    minPublishDirty,
    makeCardApply,
  } = useGenericSensorCardApply({
    sourceId: SENSOR_SOURCE_ID_BMM350,
    draftUntilApply,
    canApplyCard,
    applyBusy,
    applyLockedReason,
    onApplyCard,
    beginCardAck,
  });

  const endCardAck = useCallback(
    (cardId: Bmm350CardId, next: Bmm350AckState) => {
      setCardAck((prev) => ({ ...prev, [cardId]: next }));
      if (
        activeAckCard === cardId &&
        (next.state === "ok" || next.state === "error" || next.state === "idle")
      ) {
        setActiveAckCard(null);
      }
    },
    [activeAckCard],
  );

  useEffect(() => {
    if (activeAckCard == null) {
      return;
    }
    const current = cardAck[activeAckCard];
    if (!current) {
      return;
    }
    const foreignAck =
      ack.sourceId !== undefined && ack.sourceId !== ackSensorSourceId;

    if (foreignAck && current.state === "pending") {
      endCardAck(activeAckCard, { state: "idle" });
      return;
    }

    if (foreignAck) {
      return;
    }

    if (
      ack.state !== current.state ||
      (ack.message ?? "") !== (current.message ?? "")
    ) {
      endCardAck(activeAckCard, { state: ack.state, message: ack.message });
    }
  }, [
    activeAckCard,
    ack.message,
    ack.sourceId,
    ack.state,
    ackSensorSourceId,
    cardAck,
    endCardAck,
  ]);

  const sortableCardIds = useMemo(() => {
    if (!enabled) {
      return cardOrder.filter((id) => id === "operation");
    }
    let ids = cardOrder;
    if (isPeriodicMode) {
      ids = ids.filter((id) => id !== "delta" && id !== "minPublish");
    }
    return ids;
  }, [enabled, isPeriodicMode, cardOrder]);

  return (
    <TRNSortableContainer
      itemIds={sortableCardIds}
      onReorder={(nextItemIds) => {
        if (!enabled) {
          return;
        }
        const nextIds = nextItemIds as Bmm350CardId[];
        const hiddenTail = cardOrder.filter((id) => !nextIds.includes(id));
        setCardOrder([...nextIds, ...hiddenTail]);
      }}
      className="flex flex-col gap-2"
    >
      {sortableCardIds.map((cardId) => (
        <TRNSortableItem
          key={cardId}
          id={cardId}
          dragFx="playful"
          dragFxOptions={{
            normalizeScale: true,
            playfulScale: 1,
            playfulMaxRotateDeg: 3,
          }}
        >
          {cardId === "operation" ? (
            <BMM350OperationCard
              collapsed={collapsedCards.operation}
              onToggleCollapsed={() => toggleCardCollapsed("operation")}
              enabled={enabled}
              publishMode={publishMode}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.operation)}
              controlsDisabled={operationControlsDisabled}
              onEnabledChange={(next) => {
                runSensorCfgCardChange(draftUntilApply, () => beginCardAck("operation"), () =>
                  onEnabledChange(next),
                );
              }}
              onPublishModeChange={(next) => {
                runSensorCfgCardChange(draftUntilApply, () => beginCardAck("operation"), () =>
                  onPublishModeChange(next),
                );
              }}
              cardApply={makeCardApply("operation", operationDirty)}
            />
          ) : cardId === "sampling" ? (
            <BMM350SamplingFrequencyCard
              collapsed={collapsedCards.sampling}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.sampling)}
              samplingIntervalMs={dataRateMs}
              onToggleCollapsed={() => toggleCardCollapsed("sampling")}
              onSamplingFrequencyChange={(next) => {
                runSensorCfgCardChange(draftUntilApply, () => beginCardAck("sampling"), () =>
                  onSamplingFrequencyChange(next),
                );
              }}
              cardApply={makeCardApply("sampling", samplingDirty)}
            />
          ) : cardId === "delta" ? (
            <BMM350DeltaThresholdCard
              collapsed={collapsedCards.delta}
              disabled={false}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.delta)}
              deltaX100={deltaX100}
              onToggleCollapsed={() => toggleCardCollapsed("delta")}
              onDeltaX100Change={(next) => {
                runSensorCfgCardChange(draftUntilApply, () => beginCardAck("delta"), () =>
                  onDeltaX100Change(next),
                );
              }}
              cardApply={makeCardApply("delta", deltaDirty)}
            />
          ) : (
            <BMM350MinPublishIntervalCard
              collapsed={collapsedCards.minPublish}
              disabled={false}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.minPublish)}
              minPublishIntervalMs={minPublishIntervalMs}
              onToggleCollapsed={() => toggleCardCollapsed("minPublish")}
              onMinPublishIntervalMsChange={(next) => {
                runSensorCfgCardChange(draftUntilApply, () => beginCardAck("minPublish"), () =>
                  onMinPublishIntervalMsChange(next),
                );
              }}
              cardApply={makeCardApply("minPublish", minPublishDirty)}
            />
          )}
        </TRNSortableItem>
      ))}
    </TRNSortableContainer>
  );
}
