/**
 * Hardware sensor About copy — ranges/accuracy from vendor datasheets (2026).
 * Sources: BST-BMI270-DS000, Infineon DPS368 DS v01_01, Sensirion SHT4x DS, BST-BMM350-DS001.
 */

import type { StudioNode } from "../../store/flow-editor.store";

export type SensorAboutRangeRow = {
  quantity: string;
  min: string;
  max: string;
  unit: string;
  note?: string;
};

export type SensorAboutAccuracyRow = {
  quantity: string;
  typical: string;
  note?: string;
};

export type SensorInspectorAboutContent = {
  chip: string;
  vendor: string;
  datasheetLabel: string;
  datasheetUrl: string;
  /** One-line role of the silicon. */
  role: string;
  /** How this graph node maps to live BS2 telemetry. */
  bitstreamNote: string;
  learnMore: readonly string[];
  ranges: readonly SensorAboutRangeRow[];
  accuracy: readonly SensorAboutAccuracyRow[];
  /** Extra note for tap/scalar nodes derived from a multi-pin source. */
  tapNote?: string;
};

export type SensorAboutFamilyId = "bmi270" | "dps368" | "sht40" | "bmm350";

const SENSOR_ABOUT_BY_FAMILY: Record<SensorAboutFamilyId, SensorInspectorAboutContent> = {
  bmi270: {
    chip: "BMI270",
    vendor: "Bosch Sensortec",
    datasheetLabel: "BST-BMI270-DS000",
    datasheetUrl:
      "https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmi270-ds000.pdf",
    role:
      "6-axis IMU (16-bit accelerometer + 16-bit gyroscope) with on-chip motion features and an internal temperature channel.",
    bitstreamNote:
      "Firmware publishes raw accel/gyro (scaled to m/s² and rad/s), die temperature (°C), and—when fusion is enabled—Euler radians (roll, pitch, heading on x,y,z) plus an optional unit quaternion.",
    learnMore: [
      "Accelerometers measure specific force including gravity; at rest, the vertical axis reads about +9.81 m/s² when upright.",
      "Gyroscopes measure angular rate (rad/s). Integrating gyro data gives orientation, but drift accumulates without magnetometer or fusion aiding.",
      "Programmable full-scale ranges trade resolution for headroom: use a lower g/dps range when signals are small to maximize LSB resolution.",
      "Fusion outputs depend on MCU firmware configuration (raw vs fusion stream mode), not on the BMI270 silicon alone.",
    ],
    ranges: [
      {
        quantity: "Accelerometer (FSR, selectable)",
        min: "±2",
        max: "±16",
        unit: "g",
        note: "Also ±4 g, ±8 g via ACC_RANGE",
      },
      {
        quantity: "Gyroscope (FSR, selectable)",
        min: "±125",
        max: "±2000",
        unit: "°/s",
        note: "Also ±250, ±500, ±1000 °/s via GYR_RANGE",
      },
      {
        quantity: "Die temperature (operating)",
        min: "−40",
        max: "+85",
        unit: "°C",
      },
      {
        quantity: "Accelerometer ODR",
        min: "0.78",
        max: "1600",
        unit: "Hz",
        note: "Typ. 12.5 Hz … 1.6 kHz in product brief",
      },
      {
        quantity: "Gyroscope ODR",
        min: "25",
        max: "6400",
        unit: "Hz",
      },
    ],
    accuracy: [
      { quantity: "Accel zero-g offset", typical: "±20 mg" },
      { quantity: "Gyro zero-rate offset", typical: "±0.5 °/s" },
      { quantity: "Sensitivity error (A/G, with CRT)", typical: "±0.4 %" },
      { quantity: "On-chip temperature", typical: "±2 °C", note: "Internal sensor" },
      { quantity: "Accel noise density", typical: "160 µg/√Hz" },
      { quantity: "Gyro noise density", typical: "0.008 °/s/√Hz" },
    ],
  },
  dps368: {
    chip: "DPS368",
    vendor: "Infineon (XENSIV)",
    datasheetLabel: "Infineon DPS368 DS v01_01",
    datasheetUrl:
      "https://www.infineon.com/dgdl/Infineon-DPS368-DataSheet-v01_01-EN.pdf?fileId=5546d46269e1c019016a0c45105d4b40",
    role:
      "Digital barometric pressure and temperature sensor (capacitive MEMS) with IPx8-rated package for wearables.",
    bitstreamNote:
      "Live stream exposes barometric pressure in hPa and companion temperature in °C. Altitude changes can be estimated from pressure delta (hypsometric model).",
    learnMore: [
      "Barometric pressure drops with altitude (~12 Pa per metre near sea level in standard conditions).",
      "Capacitive sensing keeps precision stable when temperature swings—still compensate for rapid ΔT in demanding apps.",
      "300 hPa ≈ high-altitude flight; 1200 hPa covers strong weather highs—values outside FSR are not valid measurements.",
    ],
    ranges: [
      {
        quantity: "Pressure (FSR)",
        min: "300",
        max: "1200",
        unit: "hPa",
        note: "≈ 9 km to below sea-level highs",
      },
      {
        quantity: "Temperature (operating)",
        min: "−40",
        max: "+85",
        unit: "°C",
      },
    ],
    accuracy: [
      { quantity: "Pressure precision (high-precision mode)", typical: "±0.002 hPa (±0.02 m)" },
      { quantity: "Relative pressure accuracy", typical: "±0.06 hPa (±0.5 m)" },
      { quantity: "Absolute pressure accuracy", typical: "±1 hPa (±8 m)" },
      { quantity: "Temperature", typical: "±0.5 °C" },
      { quantity: "Pressure temp. coefficient", typical: "0.5 Pa/K" },
    ],
  },
  sht40: {
    chip: "SHT40",
    vendor: "Sensirion",
    datasheetLabel: "Sensirion SHT4x datasheet",
    datasheetUrl:
      "https://sensirion.com/media/documents/33FD6951/67EB9032/HT_DS_Datasheet_SHT4x_5.pdf",
    role:
      "CMOSens® humidity and temperature sensor in a compact DFN—RH from capacitive polymer, T from bandgap.",
    bitstreamNote:
      "Publishes relative humidity (%RH) and temperature (°C). Best for environmental monitoring, comfort, and condensation-aware logic.",
    learnMore: [
      "Relative humidity (%RH) is moisture relative to the maximum the air can hold at that temperature—warm air holds more water.",
      "Specify best accuracy in 5…60 °C and 20…80 %RH; long exposure above ~80 %RH can temporarily offset RH until recovery.",
      "τ63 response is ~4 s for RH and ~2 s for temperature—allow settling after step changes.",
    ],
    ranges: [
      {
        quantity: "Relative humidity (FSR)",
        min: "0",
        max: "100",
        unit: "%RH",
        note: "Non-condensing operation per datasheet",
      },
      {
        quantity: "Temperature (operating)",
        min: "−40",
        max: "+125",
        unit: "°C",
      },
    ],
    accuracy: [
      { quantity: "Relative humidity (SHT40 typ.)", typical: "±1.8 %RH", note: "Max ±3.5 %RH @ 25 °C" },
      { quantity: "Temperature (SHT40 typ.)", typical: "±0.2 °C" },
      { quantity: "RH resolution", typical: "0.01 %RH" },
      { quantity: "Temperature resolution", typical: "0.01 °C" },
    ],
  },
  bmm350: {
    chip: "BMM350",
    vendor: "Bosch Sensortec",
    datasheetLabel: "BST-BMM350-DS001",
    datasheetUrl:
      "https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmm350-ds001.pdf",
    role:
      "Low-power 3-axis magnetometer (TMR) for compassing, AR/VR head tracking, and indoor navigation aiding.",
    bitstreamNote:
      "Vector components Hx, Hy, Hz are reported in µT. Keep ferrous/magnet interference away from the sensor and calibrate for hard/soft iron in the product enclosure.",
    learnMore: [
      "Earth field magnitude is roughly 25…65 µT depending on location—inclination/declination vary with latitude.",
      "Valid vector range: √(Hx² + Hy² + Hz²) ≤ 2000 µT; exceeding this requires a magnetic reset (firmware/API).",
      "X/Y axes are lower noise than Z; use compensated outputs from firmware where available.",
    ],
    ranges: [
      {
        quantity: "Magnetic field (per axis)",
        min: "−2000",
        max: "+2000",
        unit: "µT",
        note: "Vector magnitude limit 2000 µT",
      },
      {
        quantity: "Magnetic resolution",
        min: "—",
        max: "—",
        unit: "≈0.1 µT",
        note: "Typical LSB scale",
      },
      {
        quantity: "Temperature (operating)",
        min: "−40",
        max: "+85",
        unit: "°C",
      },
      {
        quantity: "Output data rate",
        min: "25/16",
        max: "400",
        unit: "Hz",
        note: "Preset-dependent",
      },
    ],
    accuracy: [
      { quantity: "Gain error after solder (typ., X/Y)", typical: "±1 %" },
      { quantity: "Gain error after solder (typ., Z)", typical: "±3 %", note: "After API compensation" },
      { quantity: "Zero-field offset after solder", typical: "±25 µT" },
      { quantity: "Output noise (X/Y, rms)", typical: "±190 nT" },
      { quantity: "Output noise (Z, rms)", typical: "±450 nT" },
      { quantity: "TCO error (typ.)", typical: "±200 nT/K" },
    ],
  },
};

