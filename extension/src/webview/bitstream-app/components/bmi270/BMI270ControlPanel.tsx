import { useCallback, useEffect, useMemo, useState } from "react";
import { TRNSortableContainer, TRNSortableItem } from "@/ui/TRN";
import { BMI270DeltaThresholdCard } from "./cards/BMI270DeltaThresholdCard";
import { BMI270FusionFeedIntervalCard } from "./cards/BMI270FusionFeedIntervalCard";
import { BMI270MinPublishIntervalCard } from "./cards/BMI270MinPublishIntervalCard";
import { BMI270OperationCard } from "./cards/BMI270OperationCard";
import { BMI270OutputProfileCard } from "./cards/BMI270OutputProfileCard";
import { BMI270SamplingFrequencyCard } from "./cards/BMI270SamplingFrequencyCard";
import { BMI270TelemetryChannelsCard } from "./cards/BMI270TelemetryChannelsCard";
import {
  bmi270DraftForOutputPreset,
  isBmi270CustomOutput,
  type Bmi270OutputPresetId,
} from "../../lib/bmi270OutputProfiles.js";
import { useBitstreamTransportActions } from "../../context/bitstreamTransportActions.context.js";
import { useBmi270FirmwareExtrasDraftStore } from "../../state/bmi270FirmwareExtrasDraft.store.js";
import type { Bmi270StreamModeUi } from "../../state/bitstreamConfig.store.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../state/bitstreamDeviceSensorConfig.store.js";
import { SENSOR_SOURCE_ID_BMI270 } from "../../constants/sensorSourceIds.js";
import type { SensorConfigAckState } from "../../types/sensorConfigAck";
import type { Bmi270AckState, Bmi270CardId, SensorPublishMode } from "./types";
import {
  cardAckForDraftMode,
  runSensorCfgCardChange,
} from "../shared/sensorConfigPanelDraft.js";
import type { SensorCfgApplyScope } from "../../../sensor-telemetry/lib/applySensorConfigScope.js";
import { sensorCfgApplyScopeLabel } from "../../../sensor-telemetry/lib/applySensorConfigScope.js";
import {
  useBmi270DeltaCardDirty,
  useBmi270FusionFeedCardDirty,
  useBmi270MinPublishCardDirty,
  useBmi270OperationCardDirty,
  useBmi270OutputProfileCardDirty,
  useBmi270SamplingCardDirty,
  useBmi270TelemetryChannelsCardDirty,
} from "../../../sensor-telemetry/lib/configPaneCardDirty.js";
import type { SensorCfgCardApplyProps } from "../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

function bmi270ScopeToCardId(scope: SensorCfgApplyScope): Bmi270CardId | null
{
  switch (scope.kind)
  {
    case "bmi270-operation":
      return "operation";
    case "bmi270-output-profile":
      return "outputProfile";
    case "bmi270-telemetry-channels":
      return "telemetryChannels";
    case "bmi270-fusion-feed":
      return "fusionFeed";
    case "bmi270-sampling":
      return "sampling";
    case "bmi270-delta":
      return "delta";
    case "bmi270-min-publish":
      return "minPublish";
    default:
      return null;
  }
}

