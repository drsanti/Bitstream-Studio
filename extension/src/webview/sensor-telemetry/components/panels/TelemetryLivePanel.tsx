/*******************************************************************************
 * File Name : TelemetryLivePanel.tsx
 *
 * Description : Right workbench pane — telemetry deck and UI settings tabs.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState } from "react";
import { TRNTabs, TRNTabsContent, TRNTabsList, TRNTabsTrigger } from "../../../ui/TRN";
import { SensorTelemetryDeckView } from "../../../bitstream-app/components/telemetry/SensorTelemetryDeckView.js";
import { BitstreamRealtimeTelemetryUiSettingsWindow } from "../../../bitstream-app/components/telemetry/BitstreamRealtimeTelemetryUiSettingsWindow.js";
import {
  TELEMETRY_META_HINT_BMI270_SAMPLE_COUNTER,
  TELEMETRY_META_HINT_BMM350_SAMPLE_COUNTER,
  TELEMETRY_META_HINT_DPS368_SAMPLE_COUNTER,
  TELEMETRY_META_HINT_SHT40_SAMPLE_COUNTER,
} from "../../../bitstream-app/constants/telemetryMetaHints.js";
import { mergeBmi270SampleCache } from "../../../bitstream-app/bmi270/bmi270SampleCache.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../bitstream-app/constants/sensorSourceIds.js";
import { useBitstreamDeviceSensorConfigStore } from "../../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamLiveStore } from "../../../bitstream-app/state/bitstreamLive.store.js";
import type { Bmi270SampleCacheState } from "../../../bitstream-app/types/bitstreamWorkspaceTypes.js";

const RIGHT_TELEMETRY_TAB_STORAGE_KEY = "bitstream-app:right-telemetry:active-tab";

type RightTelemetryTabId = "telemetry-data" | "telemetry-settings";

function readSavedTelemetryTab(): RightTelemetryTabId
{
  try
  {
    const saved = window.localStorage.getItem(RIGHT_TELEMETRY_TAB_STORAGE_KEY);
    if (saved === "telemetry-settings")
    {
      return "telemetry-settings";
    }
  }
  catch
  {
    /* ignore */
  }
  return "telemetry-data";
}

function streamCounter(sample: { counter?: number } | null | undefined): string
{
  return typeof sample?.counter === "number" ? String(sample.counter) : "--";
}

function sensorPanelsLive(enabled: boolean | undefined): boolean
{
  return enabled ?? true;
}

/**
 * Sortable telemetry deck (BMI270, DPS368, SHT40, BMM350) with settings tab.
 */
export function TelemetryLivePanel()
{
  const [activeTab, setActiveTab] = useState<RightTelemetryTabId>(readSavedTelemetryTab);

  useEffect(() =>
  {
    try
    {
      window.localStorage.setItem(RIGHT_TELEMETRY_TAB_STORAGE_KEY, activeTab);
    }
    catch
    {
      /* ignore */
    }
  }, [activeTab]);

  const latestByHint = useBitstreamLiveStore((s) => s.latestByHint);
  const bySourceId = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId);

  const bmi270Row = bySourceId[SENSOR_SOURCE_ID_BMI270];
  const dps368Row = bySourceId[SENSOR_SOURCE_ID_DPS368];
  const sht40Row = bySourceId[SENSOR_SOURCE_ID_SHT40];
  const bmm350Row = bySourceId[SENSOR_SOURCE_ID_BMM350];

  const bmi270Sample = latestByHint.bmi270;
  const dps368Sample = latestByHint.dps368;
  const sht40Sample = latestByHint.sht40;
  const bmm350Sample = latestByHint.bmm350;

  const bmi270PanelsLive = sensorPanelsLive(bmi270Row?.enabled);
  const dps368PanelsLive = sensorPanelsLive(dps368Row?.enabled);
  const sht40PanelsLive = sensorPanelsLive(sht40Row?.enabled);
  const bmm350PanelsLive = sensorPanelsLive(bmm350Row?.enabled);

  const bmi270CacheRef = useRef<Bmi270SampleCacheState | null>(null);
  bmi270CacheRef.current = mergeBmi270SampleCache(
    bmi270CacheRef.current,
    bmi270Sample ?? undefined,
    Date.now(),
  );
  const mergedBmi270Sample = bmi270CacheRef.current?.sample ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-1">
      <TRNTabs
        value={activeTab}
        onValueChange={(next) =>
        {
          if (next === "telemetry-data" || next === "telemetry-settings")
          {
            setActiveTab(next);
          }
        }}
        lazyMount
        className="flex h-full min-h-0 flex-col gap-1"
      >
        <TRNTabsList className="inline-flex w-full shrink-0 gap-1">
          <TRNTabsTrigger value="telemetry-data" className="flex-1">
            Telemetry Data
          </TRNTabsTrigger>
          <TRNTabsTrigger value="telemetry-settings" className="flex-1">
            Settings
          </TRNTabsTrigger>
        </TRNTabsList>

        <TRNTabsContent value="telemetry-data" className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto">
            <SensorTelemetryDeckView
              telemetryMeta={{
                dps368StreamCounter: streamCounter(dps368Sample),
                bmi270StreamCounter: streamCounter(bmi270Sample),
                sht40StreamCounter: streamCounter(sht40Sample),
                bmm350StreamCounter: streamCounter(bmm350Sample),
                hintDps368: TELEMETRY_META_HINT_DPS368_SAMPLE_COUNTER,
                hintBmi270: TELEMETRY_META_HINT_BMI270_SAMPLE_COUNTER,
                hintSht40: TELEMETRY_META_HINT_SHT40_SAMPLE_COUNTER,
                hintBmm350: TELEMETRY_META_HINT_BMM350_SAMPLE_COUNTER,
                showBmi270StreamCounter: bmi270PanelsLive,
                showDps368StreamCounter: dps368PanelsLive,
                showSht40StreamCounter: sht40PanelsLive,
                showBmm350StreamCounter: bmm350PanelsLive,
              }}
              sample={mergedBmi270Sample}
              dpsSample={dps368Sample}
              sht40Sample={sht40Sample}
              bmm350Sample={bmm350Sample}
              samplingIntervalMs={bmi270Row?.samplingIntervalMs ?? 25}
              dpsSamplingIntervalMs={dps368Row?.samplingIntervalMs ?? 1000}
              shtSamplingIntervalMs={sht40Row?.samplingIntervalMs ?? 500}
              bmm350SamplingIntervalMs={bmm350Row?.samplingIntervalMs ?? 50}
              bmi270TelemetryEnabled={bmi270PanelsLive}
              dps368TelemetryEnabled={dps368PanelsLive}
              sht40TelemetryEnabled={sht40PanelsLive}
              bmm350TelemetryEnabled={bmm350PanelsLive}
            />
          </div>
        </TRNTabsContent>

        <TRNTabsContent value="telemetry-settings" className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BitstreamRealtimeTelemetryUiSettingsWindow />
        </TRNTabsContent>
      </TRNTabs>
    </div>
  );
}