const TAP_NOTES: Partial<Record<string, string>> = {
  "bmi270-tap-quaternion": "Scalar tap from the BMI270 fusion quaternion stream—same sourceId as the full BMI270 node.",
  "bmi270-tap-euler": "Scalar tap from fusion Euler (rad)—roll, pitch, heading mapped to x, y, z.",
  "bmi270-tap-accel": "Tap from the raw accelerometer vector (m/s²).",
  "bmi270-tap-gyro": "Tap from the raw gyroscope vector (rad/s).",
  "dps368-tap-pressure": "Scalar pressure tap (hPa) from the DPS368 stream.",
  "dps368-tap-temp": "Scalar temperature tap (°C) from the DPS368 stream.",
  "sht40-tap-humidity": "Scalar humidity tap (%RH) from the SHT40 stream.",
  "sht40-tap-temp": "Scalar temperature tap (°C) from the SHT40 stream.",
  "bmm350-tap-magnetic": "Magnetic vector tap (µT) from the BMM350 stream.",
  "bmm350-tap-temp": "Scalar temperature tap (°C) from the BMM350 stream.",
};

export function resolveSensorAboutFamily(nodeId: string): SensorAboutFamilyId | null {
  if (nodeId.startsWith("bmi270-")) {
    return "bmi270";
  }
  if (nodeId.startsWith("dps368-")) {
    return "dps368";
  }
  if (nodeId.startsWith("sht40-")) {
    return "sht40";
  }
  if (nodeId.startsWith("bmm350-")) {
    return "bmm350";
  }
  return null;
}

