import {
  TRNDragHandle,
  TRNSortableContainer,
  TRNSortableItem,
} from "@/ui/TRN";
import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_SENSOR_TELEMETRY_CARD_ORDER,
  type SensorTelemetryCardId,
} from "../../types/bitstreamWorkspaceTypes";
import type { SensorTelemetryDeckViewProps } from "../../types/sensorTelemetryDeckView";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { SensorTelemetryCardRenderer } from "./SensorTelemetryCardRenderer";

function isBmi270OnlyTelemetryCard(id: SensorTelemetryCardId): boolean {
  return (
    id === "gyro" ||
    id === "accel" ||
    id === "temp" ||
    id === "quat" ||
    id === "euler"
  );
}

function isBmi270RawSectionTelemetryCard(id: SensorTelemetryCardId): boolean {
  return id === "gyro" || id === "accel" || id === "temp";
}

function isSht40DeckCard(id: SensorTelemetryCardId): boolean {
  return id === "sht40Humidity" || id === "sht40Temperature";
}

/** Right-panel sortable telemetry cards for multiple sources (BMI270, DPS368, SHT40, BMM350), not one sensor only. */
export function SensorTelemetryDeckView(props: SensorTelemetryDeckViewProps) {
  const {
    telemetryMeta,
    sample,
    dpsSample,
    sht40Sample,
    bmm350Sample,
    samplingIntervalMs,
    dpsSamplingIntervalMs,
    shtSamplingIntervalMs,
    bmm350SamplingIntervalMs,
    bmi270TelemetryEnabled = true,
    dps368TelemetryEnabled = true,
    sht40TelemetryEnabled = true,
    bmm350TelemetryEnabled = true,
  } = props;
  const bmi270StreamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);
  const [cardOrder, setCardOrder] = useState<SensorTelemetryCardId[]>(DEFAULT_SENSOR_TELEMETRY_CARD_ORDER);
  const [collapsedCards, setCollapsedCards] = useState<Record<SensorTelemetryCardId, boolean>>({
    meta: false,
    pressure: false,
    dps368Temperature: false,
    sht40Humidity: false,
    sht40Temperature: false,
    bmm350: false,
    bmm350Temperature: false,
    gyro: false,
    accel: false,
    temp: false,
    quat: false,
    euler: false,
  });
  const toggleCardCollapsed = useCallback((cardId: SensorTelemetryCardId) => {
    setCollapsedCards((previous) => ({
      ...previous,
      [cardId]: !previous[cardId],
    }));
  }, []);

  const displayCardOrder = useMemo(() => {
    return cardOrder.filter((id) => {
      if (id === "meta") {
        return true;
      }
      if (!bmi270TelemetryEnabled && isBmi270OnlyTelemetryCard(id)) {
        return false;
      }
      if (!dps368TelemetryEnabled && (id === "pressure" || id === "dps368Temperature")) {
        return false;
      }
      if (!sht40TelemetryEnabled && isSht40DeckCard(id)) {
        return false;
      }
      if (!bmm350TelemetryEnabled && (id === "bmm350" || id === "bmm350Temperature")) {
        return false;
      }
      if (
        bmi270TelemetryEnabled &&
        bmi270StreamMode === "raw" &&
        (id === "quat" || id === "euler")
      ) {
        return false;
      }
      if (
        bmi270TelemetryEnabled &&
        bmi270StreamMode === "fusion" &&
        isBmi270RawSectionTelemetryCard(id)
      ) {
        return false;
      }
      return true;
    });
  }, [
    bmi270TelemetryEnabled,
    bmi270StreamMode,
    dps368TelemetryEnabled,
    sht40TelemetryEnabled,
    bmm350TelemetryEnabled,
    cardOrder,
  ]);

  const onReorderDeck = useCallback(
    (nextItemIds: string[]) => {
      const next = nextItemIds as SensorTelemetryCardId[];
      const hideQuatEulerInRawMode =
        bmi270TelemetryEnabled && bmi270StreamMode === "raw";
      const hideRawSectionsInFusionMode =
        bmi270TelemetryEnabled && bmi270StreamMode === "fusion";
      const hidden = cardOrder.filter((id) => !next.includes(id));
      const restored = hidden.filter((id) => {
        if (id === "meta") {
          return true;
        }
        if (!bmi270TelemetryEnabled && isBmi270OnlyTelemetryCard(id)) {
          return false;
        }
        if (!dps368TelemetryEnabled && (id === "pressure" || id === "dps368Temperature")) {
          return false;
        }
        if (!sht40TelemetryEnabled && isSht40DeckCard(id)) {
          return false;
        }
        if (!bmm350TelemetryEnabled && (id === "bmm350" || id === "bmm350Temperature")) {
          return false;
        }
        if (hideQuatEulerInRawMode && (id === "quat" || id === "euler")) {
          return false;
        }
        if (hideRawSectionsInFusionMode && isBmi270RawSectionTelemetryCard(id)) {
          return false;
        }
        return true;
      });
      setCardOrder([...next, ...restored]);
    },
    [
      bmi270TelemetryEnabled,
      bmi270StreamMode,
      dps368TelemetryEnabled,
      sht40TelemetryEnabled,
      bmm350TelemetryEnabled,
      cardOrder,
    ],
  );

  const deckDragHandle = (
    <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
  );

  return (
    <TRNSortableContainer
      itemIds={displayCardOrder}
      onReorder={onReorderDeck}
      className="flex flex-col gap-2"
    >
      {displayCardOrder.map((cardId) => (
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
          <SensorTelemetryCardRenderer
            cardId={cardId}
            sample={sample}
            dpsSample={dpsSample}
            sht40Sample={sht40Sample}
            bmm350Sample={bmm350Sample}
            samplingIntervalMs={samplingIntervalMs}
            dpsSamplingIntervalMs={dpsSamplingIntervalMs}
            shtSamplingIntervalMs={shtSamplingIntervalMs}
            bmm350SamplingIntervalMs={bmm350SamplingIntervalMs}
            telemetryMeta={telemetryMeta}
            collapsed={collapsedCards[cardId]}
            onToggleCollapsed={() => toggleCardCollapsed(cardId)}
            dragHandleSlot={deckDragHandle}
          />
        </TRNSortableItem>
      ))}
    </TRNSortableContainer>
  );
}
