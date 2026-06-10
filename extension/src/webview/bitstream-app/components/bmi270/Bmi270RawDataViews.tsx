import {
  Activity,
  Compass,
  Orbit,
  Thermometer,
  Waves,
} from "lucide-react";
import { useMemo } from "react";
import type { Bmi270DeckCardFrameProps } from "../../types/sensorDeckCardFrame.js";
import {
  sensorDeckShowsDisplaySettings,
  sensorDeckShowsUpdateBadge,
} from "../../types/sensorDeckCardFrame.js";
import {
  toScaledValue,
  toScaledValueBy,
} from "../../telemetry/telemetryFormat";
import {
  TRNHintText,
} from "@/ui/TRN";
import { BMI270_MASK } from "../../../../bitstream2/domains/sensors/bmi270.js";
import { SENSOR_SOURCE_ID_BMI270 } from "../../constants/sensorSourceIds.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store.js";
import { formatTemperatureFromC, convertTemperatureCToUnit, readTemperatureCFromSample } from "../../telemetry/temperatureDisplay.js";
import { Bmi270RawSection } from "./Bmi270RawSection";
import { useBmi270FusionQuatOrientationStore } from "../../state/bmi270FusionQuatOrientation.store";
import { useBmi270FusionEulerWireTapStore } from "../../state/bmi270FusionEulerWireTap.store";
import { LastUpdateBadge } from "../telemetry/LastUpdateBadge.js";
import { useSensorLastUpdateBadge } from "../telemetry/useSensorLastUpdateBadge.js";
import { fusionEulerRowDisplay } from "./bmi270FusionDeckDisplay.js";
import { Bmi270FusionEulerDisplaySettingsMenu } from "./Bmi270FusionEulerDisplaySettingsMenu.js";
import { Bmi270FusionQuaternionDisplaySettingsMenu } from "./Bmi270FusionQuaternionDisplaySettingsMenu.js";
import type { Bmi270RawSectionItem } from "./bmi270RawTypes";
import {
  applyPreferPositiveW,
  formatFusionQuatComponent,
  fusionQuatNorm,
  resolveFusionQuatComponents,
} from "../../telemetry/fusionQuaternionDisplay.js";
import { TemperatureDisplaySettingsMenu } from "../telemetry/TemperatureDisplaySettingsMenu.js";

export function Bmi270RawGyroDataView(props: Bmi270DeckCardFrameProps) {
  const { sample, samplingIntervalMs = 0, showUpdateBadge, ...sectionFrame } = props;
  const updateBadge = useSensorLastUpdateBadge("bmi270", samplingIntervalMs);
  return (
    <Bmi270RawSection
      title="BMI270 Gyroscope"
      titleLeadingSlot={
        <Activity className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      }
      titleTrailingSlot={
        sensorDeckShowsUpdateBadge({ showUpdateBadge }) && updateBadge != null ? (
          <LastUpdateBadge {...updateBadge} />
        ) : null
      }
      {...sectionFrame}
      samplingIntervalMs={samplingIntervalMs}
      items={[
        {
          name: "gx",
          value: toScaledValue(sample?.gyroXRadSX100),
          unit: "rad/s",
          hint: "Gyroscope X\nUnit: rad/s\nRange: ±35 (2000 °/s FS)\nAngular velocity around X axis.",
        },
        {
          name: "gy",
          value: toScaledValue(sample?.gyroYRadSX100),
          unit: "rad/s",
          hint: "Gyroscope Y\nUnit: rad/s\nRange: ±35 (2000 °/s FS)\nAngular velocity around Y axis.",
        },
        {
          name: "gz",
          value: toScaledValue(sample?.gyroZRadSX100),
          unit: "rad/s",
          hint: "Gyroscope Z\nUnit: rad/s\nRange: ±35 (2000 °/s FS)\nAngular velocity around Z axis.",
        },
      ]}
    />
  );
}

