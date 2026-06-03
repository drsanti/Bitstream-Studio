const TYPED_SECTION_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  threshold: ["threshold", "operator", "compare", "value"],
  "map-range": ["map", "range", "remap", "in", "out", "scale", "clamp"],
  clamp: ["clamp", "min", "max", "limit"],
  "low-pass": ["low", "pass", "filter", "alpha", "smooth"],
  gauge: ["gauge", "legacy", "bar", "meter", "deprecated"],
  "radial-gauge": [
    "radial",
    "gauge",
    "arc",
    "needle",
    "smooth",
    "smoothing",
    "zone",
    "alarm",
    "min",
    "max",
    "scale",
    "unit",
    "decimals",
    "faceplate",
    "ticks",
    "appearance",
    "setpoint",
    "target",
    "reference",
  ],
  "bar-meter": ["bar", "meter", "zone", "min", "max", "scale", "unit", "orientation", "peak", "smooth", "fill"],
  knob: ["knob", "dial", "value", "step", "zone", "min", "max", "unit"],
  "numeric-display": ["numeric", "display", "label", "digits", "zone", "status", "unit"],
  "led-indicator": ["led", "indicator", "boolean", "threshold", "blink", "color", "on", "off"],
  sparkline: ["sparkline", "history", "buffer", "samples", "stroke", "trend", "line"],
  plotter: ["plotter", "trend", "chart", "trace", "channel", "history"],
  oscilloscope: ["oscilloscope", "scope", "plotter"],
  "sensor-input": ["sensor", "source", "sourcekey", "hardware", "bmi270"],
  environment: [
    "environment",
    "ibl",
    "hdri",
    "cubemap",
    "background",
    "yaw",
    "modulation",
    "socket",
    "pin",
  ],
  "camera-view": ["camera", "fov", "orbit", "look", "polar", "distance"],
  "glb-animation-bundle": ["animation", "bundle", "model", "viewer", "clip"],
  "boolean-constant": ["boolean", "constant", "true", "false", "logic"],
  "on-click": ["click", "mouse", "pointer", "event", "canvas", "pane"],
  "on-stage-pick": ["stage", "pick", "viewport", "3d", "click", "event", "model"],
  "event-set-boolean": ["set", "boolean", "event", "on", "off", "latch"],
  "on-key": ["key", "keyboard", "event", "trigger", "hotkey", "binding"],
  "event-toggle-boolean": ["toggle", "boolean", "event", "flip", "trigger"],
  "event-toggle-glb-part": ["toggle", "glb", "part", "visibility", "event", "mesh", "show", "hide"],
  "event-set-glb-part": ["set", "glb", "part", "visibility", "event", "mesh", "show", "hide"],
  "event-trigger-glb-anim": ["trigger", "glb", "animation", "clip", "event", "play", "once", "mixer"],
  "transform-from-euler": [
    "transform",
    "euler",
    "fusion",
    "imu",
    "mapping",
    "roll",
    "pitch",
    "heading",
    "literal",
    "zyx",
  ],
  "number-constant": [
    "number",
    "constant",
    "float",
    "integer",
    "min",
    "max",
    "step",
    "clamp",
    "quantize",
    "slider",
    "card",
    "input",
  ],
  lerp: ["scalar", "linear", "number", "blend", "interpolate"],
  "vector-constant": ["vector", "constant", "xyz", "vec3"],
  "quaternion-constant": ["quaternion", "constant", "quat", "wxyz"],
  "combine-xyz": ["combine", "vector", "xyz", "merge", "build"],
  "combine-quaternion": ["combine", "quaternion", "quat", "merge", "w", "x", "y", "z"],
  "vector-splitter": ["split", "separate", "vector", "xyz", "decompose"],
  "quaternion-splitter": ["split", "separate", "quaternion", "quat", "decompose"],
  "vector-length": ["length", "magnitude", "vector", "norm"],
  "vector-normalize": ["normalize", "unit", "vector"],
  "vector-lerp": ["lerp", "slerp", "linear", "blend", "vector", "interpolate"],
  "quaternion-slerp": ["slerp", "quaternion", "blend", "rotation", "lerp"],
  "euler-to-quaternion": ["euler", "quaternion", "convert"],
  "tilt-from-accel": ["tilt", "accel", "gravity", "imu"],
};

const ROTATION_SEARCH = [
  "rotation",
  "3d",
  "scene",
  "model",
  "grid",
  "euler",
  "quaternion",
  "ibl",
  "environment",
  "shadow",
  "light",
  "mesh",
];

const SHARED_DEVICE_SEARCH = [
  "shared",
  "device",
  "cfg",
  "config",
  "enabled",
  "telemetry",
  "sample",
  "publish",
  "delta",
  "hardware",
  "firmware",
  "broker",
  "bmi270",
  "fusion",
  "feed",
  "bsx",
  "dps368",
  "sht40",
  "bmm350",
];

const JSON_SEARCH = ["json", "config", "raw", "default", "advanced"];

function tokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function haystackIncludesAll(hay: string, toks: string[]): boolean {
  if (toks.length === 0) {
    return true;
  }
  return toks.every((t) => hay.includes(t));
}

export function shouldShowTypedSettingsSection(
  nodeId: string,
  catalogDefinitionTitle: string,
  query: string,
): boolean {
  const toks = tokens(query);
  if (toks.length === 0) {
    return true;
  }
  const hay = `${nodeId} ${catalogDefinitionTitle}`.toLowerCase();
  if (haystackIncludesAll(hay, toks)) {
    return true;
  }
  const extra = TYPED_SECTION_KEYWORDS[nodeId];
  if (extra == null) {
    return false;
  }
  const kwHay = `${hay} ${extra.join(" ")}`;
  return haystackIncludesAll(kwHay, toks);
}

export function shouldShowRotation3dSettings(query: string): boolean {
  const toks = tokens(query);
  if (toks.length === 0) {
    return true;
  }
  const hay = ROTATION_SEARCH.join(" ");
  return toks.some((t) => hay.includes(t) || ROTATION_SEARCH.some((k) => k.includes(t)));
}

export function shouldShowSharedDeviceSettings(query: string): boolean {
  const toks = tokens(query);
  if (toks.length === 0) {
    return true;
  }
  const hay = SHARED_DEVICE_SEARCH.join(" ");
  return toks.some((t) => hay.includes(t) || SHARED_DEVICE_SEARCH.some((k) => k.includes(t)));
}

export function shouldShowJsonConfigSection(query: string): boolean {
  const toks = tokens(query);
  if (toks.length === 0) {
    return true;
  }
  const hay = JSON_SEARCH.join(" ");
  return toks.some((t) => hay.includes(t) || JSON_SEARCH.some((k) => k.includes(t)));
}