export function resolveSensorInspectorAboutContent(
  nodeId: string,
): SensorInspectorAboutContent | null {
  const family = resolveSensorAboutFamily(nodeId);
  if (family == null) {
    return null;
  }
  const base = SENSOR_ABOUT_BY_FAMILY[family];
  const tapNote = TAP_NOTES[nodeId];
  return {
    ...base,
    tapNote,
  };
}

/** Hardware About for dedicated sensor nodes and legacy `sensor-input` sourceKey prefixes. */
export function resolveSensorInspectorAboutForNode(
  node: StudioNode,
): SensorInspectorAboutContent | null {
  const fromNodeId = resolveSensorInspectorAboutContent(node.data.nodeId);
  if (fromNodeId != null) {
    return fromNodeId;
  }
  if (node.data.nodeId !== "sensor-input") {
    return null;
  }
  const sourceKey = String(node.data.defaultConfig.sourceKey ?? "");
  const prefixFamily = sourceKey.startsWith("bmi270.")
    ? "bmi270"
    : sourceKey.startsWith("dps368.")
      ? "dps368"
      : sourceKey.startsWith("sht40.")
        ? "sht40"
        : sourceKey.startsWith("bmm350.")
          ? "bmm350"
          : null;
  if (prefixFamily == null) {
    return null;
  }
  return { ...SENSOR_ABOUT_BY_FAMILY[prefixFamily] };
}

/** Catalog fallback line shown under the chip summary when provided. */
export function catalogAboutLead(catalogDescription?: string): string | null {
  const trimmed = catalogDescription?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}
