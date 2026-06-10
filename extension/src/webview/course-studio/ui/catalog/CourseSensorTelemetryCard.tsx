import { useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import type { PageBlockV1, PageV1 } from "../../schemas/page.v1";
import {
  resolveSensorTelemetryCardEffectiveAppearance,
  type SensorTelemetryCardAppearance,
} from "../../schemas/sensorTelemetryCardAppearance";
import { sensorTelemetryCardBlockColorsToStyle } from "../../schemas/sensorTelemetryCardBlockColors";
import type { CourseSensorTelemetryCardPreset } from "../../schemas/sensorTelemetryCardPreset";
import { courseSensorTelemetryCardPresetLabel } from "../../schemas/sensorTelemetryCardPreset";
import { SensorTelemetryCardRenderer } from "../../../bitstream-app/components/telemetry/SensorTelemetryCardRenderer";
import type { SensorDeckCardFrameProps } from "../../../bitstream-app/types/sensorDeckCardFrame";
import {
  courseSensorTelemetryCardUnavailableReason,
  useCourseSensorTelemetryDeckSamples,
} from "../../runtime/useCourseSensorTelemetryDeckSamples";

function CourseSensorTelemetryCardUnavailable({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col justify-center rounded-md border border-dashed border-zinc-700/80 bg-black/30 px-3 py-4 text-center">
      <div className="text-xs font-semibold text-zinc-200">{title}</div>
      <p className="mt-2 text-2xs leading-relaxed text-zinc-400">{reason}</p>
    </div>
  );
}

function buildDeckFrame(
  appearance: ReturnType<typeof resolveSensorTelemetryCardEffectiveAppearance>,
  collapsed: boolean,
  onToggleCollapsed: () => void,
): Omit<SensorDeckCardFrameProps, "samplingIntervalMs"> {
  return {
    shell: appearance.shell,
    showUpdateBadge: appearance.showUpdateBadge,
    showDisplaySettings: appearance.showDisplaySettings,
    collapsed,
    onToggleCollapsed,
  };
}

export function CourseSensorTelemetryCard({
  preset,
  appearance,
  pageMeta,
}: {
  preset: CourseSensorTelemetryCardPreset;
  appearance?: SensorTelemetryCardAppearance;
  pageMeta?: PageV1["meta"];
}) {
  const deck = useCourseSensorTelemetryDeckSamples();
  const resolvedAppearance = resolveSensorTelemetryCardEffectiveAppearance(
    appearance,
    pageMeta?.sensorTelemetryCardColors,
  );
  const [collapsed, setCollapsed] = useState(resolvedAppearance.defaultCollapsed);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => !previous);
  }, []);

  const unavailableReason = courseSensorTelemetryCardUnavailableReason(preset, deck);
  const title = courseSensorTelemetryCardPresetLabel(preset);
  const colorStyle = sensorTelemetryCardBlockColorsToStyle(resolvedAppearance.colors);
  const themed = colorStyle != null;

  if (unavailableReason != null) {
    return <CourseSensorTelemetryCardUnavailable title={title} reason={unavailableReason} />;
  }

  return (
    <div
      className={twMerge(
        "course-sensor-telemetry-card h-full min-h-0 w-full min-w-0 overflow-auto",
        themed && "course-sensor-telemetry-card--themed",
      )}
      style={colorStyle}
    >
      <SensorTelemetryCardRenderer
        cardId={preset}
        sample={deck.bmi270Sample}
        dpsSample={deck.dpsSample}
        sht40Sample={deck.sht40Sample}
        bmm350Sample={deck.bmm350Sample}
        samplingIntervalMs={deck.samplingIntervalMs}
        dpsSamplingIntervalMs={deck.dpsSamplingIntervalMs}
        shtSamplingIntervalMs={deck.shtSamplingIntervalMs}
        bmm350SamplingIntervalMs={deck.bmm350SamplingIntervalMs}
        deckFrame={buildDeckFrame(resolvedAppearance, collapsed, toggleCollapsed)}
      />
    </div>
  );
}

export type CourseSensorTelemetryCardBlock = Extract<
  PageBlockV1,
  { kind: "sensor-telemetry-card" }
>;
