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
import type {
  Bmi270LiveSample,
  Bmm350LiveSample,
  Dps368LiveSample,
  SensorTelemetryCardId,
  Sht40LiveSample,
} from "../../types/bitstreamWorkspaceTypes";
import { TelemetryMetaCard } from "./TelemetryMetaCard";
import type { ReactNode } from "react";
import type { SensorDeckCardFrameProps } from "../../types/sensorDeckCardFrame";

export type SensorTelemetryCardRendererProps = {
  cardId: SensorTelemetryCardId;
  sample: Bmi270LiveSample;
  dpsSample: Dps368LiveSample;
  sht40Sample: Sht40LiveSample;
  bmm350Sample: Bmm350LiveSample;
  samplingIntervalMs: number;
  dpsSamplingIntervalMs: number;
  shtSamplingIntervalMs: number;
  bmm350SamplingIntervalMs: number;
  telemetryMeta?: {
    dps368StreamCounter: string;
    bmi270StreamCounter: string;
    sht40StreamCounter: string;
    bmm350StreamCounter: string;
    hintDps368: string;
    hintBmi270: string;
    hintSht40: string;
    hintBmm350: string;
    showBmi270StreamCounter: boolean;
    showDps368StreamCounter: boolean;
    showSht40StreamCounter: boolean;
    showBmm350StreamCounter: boolean;
  };
  /** Deck-only drag handle; omit on embedded course cards. */
  dragHandleSlot?: ReactNode;
  /** Course Studio chrome (shell, badge/settings visibility, collapse). */
  deckFrame?: Omit<SensorDeckCardFrameProps, "samplingIntervalMs">;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

/** Single telemetry deck card — shared by Sensor Telemetry deck and Course Studio blocks. */
export function SensorTelemetryCardRenderer(props: SensorTelemetryCardRendererProps) {
  const {
    cardId,
    sample,
    dpsSample,
    sht40Sample,
    bmm350Sample,
    samplingIntervalMs,
    dpsSamplingIntervalMs,
    shtSamplingIntervalMs,
    bmm350SamplingIntervalMs,
    telemetryMeta,
    dragHandleSlot,
    deckFrame,
    collapsed,
    onToggleCollapsed,
  } = props;

  const frame = deckFrame ?? {};

  if (cardId === "meta") {
    if (telemetryMeta == null) {
      return null;
    }
    return (
      <TelemetryMetaCard
        collapsible={onToggleCollapsed != null}
        collapsed={collapsed}
        onCollapsedChange={onToggleCollapsed}
        showDragHandle={dragHandleSlot != null}
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
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "dps368Temperature") {
    return (
      <DPS368TemperatureDataViewer
        sample={dpsSample}
        samplingIntervalMs={dpsSamplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "sht40Humidity") {
    return (
      <SHT40DataViewer
        variant="humidity"
        sample={sht40Sample}
        samplingIntervalMs={shtSamplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "sht40Temperature") {
    return (
      <SHT40DataViewer
        variant="temperature"
        sample={sht40Sample}
        samplingIntervalMs={shtSamplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "bmm350") {
    return (
      <BMM350DataViewer
        sample={bmm350Sample}
        samplingIntervalMs={bmm350SamplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "bmm350Temperature") {
    return (
      <BMM350TemperatureDataViewer
        sample={bmm350Sample}
        samplingIntervalMs={bmm350SamplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "gyro") {
    return (
      <Bmi270RawGyroDataView
        sample={sample}
        samplingIntervalMs={samplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "accel") {
    return (
      <Bmi270RawAccelDataView
        sample={sample}
        samplingIntervalMs={samplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "temp") {
    return (
      <Bmi270RawTemperatureDataView
        sample={sample}
        samplingIntervalMs={samplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  if (cardId === "quat") {
    return (
      <Bmi270FusionQuaternionDataView
        sample={sample}
        samplingIntervalMs={samplingIntervalMs}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        dragHandleSlot={dragHandleSlot}
        {...frame}
      />
    );
  }
  return (
    <Bmi270FusionEulerDataView
      sample={sample}
      samplingIntervalMs={samplingIntervalMs}
      collapsed={collapsed}
      onToggleCollapsed={onToggleCollapsed}
      dragHandleSlot={dragHandleSlot}
      {...frame}
    />
  );
}
