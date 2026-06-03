import { Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRNHintText,
  TRNInteractiveCard,
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
} from "@/ui/TRN";
import {
  getSensorSourceDisplayLabel,
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../constants/sensorSourceIds.js";
import { useBitstreamDeviceSensorConfigStore } from "../../../state/bitstreamDeviceSensorConfig.store.js";
import { DeviceSensorConfigSummaryPanel } from "./DeviceSensorConfigSummaryPanel";

type SensorTab = "bmi270" | "dps368" | "sht40" | "bmm350";

const TAB_TO_SOURCE: Record<SensorTab, number> = {
  bmi270: SENSOR_SOURCE_ID_BMI270,
  dps368: SENSOR_SOURCE_ID_DPS368,
  sht40: SENSOR_SOURCE_ID_SHT40,
  bmm350: SENSOR_SOURCE_ID_BMM350,
};

/**
 * Read-only card: current rows in {@link useBitstreamDeviceSensorConfigStore} (UI draft / local merge).
 * Firmware SENSOR_CFG read paths are not wired in the webview yet — no Refresh action.
 */
export function DeviceSensorParametersCard(props: {
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
})
{
  const { className, collapsible = true, collapsed, onCollapsedChange } = props;
  const [tab, setTab] = useState<SensorTab>("bmi270");

  const bmi270Row = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId[SENSOR_SOURCE_ID_BMI270]);
  const dps368Row = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId[SENSOR_SOURCE_ID_DPS368]);
  const sht40Row = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId[SENSOR_SOURCE_ID_SHT40]);
  const bmm350Row = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId[SENSOR_SOURCE_ID_BMM350]);

  const subtitle = useMemo(() => {
    const rows = [bmi270Row, dps368Row, sht40Row, bmm350Row].filter(Boolean) as NonNullable<typeof bmi270Row>[];
    const verified = rows.filter((r) => r.updatedAtMs > 0);
    if (verified.length > 0) {
      const newest = verified.reduce((a, b) => (a.updatedAtMs >= b.updatedAtMs ? a : b));
      try {
        const t = new Date(newest.updatedAtMs).toLocaleString();
        return `Last merged row with updatedAtMs > 0: ${t} (${getSensorSourceDisplayLabel(newest.sourceId)})`;
      } catch {
        return "Store rows present (updatedAtMs > 0).";
      }
    }
    return "Local / UI draft only (updatedAtMs === 0). Firmware SENSOR_CFG GET is not wired here yet.";
  }, [bmi270Row, dps368Row, sht40Row, bmm350Row]);

  return (
    <TRNInteractiveCard
      title="Sensor parameters (device)"
      className={twMerge("flex h-full min-h-0 min-w-0 flex-1 flex-col", className)}
      collapsible={collapsible}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      titleLeadingSlot={<Activity className="h-4 w-4 text-zinc-500" aria-hidden />}
      contentClassName="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      collapsibleMeasureIntrinsic={false}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
        <TRNHintText tone="muted" className="mb-0 shrink-0 text-[10px] leading-snug">
          {subtitle}
        </TRNHintText>

        <TRNTabs
          value={tab}
          onValueChange={(v) => {
            if (v === "bmi270" || v === "dps368" || v === "sht40" || v === "bmm350") {
              setTab(v);
            }
          }}
          lazyMount
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden"
        >
          <TRNTabsList className="w-full shrink-0">
            <TRNTabsTrigger value="bmi270" className="flex-1">
              BMI270
            </TRNTabsTrigger>
            <TRNTabsTrigger value="bmm350" className="flex-1">
              BMM350
            </TRNTabsTrigger>
            <TRNTabsTrigger value="sht40" className="flex-1">
              SHT40
            </TRNTabsTrigger>
            <TRNTabsTrigger value="dps368" className="flex-1">
              DPS368
            </TRNTabsTrigger>
          </TRNTabsList>

          <TRNTabsContent value="bmi270" className="min-h-0 flex-1 overflow-y-auto">
            <DeviceSensorConfigSummaryPanel sensorTitle="BMI270" row={bmi270Row} />
          </TRNTabsContent>
          <TRNTabsContent value="bmm350" className="min-h-0 flex-1 overflow-y-auto">
            <DeviceSensorConfigSummaryPanel sensorTitle="BMM350" row={bmm350Row} />
          </TRNTabsContent>
          <TRNTabsContent value="sht40" className="min-h-0 flex-1 overflow-y-auto">
            <DeviceSensorConfigSummaryPanel sensorTitle="SHT40" row={sht40Row} />
          </TRNTabsContent>
          <TRNTabsContent value="dps368" className="min-h-0 flex-1 overflow-y-auto">
            <DeviceSensorConfigSummaryPanel sensorTitle="DPS368" row={dps368Row} />
          </TRNTabsContent>
        </TRNTabs>

        <TRNHintText tone="muted" className="mb-0 shrink-0 text-[9px] leading-snug">
          Read-only. Edit in Sensor settings. Source <span className="font-mono">{TAB_TO_SOURCE[tab]}</span>.
        </TRNHintText>
      </div>
    </TRNInteractiveCard>
  );
}