export function BMI270ControlPanel(props: {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
  dataRateMs: number;
  onSamplingFrequencyChange: (next: number) => void;
  publishMode: SensorPublishMode;
  onPublishModeChange: (next: SensorPublishMode) => void;
  deltaX100: number;
  onDeltaX100Change: (next: number) => void;
  minPublishIntervalMs: number;
  onMinPublishIntervalMsChange: (next: number) => void;
  ack: SensorConfigAckState;
  ackSensorSourceId: number;
  fusionFeedIntervalMs: number;
  onFusionFeedIntervalChange: (next: number) => void;
  fusionFeedAck: Bmi270AckState;
  draftUntilApply?: boolean;
  mask: number;
  onMaskChange: (mask: number) => void;
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
    fusionFeedIntervalMs,
    onFusionFeedIntervalChange,
    fusionFeedAck: _fusionFeedAck,
    draftUntilApply,
    mask,
    onMaskChange,
    canApplyCard = false,
    applyBusy = false,
    applyLockedReason,
    onApplyCard,
  } = props;

  const operationDirty = useBmi270OperationCardDirty();
  const outputProfileDirty = useBmi270OutputProfileCardDirty();
  const telemetryChannelsDirty = useBmi270TelemetryChannelsCardDirty();
  const fusionFeedDirty = useBmi270FusionFeedCardDirty();
  const samplingDirty = useBmi270SamplingCardDirty();
  const deltaDirty = useBmi270DeltaCardDirty();
  const minPublishDirty = useBmi270MinPublishCardDirty();

  const cardApplyDisabled = !canApplyCard || applyBusy;

  const { declareBmi270OutputModePending, publishBmi270StreamModeUpdated } =
    useBitstreamTransportActions();
  const setBmi270StreamMode = useBitstreamConfigStore((s) => s.setBmi270StreamMode);
  const bmi270StreamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);
  const isCustomOutputProfile = isBmi270CustomOutput(mask, bmi270StreamMode);
  const appliedMask =
    useBitstreamDeviceSensorConfigStore(
      (s) =>
        s.baselineBySourceId[SENSOR_SOURCE_ID_BMI270]?.mask ??
        s.bySourceId[SENSOR_SOURCE_ID_BMI270]?.mask ??
        mask,
    ) & 0xff;
  const showFusionFeedCard = bmi270StreamMode === "fusion" || bmi270StreamMode === "hybrid";

  const operationControlsDisabled = !enabled;
  const isPeriodicMode = publishMode === 0;
  const isOnChangeMode = publishMode === 1;

  const [cardOrder, setCardOrder] = useState<Bmi270CardId[]>([
    "operation",
    "outputProfile",
    "telemetryChannels",
    "fusionFeed",
    "sampling",
    "delta",
    "minPublish",
  ]);
  const [collapsedCards, setCollapsedCards] = useState<Record<Bmi270CardId, boolean>>({
    operation: false,
    outputProfile: false,
    telemetryChannels: true,
    fusionFeed: false,
    sampling: false,
    delta: false,
    minPublish: false,
  });
  const [activeAckCard, setActiveAckCard] = useState<Bmi270CardId | null>(null);
  const [cardAck, setCardAck] = useState<
    Record<Bmi270CardId, { state: "idle" | "pending" | "ok" | "error"; message?: string }>
  >({
    operation: { state: "idle" },
    outputProfile: { state: "idle" },
    telemetryChannels: { state: "idle" },
    fusionFeed: { state: "idle" },
    sampling: { state: "idle" },
    delta: { state: "idle" },
    minPublish: { state: "idle" },
  });

  const toggleCardCollapsed = useCallback((cardId: Bmi270CardId) => {
    setCollapsedCards((previous) => ({ ...previous, [cardId]: !previous[cardId] }));
  }, []);

  const beginCardAck = useCallback((cardId: Bmi270CardId) => {
    setActiveAckCard(cardId);
    setCardAck((prev) => ({ ...prev, [cardId]: { state: "pending", message: "Applying config..." } }));
  }, []);

  const handleApplyCard = useCallback(
    (scope: SensorCfgApplyScope) => {
      const cardId = bmi270ScopeToCardId(scope);
      if (cardId != null)
      {
        beginCardAck(cardId);
      }
      onApplyCard?.(scope);
    },
    [beginCardAck, onApplyCard],
  );

  const makeCardApply = useCallback(
    (scope: SensorCfgApplyScope, dirty: boolean): SensorCfgCardApplyProps | undefined => {
      if (!draftUntilApply || onApplyCard == null)
      {
        return undefined;
      }
      return {
        dirty,
        disabled: cardApplyDisabled,
        title:
          cardApplyDisabled && applyLockedReason != null && applyLockedReason.length > 0
            ? applyLockedReason
            : sensorCfgApplyScopeLabel(scope),
        onApply: () => handleApplyCard(scope),
      };
    },
    [applyLockedReason, cardApplyDisabled, draftUntilApply, handleApplyCard, onApplyCard],
  );

  const applyStreamModeOnly = useCallback(
    (next: Bmi270StreamModeUi) => {
      if (draftUntilApply)
      {
        useBmi270FirmwareExtrasDraftStore.getState().markExtrasUserEdited();
        setBmi270StreamMode(next);
        publishBmi270StreamModeUpdated({
          bmi270StreamMode: next,
          timestampMs: Date.now(),
        });
        return;
      }
      beginCardAck("outputProfile");
      declareBmi270OutputModePending();
      setBmi270StreamMode(next);
      publishBmi270StreamModeUpdated({
        bmi270StreamMode: next,
        timestampMs: Date.now(),
      });
    },
    [
      beginCardAck,
      declareBmi270OutputModePending,
      draftUntilApply,
      publishBmi270StreamModeUpdated,
      setBmi270StreamMode,
    ],
  );

  const handlePresetSelect = useCallback(
    (presetId: Bmi270OutputPresetId) => {
      const draft = bmi270DraftForOutputPreset(presetId);
      runSensorCfgCardChange(draftUntilApply, () => beginCardAck("outputProfile"), () => {
        onMaskChange(draft.mask);
        applyStreamModeOnly(draft.streamMode);
      });
    },
    [applyStreamModeOnly, beginCardAck, draftUntilApply, onMaskChange],
  );

  const endCardAck = useCallback(
    (cardId: Bmi270CardId, next: { state: "idle" | "pending" | "ok" | "error"; message?: string }) => {
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
    if (!isCustomOutputProfile) {
      ids = ids.filter((id) => id !== "telemetryChannels");
    }
    return ids;
  }, [cardOrder, enabled, isCustomOutputProfile, isPeriodicMode]);

  return (
    <TRNSortableContainer
      itemIds={sortableCardIds}
      onReorder={(next) => {
        if (!enabled) {
          return;
        }
        const nextIds = next as Bmi270CardId[];
        const hiddenTail = cardOrder.filter((id) => !nextIds.includes(id));
        setCardOrder([...nextIds, ...hiddenTail]);
      }}
      className="flex flex-col gap-2"
    >
      {sortableCardIds.map((cardId) => (
        <TRNSortableItem key={cardId} id={cardId} dragFx="playful" dragFxOptions={{ normalizeScale: true, playfulScale: 1, playfulMaxRotateDeg: 3 }}>
          {cardId === "operation" ? (
            <BMI270OperationCard
              collapsed={collapsedCards.operation}
              enabled={enabled}
              publishMode={publishMode}
              controlsDisabled={operationControlsDisabled}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.operation)}
              onToggleCollapsed={() => toggleCardCollapsed("operation")}
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
              cardApply={makeCardApply({ kind: "bmi270-operation" }, operationDirty)}
            />
          ) : cardId === "outputProfile" ? (
            <BMI270OutputProfileCard
              collapsed={collapsedCards.outputProfile}
              controlsDisabled={operationControlsDisabled}
              mask={mask}
              streamMode={bmi270StreamMode}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.outputProfile)}
              onToggleCollapsed={() => toggleCardCollapsed("outputProfile")}
              onPresetSelect={handlePresetSelect}
              cardApply={makeCardApply({ kind: "bmi270-output-profile" }, outputProfileDirty)}
            />
          ) : cardId === "telemetryChannels" ? (
            <BMI270TelemetryChannelsCard
              collapsed={collapsedCards.telemetryChannels}
              controlsDisabled={operationControlsDisabled}
              mask={mask}
              appliedMask={appliedMask}
              maskDirty={telemetryChannelsDirty}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.telemetryChannels)}
              onToggleCollapsed={() => toggleCardCollapsed("telemetryChannels")}
              onMaskChange={(next) => {
                runSensorCfgCardChange(draftUntilApply, () => beginCardAck("telemetryChannels"), () =>
                  onMaskChange(next),
                );
              }}
              cardApply={makeCardApply({ kind: "bmi270-telemetry-channels" }, telemetryChannelsDirty)}
            />
          ) : cardId === "fusionFeed" ? (
            <BMI270FusionFeedIntervalCard
              collapsed={collapsedCards.fusionFeed}
              controlsDisabled={!showFusionFeedCard}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.fusionFeed)}
              fusionFeedIntervalMs={fusionFeedIntervalMs}
              onToggleCollapsed={() => toggleCardCollapsed("fusionFeed")}
              onFusionFeedIntervalChange={onFusionFeedIntervalChange}
              cardApply={makeCardApply({ kind: "bmi270-fusion-feed" }, fusionFeedDirty)}
            />
          ) : cardId === "sampling" ? (
            <BMI270SamplingFrequencyCard
              collapsed={collapsedCards.sampling}
              ack={cardAckForDraftMode(draftUntilApply, cardAck.sampling)}
              samplingIntervalMs={dataRateMs}
              publishMode={publishMode}
              onToggleCollapsed={() => toggleCardCollapsed("sampling")}
              onSamplingFrequencyChange={(next) => {
                runSensorCfgCardChange(draftUntilApply, () => beginCardAck("sampling"), () =>
                  onSamplingFrequencyChange(next),
                );
              }}
              cardApply={makeCardApply({ kind: "bmi270-sampling" }, samplingDirty)}
            />
          ) : cardId === "delta" ? (
            <BMI270DeltaThresholdCard
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
              cardApply={makeCardApply({ kind: "bmi270-delta" }, deltaDirty)}
            />
          ) : (
            <BMI270MinPublishIntervalCard
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
              cardApply={makeCardApply({ kind: "bmi270-min-publish" }, minPublishDirty)}
            />
          )}
        </TRNSortableItem>
      ))}
    </TRNSortableContainer>
  );
}
