import { useCallback, useEffect, useMemo, useState } from "react";
import { TRNSortableContainer, TRNSortableItem } from "@/ui/TRN";
import { SHT40DeltaThresholdCard } from "./cards/SHT40DeltaThresholdCard";
import { SHT40MinPublishIntervalCard } from "./cards/SHT40MinPublishIntervalCard";
import { SHT40OperationCard } from "./cards/SHT40OperationCard";
import { SHT40SamplingFrequencyCard } from "./cards/SHT40SamplingFrequencyCard";
import { SENSOR_SOURCE_ID_SHT40 } from "../../constants/sensorSourceIds.js";
import type { SensorConfigAckState } from "../../types/sensorConfigAck";
import type { SensorPublishMode, Sht40AckState, Sht40CardId } from "./types";
import {
  cardAckForDraftMode,
  runSensorCfgCardChange,
} from "../shared/sensorConfigPanelDraft.js";
import type { SensorCfgApplyScope } from "../../../sensor-telemetry/lib/applySensorConfigScope.js";
import { useGenericSensorCardApply } from "../../../sensor-telemetry/lib/sensorCfgGenericCardApply.js";

export function SHT40ControlPanel(props: {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  dataRateMs: number;
  onSamplingFrequencyChange: (v: number) => void;
  publishMode: SensorPublishMode;
  onPublishModeChange: (v: SensorPublishMode) => void;
  deltaX100: number;
  onDeltaX100Change: (v: number) => void;
  minPublishIntervalMs: number;
  onMinPublishIntervalMsChange: (v: number) => void;
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
  const [cardOrder, setCardOrder] = useState<Sht40CardId[]>([
    "operation",
    "sampling",
    "delta",
    "minPublish",
  ]);
  const [collapsed, setCollapsed] = useState<Record<Sht40CardId, boolean>>({
    operation: false,
    sampling: false,
    delta: false,
    minPublish: false,
  });
  const [activeAckCard, setActiveAckCard] = useState<Sht40CardId | null>(null);
  const [cardAck, setCardAck] = useState<Record<Sht40CardId, Sht40AckState>>({
    operation: { state: "idle" },
    sampling: { state: "idle" },
    delta: { state: "idle" },
    minPublish: { state: "idle" },
  });
  const toggle = useCallback((id: Sht40CardId) => setCollapsed((p) => ({ ...p, [id]: !p[id] })), []);
  const beginAck = useCallback((id: Sht40CardId) => {
    setActiveAckCard(id);
    setCardAck((p) => ({ ...p, [id]: { state: "pending", message: "Applying config..." } }));
  }, []);

  const {
    operationDirty,
    samplingDirty,
    deltaDirty,
    minPublishDirty,
    makeCardApply,
  } = useGenericSensorCardApply({
    sourceId: SENSOR_SOURCE_ID_SHT40,
    draftUntilApply,
    canApplyCard,
    applyBusy,
    applyLockedReason,
    onApplyCard,
    beginCardAck: beginAck,
  });

  const endAck = useCallback(
    (id: Sht40CardId, next: Sht40AckState) => {
      setCardAck((p) => ({ ...p, [id]: next }));
      if (
        activeAckCard === id &&
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
      endAck(activeAckCard, { state: "idle" });
      return;
    }

    if (foreignAck) {
      return;
    }

    if (ack.state !== current.state || (ack.message ?? "") !== (current.message ?? "")) {
      endAck(activeAckCard, { state: ack.state, message: ack.message });
    }
  }, [activeAckCard, ack.message, ack.sourceId, ack.state, ackSensorSourceId, cardAck, endAck]);

  const sortableCardIds = useMemo(() => {
    if (!enabled) {
      return cardOrder.filter((i) => i === "operation");
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
      onReorder={(n) => {
        if (!enabled) {
          return;
        }
        const nextIds = n as Sht40CardId[];
        const hiddenTail = cardOrder.filter((id) => !nextIds.includes(id));
        setCardOrder([...nextIds, ...hiddenTail]);
      }}
      className="flex flex-col gap-2"
    >
      {sortableCardIds.map((id) => (
        <TRNSortableItem key={id} id={id} dragFx="playful" dragFxOptions={{ normalizeScale: true, playfulScale: 1, playfulMaxRotateDeg: 3 }}>
          {id === "operation" ? (
            <SHT40OperationCard
              collapsed={collapsed.operation}
              enabled={enabled}
              publishMode={publishMode}
              controlsDisabled={operationControlsDisabled}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.operation)}
              onToggleCollapsed={() => toggle("operation")}
              onEnabledChange={(v) => {
                runSensorCfgCardChange(draftUntilApply, () => beginAck("operation"), () =>
                  onEnabledChange(v),
                );
              }}
              onPublishModeChange={(v) => {
                runSensorCfgCardChange(draftUntilApply, () => beginAck("operation"), () =>
                  onPublishModeChange(v),
                );
              }}
              cardApply={makeCardApply("operation", operationDirty)}
            />
          ) : id === "sampling" ? (
            <SHT40SamplingFrequencyCard
              collapsed={collapsed.sampling}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.sampling)}
              samplingIntervalMs={dataRateMs}
              onToggleCollapsed={() => toggle("sampling")}
              onSamplingFrequencyChange={(v) => {
                runSensorCfgCardChange(draftUntilApply, () => beginAck("sampling"), () =>
                  onSamplingFrequencyChange(v),
                );
              }}
              cardApply={makeCardApply("sampling", samplingDirty)}
            />
          ) : id === "delta" ? (
            <SHT40DeltaThresholdCard
              collapsed={collapsed.delta}
              disabled={false}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.delta)}
              deltaX100={deltaX100}
              onToggleCollapsed={() => toggle("delta")}
              onDeltaX100Change={(v) => {
                runSensorCfgCardChange(draftUntilApply, () => beginAck("delta"), () =>
                  onDeltaX100Change(v),
                );
              }}
              cardApply={makeCardApply("delta", deltaDirty)}
            />
          ) : (
            <SHT40MinPublishIntervalCard
              collapsed={collapsed.minPublish}
              disabled={false}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.minPublish)}
              minPublishIntervalMs={minPublishIntervalMs}
              onToggleCollapsed={() => toggle("minPublish")}
              onMinPublishIntervalMsChange={(v) => {
                runSensorCfgCardChange(draftUntilApply, () => beginAck("minPublish"), () =>
                  onMinPublishIntervalMsChange(v),
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