export function Bmi270RawAccelDataView(props: Bmi270DeckCardFrameProps) {
  const { sample, samplingIntervalMs = 0, showUpdateBadge, ...sectionFrame } = props;
  const updateBadge = useSensorLastUpdateBadge("bmi270", samplingIntervalMs);
  return (
    <Bmi270RawSection
      title="BMI270 Accelerometer"
      titleLeadingSlot={
        <Waves className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      }
      titleTrailingSlot={
        sensorDeckShowsUpdateBadge({ showUpdateBadge }) && updateBadge != null ? (
          <LastUpdateBadge {...updateBadge} />
        ) : null
      }
      {...sectionFrame}
      samplingIntervalMs={samplingIntervalMs}
      items={[
        {
          name: "ax",
          value: toScaledValue(sample?.accelXMs2X100),
          unit: "m/s²",
          hint: "Accelerometer X\nUnit: m/s²\nRange: ±20 (±2g FS)\nLinear acceleration on X axis.",
        },
        {
          name: "ay",
          value: toScaledValue(sample?.accelYMs2X100),
          unit: "m/s²",
          hint: "Accelerometer Y\nUnit: m/s²\nRange: ±20 (±2g FS)\nLinear acceleration on Y axis.",
        },
        {
          name: "az",
          value: toScaledValue(sample?.accelZMs2X100),
          unit: "m/s²",
          hint: "Accelerometer Z\nUnit: m/s²\nRange: ±20 (±2g FS)\nLinear acceleration on Z axis.",
        },
      ]}
    />
  );
}

export function Bmi270RawTemperatureDataView(props: Bmi270DeckCardFrameProps) {
  const { sample, samplingIntervalMs = 0, showUpdateBadge, showDisplaySettings, ...sectionFrame } =
    props;
  const updateBadge = useSensorLastUpdateBadge("bmi270", samplingIntervalMs);
  const bmi270EvtMaskSeenOr = useBitstreamLiveStore((s) => s.bmi270EvtMaskSeenOr);
  const bmi270StreamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);
  const appliedMask =
    useBitstreamDeviceSensorConfigStore(
      (s) =>
        s.baselineBySourceId[SENSOR_SOURCE_ID_BMI270]?.mask ??
        s.bySourceId[SENSOR_SOURCE_ID_BMI270]?.mask ??
        0,
    ) & 0xff;
  const draftMask =
    useBitstreamDeviceSensorConfigStore(
      (s) => s.bySourceId[SENSOR_SOURCE_ID_BMI270]?.mask ?? appliedMask,
    ) & 0xff;
  const temperatureUnit = useBitstreamConfigStore((s) => s.temperatureDisplayUnit);
  const temperatureDigits = useBitstreamConfigStore((s) => s.temperatureDisplayFractionDigits);
  const tpNumericC = readTemperatureCFromSample(sample);
  const tpDisplay = formatTemperatureFromC(tpNumericC, temperatureUnit, temperatureDigits);
  const gaugeMax = convertTemperatureCToUnit(100, temperatureUnit);
  const streamActive = typeof sample?.counter === "number";
  const tmpConfiguredOnDevice = (appliedMask & BMI270_MASK.TMP) !== 0;
  const tmpConfiguredInDraft = (draftMask & BMI270_MASK.TMP) !== 0;
  const tmpEverOnWire = (bmi270EvtMaskSeenOr & BMI270_MASK.TMP) !== 0;
  const showEnableTempHint =
    streamActive && tpNumericC == null && !tmpConfiguredOnDevice && !tmpConfiguredInDraft;
  const showApplyTempHint =
    streamActive && tpNumericC == null && !tmpConfiguredOnDevice && tmpConfiguredInDraft;
  const showWaitingForTmpHint =
    streamActive && tpNumericC == null && tmpConfiguredOnDevice && !tmpEverOnWire;
  const waitingHintText =
    bmi270StreamMode === "hybrid"
      ? "Temperature updates on raw frames when All is selected. Pick Raw or All, then Apply."
      : "Temperature is enabled but not received yet. Apply Telemetry Sources if you changed the preset.";
  return (
    <Bmi270RawSection
      title="BMI270 Temperature"
      titleLeadingSlot={
        <Thermometer className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      }
      titleTrailingSlot={
        <div className="inline-flex shrink-0 items-center gap-1.5">
          {sensorDeckShowsUpdateBadge({ showUpdateBadge }) && updateBadge != null ? (
            <LastUpdateBadge {...updateBadge} />
          ) : null}
          {sensorDeckShowsDisplaySettings({ showDisplaySettings }) ? (
            <TemperatureDisplaySettingsMenu />
          ) : null}
        </div>
      }
      {...sectionFrame}
      samplingIntervalMs={samplingIntervalMs}
      prefaceSlot={
        showEnableTempHint ? (
          <TRNHintText tone="warn" className="text-[10px] leading-relaxed">
            Pick Raw or All, then Apply in Telemetry Sources.
          </TRNHintText>
        ) : showApplyTempHint ? (
          <TRNHintText tone="warn" className="text-[10px] leading-relaxed">
            Temperature is not on the device yet. Apply in Telemetry Sources.
          </TRNHintText>
        ) : showWaitingForTmpHint ? (
          <TRNHintText tone="warn" className="text-[10px] leading-relaxed">
            {waitingHintText}
          </TRNHintText>
        ) : null
      }
      items={[
        {
          name: "tp",
          value: tpDisplay.text,
          unit: tpDisplay.unitLabel,
          centerZeroGaugeMaxAbs: undefined,
          oneSidedGaugeMaxAbs: gaugeMax,
          positiveSignMode: "omit",
          valueFractionDigits: temperatureDigits,
          hint: "BMI270 Temperature\nGlobal unit/precision options in the header.\nBMI270 temperature reading.",
        },
      ]}
    />
  );
}

