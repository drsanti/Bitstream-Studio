import { Activity, Gauge, Settings, type LucideIcon } from "lucide-react";
import { TRNInspectorContextBar } from "../../../ui/TRN";
import { getSensorSourceDisplayLabel } from "../../../bitstream-app/constants/sensorSourceIds.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../bitstream-app/constants/sensorSourceIds.js";

const CONFIG_TAB_META: Record<
  "bmi270" | "dps368" | "sht40" | "bmm350",
  { sourceId: number; icon: LucideIcon; shell: string }
> = {
  bmi270: {
    sourceId: SENSOR_SOURCE_ID_BMI270,
    icon: Gauge,
    shell: "border-violet-500/30 bg-violet-950/25 text-violet-300/95",
  },
  bmm350: {
    sourceId: SENSOR_SOURCE_ID_BMM350,
    icon: Gauge,
    shell: "border-cyan-500/30 bg-cyan-950/25 text-cyan-300/95",
  },
  sht40: {
    sourceId: SENSOR_SOURCE_ID_SHT40,
    icon: Gauge,
    shell: "border-emerald-500/30 bg-emerald-950/25 text-emerald-300/95",
  },
  dps368: {
    sourceId: SENSOR_SOURCE_ID_DPS368,
    icon: Gauge,
    shell: "border-sky-500/30 bg-sky-950/25 text-sky-300/95",
  },
};

export function TelemetryConfigInspectorContextBar(props: {
  activeTab: "bmi270" | "dps368" | "sht40" | "bmm350";
  dirty: boolean;
  canControl: boolean;
}) {
  const { activeTab, dirty, canControl } = props;
  const meta = CONFIG_TAB_META[activeTab];
  const label = getSensorSourceDisplayLabel(meta.sourceId);
  const parts = [canControl ? "Draft until Apply" : "Read-only"];
  if (dirty) {
    parts.push("unsaved changes");
  }

  return (
    <TRNInspectorContextBar
      title={label}
      subtitle={parts.join(" · ")}
      icon={meta.icon}
      iconShellClass={meta.shell}
    />
  );
}

export function TelemetryLiveInspectorContextBar(props: {
  activeTab: "telemetry-data" | "telemetry-settings";
  livePanelCount: number;
}) {
  const { activeTab, livePanelCount } = props;

  if (activeTab === "telemetry-settings") {
    return (
      <TRNInspectorContextBar
        title="Settings"
        subtitle="Deck layout, gauge chrome, and presentation"
        icon={Settings}
        iconShellClass="border-zinc-600/35 bg-zinc-900/45 text-zinc-300/95"
      />
    );
  }

  return (
    <TRNInspectorContextBar
      title="Telemetry Data"
      subtitle={`${livePanelCount} live panel${livePanelCount === 1 ? "" : "s"} · stream counters in deck headers`}
      icon={Activity}
      iconShellClass="border-emerald-500/30 bg-emerald-950/25 text-emerald-300/95"
    />
  );
}
