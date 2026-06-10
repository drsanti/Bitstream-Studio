import type { AnimationLabDigitalTwinDef, AnimationLabTwinComponentDef } from "./digital-twin.types.js";

function motorComponent(clipName: string, label: string): AnimationLabTwinComponentDef {
  const id = clipName.replace(/\s+/g, "-").toLowerCase();
  return {
    id,
    label,
    group: "Propulsion",
    glbAnchor: clipName,
    signals: [
      { key: `${id}.current_a`, label: "Current", unit: "A", warn: 6.5, alarm: 9 },
      { key: `${id}.temp_c`, label: "Temperature", unit: "°C", warn: 62, alarm: 78 },
      { key: `${id}.vibration`, label: "Vibration", unit: "mm/s", warn: 4.5, alarm: 7 },
    ],
  };
}

function gimbalComponent(clipName: string, label: string): AnimationLabTwinComponentDef {
  const id = clipName.replace(/\s+/g, "-").toLowerCase();
  return {
    id,
    label,
    group: "Gimbal",
    glbAnchor: clipName,
    signals: [
      { key: `${id}.load_pct`, label: "Drive load", unit: "%", warn: 72, alarm: 90 },
      { key: `${id}.track_err`, label: "Tracking error", unit: "°", warn: 1.2, alarm: 2.5 },
    ],
  };
}

const DRONE_CLIP_PATTERNS: { test: RegExp; build: (clip: string) => AnimationLabTwinComponentDef }[] =
  [
    { test: /gimbal/i, build: (c) => gimbalComponent(c, c.replace(/Action$/i, "").trim() || c) },
    { test: /camera/i, build: (c) => ({
      id: "camera",
      label: "Camera pod",
      group: "Payload",
      glbAnchor: c,
      signals: [
        { key: "camera.stabilizer", label: "Stabilizer load", unit: "%", warn: 65, alarm: 85 },
        { key: "camera.link_dbm", label: "Video link", unit: "dBm", warn: -78, alarm: -88, direction: "below" },
      ],
    }) },
    { test: /wing/i, build: (c) => motorComponent(c, c.replace(/Action$/i, "").trim() || c) },
  ];

/**
 * Heuristic twin map from GLB clip names (Tesa Drone and similar multi-actuator models).
 */
export function buildDefaultDroneDigitalTwinFromClips(
  clipNames: readonly string[],
): AnimationLabDigitalTwinDef | null {
  if (clipNames.length < 2) {
    return null;
  }
  const components: AnimationLabTwinComponentDef[] = [];
  for (const clip of clipNames) {
    const rule = DRONE_CLIP_PATTERNS.find((r) => r.test.test(clip));
    if (rule != null) {
      components.push(rule.build(clip));
    }
  }
  if (components.length === 0) {
    return null;
  }
  components.push({
    id: "imu",
    label: "Flight IMU",
    group: "Sensors",
    signals: [
      { key: "imu.temp_c", label: "Die temperature", unit: "°C", warn: 70, alarm: 85 },
      { key: "imu.vibration", label: "Frame vibration", unit: "mm/s", warn: 3.5, alarm: 6 },
    ],
  });
  return {
    assetId: "inferred-multi-actuator",
    label: "Machine Twin",
    components,
  };
}