export function Bmi270FusionQuaternionDataView(props: Bmi270DeckCardFrameProps) {
  const { sample, samplingIntervalMs = 0, showUpdateBadge, showDisplaySettings, ...sectionFrame } =
    props;
  const qtQx = useBmi270FusionQuatOrientationStore((s) => s.qx);
  const qtQy = useBmi270FusionQuatOrientationStore((s) => s.qy);
  const qtQz = useBmi270FusionQuatOrientationStore((s) => s.qz);
  const qtQw = useBmi270FusionQuatOrientationStore((s) => s.qw);
  const qtLastAtMs = useBmi270FusionQuatOrientationStore((s) => s.lastAtMs);
  const updateBadge = useSensorLastUpdateBadge("bmi270", samplingIntervalMs);
  const showNorm = useBitstreamConfigStore((s) => s.bmi270FusionQuatShowNorm);
  const preferPositiveW = useBitstreamConfigStore((s) => s.bmi270FusionQuatPreferPositiveW);

  const quatItems = useMemo((): Bmi270RawSectionItem[] => {
    const raw = resolveFusionQuatComponents({
      sampleQxX10000: sample?.fusionQuatXX10000,
      sampleQyX10000: sample?.fusionQuatYX10000,
      sampleQzX10000: sample?.fusionQuatZX10000,
      sampleQwBucketX10000: sample?.fusionQuatWBucketX10000,
      wireTapQx: qtQx,
      wireTapQy: qtQy,
      wireTapQz: qtQz,
      wireTapQw: qtQw,
      wireTapLastAtMs: qtLastAtMs,
    });

    if (raw == null)
    {
      return [
        {
          name: "qx",
          value: "--",
          unit: "",
          centerZeroGaugeMaxAbs: 1,
          valueFractionDigits: 2,
          hint: "Quaternion X (imaginary)\nUnit: normalized\nRange: −1 to 1",
        },
        {
          name: "qy",
          value: "--",
          unit: "",
          centerZeroGaugeMaxAbs: 1,
          valueFractionDigits: 2,
          hint: "Quaternion Y (imaginary)\nUnit: normalized\nRange: −1 to 1",
        },
        {
          name: "qz",
          value: "--",
          unit: "",
          centerZeroGaugeMaxAbs: 1,
          valueFractionDigits: 2,
          hint: "Quaternion Z (imaginary)\nUnit: normalized\nRange: −1 to 1",
        },
        {
          name: "qw",
          value: "--",
          unit: "",
          centerZeroGaugeMaxAbs: 1,
          valueFractionDigits: 2,
          hint: "Quaternion W (scalar)\nUnit: normalized\nRange: −1 to 1",
        },
      ];
    }

    const q = preferPositiveW ? applyPreferPositiveW(raw) : raw;
    const norm = fusionQuatNorm(q);
    const items: Bmi270RawSectionItem[] = [];

    if (showNorm)
    {
      items.push({
        name: "|q|",
        value: formatFusionQuatComponent(norm, 2),
        unit: "",
        oneSidedGaugeMaxAbs: 1,
        positiveSignMode: "omit",
        valueFractionDigits: 2,
        hint:
          "Quaternion norm ‖q‖\nUnit: normalized\n~1.000 when properly normalized\nDisplay-only health check.",
      });
    }

    items.push(
      {
        name: "qx",
        value: formatFusionQuatComponent(q.qx, 2),
        unit: "",
        centerZeroGaugeMaxAbs: 1,
        valueFractionDigits: 2,
        hint:
          "Quaternion X (imaginary)\nUnit: normalized\nRange: −1 to 1\nSigned component; bar grows left (negative) or right (positive) from center.",
      },
      {
        name: "qy",
        value: formatFusionQuatComponent(q.qy, 2),
        unit: "",
        centerZeroGaugeMaxAbs: 1,
        valueFractionDigits: 2,
        hint:
          "Quaternion Y (imaginary)\nUnit: normalized\nRange: −1 to 1\nSigned component; bidirectional gauge.",
      },
      {
        name: "qz",
        value: formatFusionQuatComponent(q.qz, 2),
        unit: "",
        centerZeroGaugeMaxAbs: 1,
        valueFractionDigits: 2,
        hint:
          "Quaternion Z (imaginary)\nUnit: normalized\nRange: −1 to 1\nSigned component; bidirectional gauge.",
      },
      {
        name: "qw",
        value: formatFusionQuatComponent(q.qw, 2),
        unit: "",
        centerZeroGaugeMaxAbs: 1,
        valueFractionDigits: 2,
        hint:
          preferPositiveW
            ? "Quaternion W (scalar)\nUnit: normalized\nDisplay: prefer +w hemisphere (same rotation as raw).\nBidirectional gauge from center."
            : "Quaternion W (scalar)\nUnit: normalized\nRange: −1 to 1\nSame rotation as negating all four if signs flip.",
      },
    );

    return items;
  }, [
    preferPositiveW,
    qtLastAtMs,
    qtQx,
    qtQy,
    qtQz,
    qtQw,
    sample?.fusionQuatWBucketX10000,
    sample?.fusionQuatXX10000,
    sample?.fusionQuatYX10000,
    sample?.fusionQuatZX10000,
    showNorm,
  ]);

  return (
    <Bmi270RawSection
      title="BMI270 Quaternion"
      titleLeadingSlot={
        <Orbit className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      }
      titleTrailingSlot={
        <div className="inline-flex shrink-0 items-center gap-1.5">
          {sensorDeckShowsUpdateBadge({ showUpdateBadge }) &&
          qtLastAtMs != null &&
          updateBadge != null ? (
            <LastUpdateBadge {...updateBadge} lastAtMs={qtLastAtMs} />
          ) : null}
          {sensorDeckShowsDisplaySettings({ showDisplaySettings }) ? (
            <Bmi270FusionQuaternionDisplaySettingsMenu />
          ) : null}
        </div>
      }
      {...sectionFrame}
      samplingIntervalMs={samplingIntervalMs}
      items={quatItems}
    />
  );
}

