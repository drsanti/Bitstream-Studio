import {
  TRNDragHandle,
  TRNSortableContainer,
  TRNSortableItem,
} from "@/ui/TRN";
import { useCallback, useMemo, useState } from "react";
import {
  Bmi270FusionEulerDataView,
  Bmi270FusionQuaternionDataView,
  Bmi270RawAccelDataView,
  Bmi270RawGyroDataView,
  Bmi270RawTemperatureDataView,
} from "../bmi270/Bmi270RawDataViews";
import { BMM350DataViewer } from "../bmm350/BMM350DataViewer";
import { BMM350TemperatureDataViewer } from "../bmm350/BMM350TemperatureDataViewer";
import { DPS368DataViewer } from "../dps368/DPS368DataViewer";
import { DPS368TemperatureDataViewer } from "../dps368/DPS368TemperatureDataViewer";
import { SHT40DataViewer } from "../sht40/SHT40DataViewer";
import { TelemetryMetaCard } from "./TelemetryMetaCard";
import {
  DEFAULT_SENSOR_TELEMETRY_CARD_ORDER,
  type SensorTelemetryCardId,
} from "../../types/bitstreamWorkspaceTypes";
import type { SensorTelemetryDeckViewProps } from "../../types/sensorTelemetryDeckView";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";

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
      const hideRawSectionInFusionMode =
        bmi270TelemetryEnabled && bmi270StreamMode === "fusion";
      const mergeHidden =
        !bmi270TelemetryEnabled ||
        !dps368TelemetryEnabled ||
        !sht40TelemetryEnabled ||
        !bmm350TelemetryEnabled ||
        hideQuatEulerInRawMode ||
        hideRawSectionInFusionMode;
      if (mergeHidden) {
        const hiddenTail = cardOrder.filter((id) => {
          if (id === "meta") {
            return false;
          }
          if (!bmi270TelemetryEnabled && isBmi270OnlyTelemetryCard(id)) {
            return true;
          }
          if (!dps368TelemetryEnabled && (id === "pressure" || id === "dps368Temperature")) {
            return true;
          }
          if (!sht40TelemetryEnabled && isSht40DeckCard(id)) {
            return true;
          }
          if (!bmm350TelemetryEnabled && (id === "bmm350" || id === "bmm350Temperature")) {
            return true;
          }
          if (
            hideQuatEulerInRawMode &&
            (id === "quat" || id === "euler")
          ) {
            return true;
          }
          if (
            hideRawSectionInFusionMode &&
            isBmi270RawSectionTelemetryCard(id)
          ) {
            return true;
          }
          return false;
        });
        setCardOrder([...next, ...hiddenTail]);
      } else {
        setCardOrder(next);
      }
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

  const renderSensorTelemetryCard = (cardId: SensorTelemetryCardId) => {
    if (cardId === "meta") {
      return (
        <TelemetryMetaCard
          collapsible
          collapsed={collapsedCards.meta}
          onCollapsedChange={() => toggleCardCollapsed("meta")}
          showDragHandle
          dps368StreamCounter={telemetryMeta.dps368StreamCounter}
          bmi270StreamCounter={telemetryMeta.bmi270StreamCounter}
          sht40StreamCounter={telemetryMeta.sht40StreamCounter}
          bmm350StreamCounter={telemetryMeta.bmm350StreamCounter}
          hintDps368={telemetryMeta.hintDps368}
          hintBmi270={telemetryMeta.hintBmi270}
          hintSht40={telemetryMeta.hintSht40}
          hintBmm350={telemetryMeta.hintBmm350}
          showBmi270StreamCounter={telemetryMeta.showBmi270StreamCounter}
          showDps368StreamCounter={telemetryMeta.showDps368StreamCounter}
          showSht40StreamCounter={telemetryMeta.showSht40StreamCounter}
          showBmm350StreamCounter={telemetryMeta.showBmm350StreamCounter}
        />
      );
    }
    if (cardId === "pressure") {
      return (
        <DPS368DataViewer
          sample={dpsSample}
          samplingIntervalMs={dpsSamplingIntervalMs}
          collapsed={collapsedCards.pressure}
          onToggleCollapsed={() => toggleCardCollapsed("pressure")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "dps368Temperature") {
      return (
        <DPS368TemperatureDataViewer
          sample={dpsSample}
          samplingIntervalMs={dpsSamplingIntervalMs}
          collapsed={collapsedCards.dps368Temperature}
          onToggleCollapsed={() => toggleCardCollapsed("dps368Temperature")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "sht40Humidity") {
      return (
        <SHT40DataViewer
          variant="humidity"
          sample={sht40Sample}
          samplingIntervalMs={shtSamplingIntervalMs}
          collapsed={collapsedCards.sht40Humidity}
          onToggleCollapsed={() => toggleCardCollapsed("sht40Humidity")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "sht40Temperature") {
      return (
        <SHT40DataViewer
          variant="temperature"
          sample={sht40Sample}
          samplingIntervalMs={shtSamplingIntervalMs}
          collapsed={collapsedCards.sht40Temperature}
          onToggleCollapsed={() => toggleCardCollapsed("sht40Temperature")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "bmm350") {
      return (
        <BMM350DataViewer
          sample={bmm350Sample}
          samplingIntervalMs={bmm350SamplingIntervalMs}
          collapsed={collapsedCards.bmm350}
          onToggleCollapsed={() => toggleCardCollapsed("bmm350")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "bmm350Temperature") {
      return (
        <BMM350TemperatureDataViewer
          sample={bmm350Sample}
          samplingIntervalMs={bmm350SamplingIntervalMs}
          collapsed={collapsedCards.bmm350Temperature}
          onToggleCollapsed={() => toggleCardCollapsed("bmm350Temperature")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "gyro") {
      return (
        <Bmi270RawGyroDataView
          sample={sample}
          samplingIntervalMs={samplingIntervalMs}
          collapsed={collapsedCards.gyro}
          onToggleCollapsed={() => toggleCardCollapsed("gyro")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "accel") {
      return (
        <Bmi270RawAccelDataView
          sample={sample}
          samplingIntervalMs={samplingIntervalMs}
          collapsed={collapsedCards.accel}
          onToggleCollapsed={() => toggleCardCollapsed("accel")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "temp") {
      return (
        <Bmi270RawTemperatureDataView
          sample={sample}
          samplingIntervalMs={samplingIntervalMs}
          collapsed={collapsedCards.temp}
          onToggleCollapsed={() => toggleCardCollapsed("temp")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    if (cardId === "quat") {
      return (
        <Bmi270FusionQuaternionDataView
          sample={sample}
          samplingIntervalMs={samplingIntervalMs}
          collapsed={collapsedCards.quat}
          onToggleCollapsed={() => toggleCardCollapsed("quat")}
          dragHandleSlot={deckDragHandle}
        />
      );
    }
    return (
      <Bmi270FusionEulerDataView
        sample={sample}
        samplingIntervalMs={samplingIntervalMs}
        collapsed={collapsedCards.euler}
        onToggleCollapsed={() => toggleCardCollapsed("euler")}
        dragHandleSlot={deckDragHandle}
      />
    );
  };

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
          {renderSensorTelemetryCard(cardId)}
        </TRNSortableItem>
      ))}
    </TRNSortableContainer>
  );
}