export function Bmi270FusionEulerDataView(props: Bmi270DeckCardFrameProps) {
  const { sample, samplingIntervalMs = 0, showUpdateBadge, showDisplaySettings, ...sectionFrame } =
    props;
  const etPitchRad = useBmi270FusionEulerWireTapStore((s) => s.pitchRad);
  const etRollRad = useBmi270FusionEulerWireTapStore((s) => s.rollRad);
  const etYawRad = useBmi270FusionEulerWireTapStore((s) => s.yawRad);
  const etLastAtMs = useBmi270FusionEulerWireTapStore((s) => s.lastAtMs);
  const updateBadge = useSensorLastUpdateBadge("bmi270", samplingIntervalMs);
  const eulerDisplayMode = useBitstreamConfigStore((s) => s.bmi270FusionEulerDisplayMode);

  const pitchRow = fusionEulerRowDisplay(
    sample?.fusionPitchRadX100,
    etPitchRad,
    etLastAtMs,
    eulerDisplayMode,
  );
  const yawRow = fusionEulerRowDisplay(
    sample?.fusionHeadingRadX100,
    etYawRad,
    etLastAtMs,
    eulerDisplayMode,
  );
  const rollRow = fusionEulerRowDisplay(
    sample?.fusionRollRadX100,
    etRollRad,
    etLastAtMs,
    eulerDisplayMode,
  );

  const eulerHintRange =
    eulerDisplayMode === "signed-pi-rad"
      ? "Unit: rad, shown in (−π, π] (±180°)"
      : eulerDisplayMode === "signed-deg"
        ? "Unit: °, shown in (−180°, 180°]"
        : "Unit: °, shown in [0°, 360°)";

  return (
    <Bmi270RawSection
      title="BMI270 Euler Angles"
      titleLeadingSlot={
        <Compass className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      }
      titleTrailingSlot={
        <div className="inline-flex shrink-0 items-center gap-1.5">
          {sensorDeckShowsUpdateBadge({ showUpdateBadge }) &&
          etLastAtMs != null &&
          updateBadge != null ? (
            <LastUpdateBadge {...updateBadge} lastAtMs={etLastAtMs} />
          ) : null}
          {sensorDeckShowsDisplaySettings({ showDisplaySettings }) ? (
            <Bmi270FusionEulerDisplaySettingsMenu />
          ) : null}
        </div>
      }
      {...sectionFrame}
      samplingIntervalMs={samplingIntervalMs}
      items={[
        {
          name: "pitch",
          value: pitchRow.value,
          unit: pitchRow.unit,
          centerZeroGaugeMaxAbs: pitchRow.centerZeroGaugeMaxAbs,
          oneSidedGaugeMaxAbs: pitchRow.oneSidedGaugeMaxAbs,
          positiveSignMode: pitchRow.positiveSignMode,
          valueFractionDigits: 2,
          hint:
            `BSX pitch (fusionPitchRadX100)\n${eulerHintRange}\nBench (frame N): tracks rotation about board +X.`,
        },
        {
          name: "yaw",
          value: yawRow.value,
          unit: yawRow.unit,
          centerZeroGaugeMaxAbs: yawRow.centerZeroGaugeMaxAbs,
          oneSidedGaugeMaxAbs: yawRow.oneSidedGaugeMaxAbs,
          positiveSignMode: yawRow.positiveSignMode,
          valueFractionDigits: 2,
          hint:
            `Heading / yaw (fusionHeadingRadX100)\n${eulerHintRange}\nRotation about board +Z (frame N).`,
        },
        {
          name: "roll",
          value: rollRow.value,
          unit: rollRow.unit,
          centerZeroGaugeMaxAbs: rollRow.centerZeroGaugeMaxAbs,
          oneSidedGaugeMaxAbs: rollRow.oneSidedGaugeMaxAbs,
          positiveSignMode: rollRow.positiveSignMode,
          valueFractionDigits: 2,
          hint:
            `BSX roll (fusionRollRadX100)\n${eulerHintRange}\nBench (frame N): tracks rotation about board +Y.`,
        },
      ]}
    />
  );
}
