import type { NodeCatalogConfig } from "../core/config/config-types";
import { PSOC_E84_GLB_RELATIVE_PATH } from "../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants";
import { defaultFlowWireCameraV1 } from "../features/editor/nodes/camera-view/flow-wire-camera";
import { defaultFlowWireTransformV1 } from "../features/editor/nodes/transform/flow-wire-transform";
import { defaultFlowWireEnvironmentV1 } from "../features/editor/nodes/environment/flow-wire-environment";
import { defaultScene3DConfig, type Scene3DConfigV1 } from "../features/editor/nodes/rotation/scene3d-config";

/**
 * Catalog defaults must persist a **logical** GLB path (`resolveWebviewModelAssetUrl`), not
 * `defaultScene3DConfig().model.url`, which can freeze an environment-specific absolute URL when
 * this module first evaluates (Vite dev vs VS Code webview vs packaged VSIX).
 */
function studioScene3dCatalogDefaults(): Scene3DConfigV1 {
  const base = defaultScene3DConfig();
  return {
    ...base,
    model: { ...base.model, url: PSOC_E84_GLB_RELATIVE_PATH },
  };
}

export const NODE_CATALOG_DEFAULTS: NodeCatalogConfig = {
  configVersion: 1,
  updatedAt: new Date("2026-05-05T00:00:00.000Z").toISOString(),
  payload: {
    nodes: [
      {
        id: "bmi270-input",
        category: "sensor",
        title: "BMI270",
        description:
          "Bosch BMI270: IMU vectors, temperature, fusion Euler (rad: roll, pitch, heading on x,y,z), and quaternion when published.",
        icon: "cpu",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [
          { id: "accel", portType: "vector3", label: "Accel (m/s²)" },
          { id: "gyro", portType: "vector3", label: "Gyro (rad/s)" },
          {
            id: "euler",
            portType: "vector3",
            label: "Euler (rad)",
          },
          {
            id: "quaternion",
            portType: "quaternion",
            label: "Quaternion",
          },
          { id: "temp", portType: "number", label: "Temp (°C)" },
        ],
      },
      {
        id: "bmi270-tap-quaternion",
        category: "sensor",
        title: "Quaternion",
        description:
          "Fusion quaternion only — same stream as the BMI270 node.",
        icon: "orbit",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "quaternion", label: "Quaternion" }],
      },
      {
        id: "bmi270-tap-euler",
        category: "sensor",
        title: "Euler",
        description: "Fusion Euler vector only (rad) from the live BMI270 stream.",
        icon: "compass",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "vector3", label: "Euler" }],
      },
      {
        id: "bmi270-tap-accel",
        category: "sensor",
        title: "Acceleration",
        description: "Acceleration vector (m/s²) from the live BMI270 stream.",
        icon: "arrow-down",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "vector3", label: "Acceleration" }],
      },
      {
        id: "bmi270-tap-gyro",
        category: "sensor",
        title: "Gyroscope",
        description: "Gyro vector (rad/s) from the live BMI270 stream.",
        icon: "rotate-cw",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "vector3", label: "Gyroscope" }],
      },
      {
        id: "bmi270-tap-temp",
        category: "sensor",
        title: "Temperature",
        description: "Die temperature (°C) from the live BMI270 stream.",
        icon: "thermometer",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "number", label: "Temp (°C)" }],
      },
      {
        id: "dps368-input",
        category: "sensor",
        title: "DPS368",
        description:
          "Bosch DPS368: barometric pressure (hPa) and temperature (°C) from the live bitstream.",
        icon: "gauge",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [
          { id: "pressure", portType: "number", label: "Pressure (hPa)" },
          { id: "temp", portType: "number", label: "Temp (°C)" },
        ],
      },
      {
        id: "sht40-input",
        category: "sensor",
        title: "SHT40",
        description:
          "Sensirion SHT40: relative humidity (%RH) and temperature (°C) from the live bitstream.",
        icon: "droplets",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [
          { id: "humidity", portType: "number", label: "Humidity (%RH)" },
          { id: "temp", portType: "number", label: "Temp (°C)" },
        ],
      },
      {
        id: "bmm350-input",
        category: "sensor",
        title: "BMM350",
        description:
          "Bosch BMM350: magnetic field vector (µT) and temperature (°C) from the live bitstream.",
        icon: "magnet",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [
          { id: "magnetic", portType: "vector3", label: "Magnetic (µT)" },
          { id: "temp", portType: "number", label: "Temp (°C)" },
        ],
      },
      {
        id: "dps368-tap-pressure",
        category: "sensor",
        title: "Pressure",
        description:
          "DPS368 barometric pressure (hPa) only — same stream as the DPS368 node.",
        icon: "gauge",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "number", label: "Pressure (hPa)" }],
      },
      {
        id: "dps368-tap-temp",
        category: "sensor",
        title: "Temperature",
        description:
          "DPS368 temperature (°C) only — same stream as the DPS368 node.",
        icon: "thermometer",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "number", label: "Temperature (°C)" }],
      },
      {
        id: "sht40-tap-humidity",
        category: "sensor",
        title: "Humidity",
        description:
          "SHT40 relative humidity (%RH) only — same stream as the SHT40 node.",
        icon: "droplets",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "number", label: "Humidity (%RH)" }],
      },
      {
        id: "sht40-tap-temp",
        category: "sensor",
        title: "Temperature",
        description:
          "SHT40 temperature (°C) only — same stream as the SHT40 node.",
        icon: "thermometer",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "number", label: "Temperature (°C)" }],
      },
      {
        id: "bmm350-tap-magnetic",
        category: "sensor",
        title: "Magnetic",
        description:
          "BMM350 magnetic vector (µT) only — same stream as the BMM350 node.",
        icon: "magnet",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "vector3", label: "Magnetic (µT)" }],
      },
      {
        id: "bmm350-tap-temp",
        category: "sensor",
        title: "Temperature",
        description:
          "BMM350 temperature (°C) only — same stream as the BMM350 node.",
        icon: "thermometer",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [{ id: "out", portType: "number", label: "Temperature (°C)" }],
      },
      {
        // NOTE: disabled for Bitstream workflows (not needed).
        // Keeping the entry slot (instead of deleting file) to preserve config line history.
        id: "sensor-input",
        category: "input",
        title: "Sensor (numeric)",
        description:
          "Subscribe to one allowlisted numeric path from the live sensor stream (configure sourceKey).",
        icon: "circle-dot",
        defaultVisible: false,
        defaultConfig: {
          sourceKey: "bmi270.accel.x",
        },
      },
      {
        id: "number-average",
        category: "utility",
        title: "Average",
        description: "Average all incoming number wires (multi-connect to the input pin).",
        icon: "sigma",
        defaultVisible: true,
        defaultConfig: {},
      },
      {
        id: "vector-splitter",
        category: "utility",
        title: "Vector Splitter",
        description: "Split a vector3 into X, Y, and Z scalar outputs.",
        icon: "git-branch",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [
          { id: "x", portType: "number", label: "X" },
          { id: "y", portType: "number", label: "Y" },
          { id: "z", portType: "number", label: "Z" },
        ],
      },
      {
        id: "quaternion-splitter",
        category: "utility",
        title: "Quaternion Splitter",
        description: "Split a quaternion into X, Y, Z, and W scalar outputs.",
        icon: "git-branch",
        defaultVisible: true,
        defaultConfig: {},
        outputPorts: [
          { id: "x", portType: "number", label: "X" },
          { id: "y", portType: "number", label: "Y" },
          { id: "z", portType: "number", label: "Z" },
          { id: "w", portType: "number", label: "W" },
        ],
      },
      {
        id: "model-select",
        category: "utility",
        title: "Studio Model",
        description:
          "GLB from the Asset Browser or catalog dropdown. Drag a model from Asset Browser onto the canvas to spawn this node. Wire **Model** into a Model Viewer (or 3D Rotation) input.",
        icon: "package",
        defaultVisible: true,
        defaultConfig: {
          selectedStudioAssetId: "",
          selectedModelUrl: "",
          generatedChildNodeIds: [],
        },
        outputPorts: [{ id: "out", portType: "string", label: "Model" }],
      },
      {
        id: "environment",
        category: "utility",
        title: "Environment",
        description:
          "Author cubemap / HDRI, background, and IBL settings once. Wire the output into the **Environment** input on 3D Rotation or Model Viewer nodes to override their saved scene environment while connected. Optional **boolean / number** inputs (exposed per pin in the inspector) let other nodes drive Use IBL, background texture, IBL strength, IBL-off fraction, and environment yaw; a connected wire overrides the on-card control for that field.",
        icon: "globe",
        defaultVisible: true,
        defaultConfig: {
          ...(defaultFlowWireEnvironmentV1() as unknown as Record<string, unknown>),
          inputSocketVisibility: {},
        },
        outputPorts: [{ id: "out", portType: "environment", label: "Environment" }],
      },
      {
        id: "camera-view",
        category: "utility",
        title: "Camera / View",
        description:
          "Author FOV, camera position, look-at target, and orbit distance limits once. Wire the output into the **Camera** input on Model Viewer or 3D Rotation nodes to override their saved scene camera while connected.",
        icon: "camera",
        defaultVisible: true,
        defaultConfig: {
          ...(defaultFlowWireCameraV1() as unknown as Record<string, unknown>),
        },
        outputPorts: [{ id: "out", portType: "camera", label: "Camera" }],
      },
      {
        id: "object-transform",
        category: "utility",
        title: "Object Transform",
        description:
          "Author model position, rotation (degrees), and scale once. Wire the output into the **Transform** input on Model Viewer or 3D Rotation nodes to override their saved scene transform while connected.",
        icon: "box",
        defaultVisible: true,
        defaultConfig: {
          ...(defaultFlowWireTransformV1() as unknown as Record<string, unknown>),
        },
        outputPorts: [{ id: "out", portType: "transform", label: "Transform" }],
      },
      {
        id: "transform-from-euler",
        category: "utility",
        title: "Transform from Euler",
        description:
          "Convert a **vector3** Euler wire (radians: roll, pitch, heading) into a **Transform** wire for Model Viewer / 3D Rotation **Transform** inputs. Choose **IMU / fusion** or **literal scene XYZ** mapping on the Node tab. Position and scale stay at defaults unless you chain through **Object Transform**.",
        icon: "rotate-cw",
        defaultVisible: true,
        defaultConfig: {
          eulerMapping: "fusion",
        },
        inputPorts: [{ id: "in", portType: "vector3", label: "Euler" }],
        outputPorts: [{ id: "out", portType: "transform", label: "Transform" }],
      },
      {
        id: "glb-animation-bundle",
        category: "utility",
        title: "GLB Animation Bundle",
        description:
          "Drive GLB animation clips with a structured wire. When the node is linked to the same Model as your viewer (add from palette with Model selected), the inspector lists clip names from the GLB — toggle each clip and set time (s) and speed without JSON. Wire out into **Model Viewer** or **3D Rotation** **Animation**. Optional Advanced section edits raw clips JSON.",
        icon: "clapperboard",
        defaultVisible: true,
        defaultConfig: {
          clips: {},
        },
        outputPorts: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
      },
      {
        id: "map-range",
        category: "transform",
        title: "Map Range",
        description: "Map incoming value from input range to output range.",
        icon: "between-horizontal-start",
        defaultVisible: true,
        defaultConfig: {
          inMin: 0,
          inMax: 1,
          outMin: -1,
          outMax: 1,
          clamp: true,
        },
      },
      {
        id: "clamp",
        category: "transform",
        title: "Clamp",
        description: "Clamp incoming value to configured min/max.",
        icon: "shrink",
        defaultVisible: true,
        defaultConfig: {
          min: -1,
          max: 1,
        },
      },
      {
        id: "low-pass",
        category: "transform",
        title: "Low Pass",
        description: "Smooth incoming value using alpha blending.",
        icon: "waves",
        defaultVisible: true,
        defaultConfig: {
          alpha: 0.2,
        },
      },
      {
        id: "on-click",
        category: "logic",
        title: "On Click",
        description:
          "Emit an **event** pulse when you click empty canvas space (not on a node). Choose left or right click on the **Node** tab. Wire into **Set Boolean**, **Toggle Boolean**, or future actions.",
        icon: "mouse-pointer-click",
        defaultVisible: true,
        defaultConfig: {
          button: "left",
        },
        outputPorts: [{ id: "out", portType: "event", label: "Click" }],
      },
      {
        id: "event-set-boolean",
        category: "logic",
        title: "Set Boolean",
        description:
          "On each incoming **event** pulse, set the boolean **out** wire to a configured ON/OFF value (does not flip). Wire into **Indicator** or other boolean consumers.",
        icon: "toggle-left",
        defaultVisible: true,
        defaultConfig: {
          setTo: true,
          value: false,
        },
        inputPorts: [{ id: "in", portType: "event", label: "Trigger" }],
        outputPorts: [{ id: "out", portType: "boolean", label: "Out" }],
      },
      {
        id: "on-key",
        category: "logic",
        title: "On Key",
        description:
          "Emit an **event** pulse when a keyboard key is pressed while the canvas has focus. Wire into **Toggle Boolean** or future action nodes. Configure the key on the **Node** tab.",
        icon: "keyboard",
        defaultVisible: true,
        defaultConfig: {
          key: "KeyR",
          requireCtrl: false,
          requireShift: false,
          requireAlt: false,
        },
        outputPorts: [{ id: "out", portType: "event", label: "Key down" }],
      },
      {
        id: "event-toggle-boolean",
        category: "logic",
        title: "Toggle Boolean",
        description:
          "On each incoming **event** pulse, flip the boolean **out** wire. Wire into **Indicator** or other boolean consumers.",
        icon: "toggle-left",
        defaultVisible: true,
        defaultConfig: {
          value: false,
        },
        inputPorts: [{ id: "in", portType: "event", label: "Trigger" }],
        outputPorts: [{ id: "out", portType: "boolean", label: "Out" }],
      },
      {
        id: "event-toggle-glb-part",
        category: "logic",
        title: "Toggle GLB Part",
        description:
          "On each incoming **event** pulse, flip **part** visibility for a GLB part bound from the Library **GLB** tab (0 hidden, 1 visible). Requires a linked **Model viewer** on the same Model.",
        icon: "eye",
        defaultVisible: true,
        defaultConfig: {
          value: 1,
        },
        inputPorts: [
          { id: "in", portType: "event", label: "Trigger" },
          { id: "model", portType: "string", label: "Model" },
        ],
      },
      {
        id: "event-set-glb-part",
        category: "logic",
        title: "Set GLB Part",
        description:
          "On each incoming **event** pulse, set **part** visibility to a configured visible/hidden state for a GLB part bound from the Library **GLB** tab.",
        icon: "eye",
        defaultVisible: true,
        defaultConfig: {
          setTo: 1,
          value: 0,
        },
        inputPorts: [
          { id: "in", portType: "event", label: "Trigger" },
          { id: "model", portType: "string", label: "Model" },
        ],
      },
      {
        id: "event-trigger-glb-anim",
        category: "logic",
        title: "Trigger GLB Anim",
        description:
          "On each incoming **event** pulse, restart a bound GLB **animation** clip in the **Model viewer** for the wired **Model** (default **once**). Wire **Studio Model → Model** for multi-model graphs; spawn from Library **GLB → Animations → Evt**.",
        icon: "clapperboard",
        defaultVisible: true,
        defaultConfig: {
          triggerNonce: 0,
          speed: 1,
          weight: 1,
          loopMode: "once",
        },
        inputPorts: [
          { id: "in", portType: "event", label: "Trigger" },
          { id: "model", portType: "string", label: "Model" },
        ],
      },
      {
        id: "threshold",
        category: "transform",
        title: "Threshold",
        description: "Compare input value against configured threshold.",
        icon: "gauge",
        defaultVisible: true,
        defaultConfig: {
          operator: ">",
          value: 0.5,
        },
      },
      {
        id: "indicator",
        category: "output",
        title: "Indicator",
        description: "Show boolean state as on/off indicator.",
        icon: "circle-dot",
        defaultVisible: true,
        defaultConfig: {
          label: "Indicator",
        },
      },
      {
        id: "gauge",
        category: "output",
        title: "Gauge",
        description: "Show numeric value as a compact gauge tile.",
        icon: "gauge",
        defaultVisible: true,
        defaultConfig: {
          unit: "",
          decimals: 3,
        },
      },
      {
        id: "sparkline",
        category: "output",
        title: "Sparkline",
        description: "Render a short trend line from incoming number values.",
        icon: "chart-spline",
        defaultVisible: true,
        defaultConfig: {
          historySize: 24,
        },
      },
      {
        id: "plotter",
        category: "output",
        title: "Plotter",
        description:
          "Multi-channel trend chart: one point per flow update (typically each telemetry frame). Wire scalars to Ch 1–4.",
        icon: "activity",
        defaultVisible: true,
        inputPorts: [
          { id: "ch1", portType: "number", label: "Ch 1" },
          { id: "ch2", portType: "number", label: "Ch 2" },
          { id: "ch3", portType: "number", label: "Ch 3" },
          { id: "ch4", portType: "number", label: "Ch 4" },
        ],
        defaultConfig: {
          historyLength: 256,
          verticalGain: 1,
          verticalOffset: 0,
          autoScale: true,
          yMin: -1,
          yMax: 1,
          showGrid: true,
          timeDivisions: 8,
          ampDivisions: 6,
          showLegend: true,
          channels: {
            ch1: {
              label: "Ch 1",
              visible: true,
              colorHex: "#22d3ee",
              lineStyle: "solid",
              lineWidthPx: 1.75,
              marker: "none",
              markerEvery: 8,
            },
            ch2: {
              label: "Ch 2",
              visible: true,
              colorHex: "#fbbf24",
              lineStyle: "solid",
              lineWidthPx: 1.75,
              marker: "none",
              markerEvery: 8,
            },
            ch3: {
              label: "Ch 3",
              visible: true,
              colorHex: "#34d399",
              lineStyle: "solid",
              lineWidthPx: 1.75,
              marker: "none",
              markerEvery: 8,
            },
            ch4: {
              label: "Ch 4",
              visible: true,
              colorHex: "#fb7185",
              lineStyle: "solid",
              lineWidthPx: 1.75,
              marker: "none",
              markerEvery: 8,
            },
          },
        },
      },
      {
        id: "rotation-3d-euler",
        category: "output",
        title: "3D Rotation (Euler)",
        description:
          "Preview 3D object orientation from Euler vector input (rad), using a vanilla Three.js viewport for reliable resizing. Optional **Environment** input overrides HDRI / background / IBL; optional **Camera** overrides orbit camera and limits; optional **Animation** carries a structured clip map from **GLB Animation Bundle**; optional **Transform** overrides model position / rotation / scale.",
        icon: "box",
        defaultVisible: true,
        defaultConfig: {
          showGrid: true,
          scene3d: studioScene3dCatalogDefaults(),
        },
        inputPorts: [
          { id: "in", portType: "vector3", label: "Euler (rad)" },
          { id: "env", portType: "environment", label: "Environment" },
          { id: "cam", portType: "camera", label: "Camera" },
          { id: "anim", portType: "glbAnimation", label: "Animation" },
          { id: "xf", portType: "transform", label: "Transform" },
        ],
      },
      {
        id: "rotation-3d-quaternion",
        category: "output",
        title: "3D Rotation (Quaternion)",
        description:
          "Preview 3D object orientation from quaternion input, using a vanilla Three.js viewport for reliable resizing. Optional **Environment** input overrides HDRI / background / IBL; optional **Camera** overrides orbit camera and limits; optional **Animation** carries a structured clip map from **GLB Animation Bundle**; optional **Transform** overrides model position / rotation / scale.",
        icon: "box",
        defaultVisible: true,
        defaultConfig: {
          showGrid: true,
          scene3d: studioScene3dCatalogDefaults(),
        },
        inputPorts: [
          { id: "in", portType: "quaternion", label: "Quaternion" },
          { id: "env", portType: "environment", label: "Environment" },
          { id: "cam", portType: "camera", label: "Camera" },
          { id: "anim", portType: "glbAnimation", label: "Animation" },
          { id: "xf", portType: "transform", label: "Transform" },
        ],
      },
      {
        id: "model-viewer",
        category: "output",
        title: "Model Viewer",
        description:
          "GLB preview in a Three.js viewport. Wire a **Studio Model** node (or Asset Browser drag) into **Model**; preview stays empty until a model URL is wired. Optional **Environment** overrides HDRI / background / IBL; optional **Camera** overrides orbit camera and limits; optional **Animation** carries a structured clip map from **GLB Animation Bundle**; optional **Transform** overrides model position / rotation / scale.",
        icon: "scan-line",
        defaultVisible: true,
        defaultConfig: {
          showGrid: true,
          fallbackModelUrl: "",
          scene3d: studioScene3dCatalogDefaults(),
        },
        inputPorts: [
          { id: "in", portType: "string", label: "Model" },
          { id: "env", portType: "environment", label: "Environment" },
          { id: "cam", portType: "camera", label: "Camera" },
          { id: "anim", portType: "glbAnimation", label: "Animation" },
          { id: "xf", portType: "transform", label: "Transform" },
        ],
      },
      // ── Display / Control nodes ──────────────────────────────────────────
      {
        id: "radial-gauge",
        category: "output",
        title: "Radial Gauge",
        description:
          "Canvas arc gauge with needle, colored zones, and tick marks. Accepts a numeric input wire.",
        icon: "gauge",
        defaultVisible: true,
        defaultConfig: {
          min: 0,
          max: 100,
          unit: "",
          decimals: 1,
          zones: [
            { from: 0,  to: 60,  color: "#22d3ee" },
            { from: 60, to: 80,  color: "#fbbf24" },
            { from: 80, to: 100, color: "#f87171" },
          ],
        },
      },
      {
        id: "bar-meter",
        category: "output",
        title: "Bar Meter",
        description:
          "Vertical or horizontal bar meter with colored zones and peak-hold marker.",
        icon: "bar-chart-2",
        defaultVisible: true,
        defaultConfig: {
          min: 0,
          max: 100,
          unit: "",
          decimals: 1,
          orientation: "vertical",
          showPeakHold: true,
          zones: [
            { from: 0,  to: 60,  color: "#22d3ee" },
            { from: 60, to: 80,  color: "#fbbf24" },
            { from: 80, to: 100, color: "#f87171" },
          ],
        },
      },
      {
        id: "led-indicator",
        category: "output",
        title: "LED Indicator",
        description:
          "Glowing LED indicator. Boolean wire → on/off. Number wire → on when value ≥ threshold.",
        icon: "circle-dot",
        defaultVisible: true,
        defaultConfig: {
          label: "LED",
          onColor: "#22c55e",
          offColor: "#18181b",
          threshold: 0.5,
          blink: false,
        },
      },
      {
        id: "knob",
        category: "generator",
        title: "Knob",
        description:
          "Interactive rotary knob. Drag up/down or scroll to change value. Outputs a number wire.",
        icon: "circle-slash-2",
        defaultVisible: true,
        defaultConfig: {
          min: 0,
          max: 100,
          value: 50,
          step: 0,
          unit: "",
          decimals: 1,
          zones: [
            { from: 0,  to: 60,  color: "#22d3ee" },
            { from: 60, to: 80,  color: "#fbbf24" },
            { from: 80, to: 100, color: "#f87171" },
          ],
        },
        outputPorts: [{ id: "out", portType: "number", label: "Value" }],
      },
      {
        id: "numeric-display",
        category: "output",
        title: "Numeric Display",
        description:
          "Large digital readout with optional label, unit, and zone-based color coding.",
        icon: "hash",
        defaultVisible: true,
        defaultConfig: {
          label: "",
          unit: "",
          decimals: 2,
          showStatusBar: true,
          zones: [
            { from: 0,  to: 60,  color: "rgba(228,228,231,0.95)" },
            { from: 60, to: 80,  color: "#fbbf24" },
            { from: 80, to: 100, color: "#f87171" },
          ],
        },
      },
      // ─────────────────────────────────────────────────────────────────────
      {
        id: "sine-wave",
        category: "generator",
        title: "Sine Wave",
        description: "Generate a synthetic sine wave signal for testing and simulation.",
        icon: "activity",
        defaultVisible: true,
        defaultConfig: {
          frequency: 1,
          amplitude: 1,
          offset: 0,
          phase: 0,
        },
        outputPorts: [{ id: "out", portType: "number", label: "Wave" }],
      },
      {
        id: "boolean-constant",
        category: "generator",
        title: "Boolean",
        description:
          "Fixed boolean on the **`out`** wire. Toggle on the **node card** or in the **inspector Node** tab.",
        icon: "toggle-left",
        defaultVisible: true,
        defaultConfig: {
          value: true,
        },
        outputPorts: [{ id: "out", portType: "boolean", label: "Out" }],
      },
      {
        id: "number-constant",
        category: "generator",
        title: "Number",
        description:
          "Fixed number on the **`out`** wire. Edit on the **node card** (input or slider) or in the **inspector Node** tab (same options plus min / max / step).",
        icon: "hash",
        defaultVisible: true,
        defaultConfig: {
          value: 1,
          numberMode: "float",
          cardValueControl: "input",
        },
        outputPorts: [{ id: "out", portType: "number", label: "Out" }],
      },
      {
        id: "glb-material-param",
        category: "generator",
        title: "GLB Material Param",
        description:
          "Drive a PBR channel (emissive, roughness, metalness, opacity) on a named GLB material. Spawn from Library **GLB → Materials** or bind `glbExtractKind: material` manually. Preview updates on Model Viewer / 3D Rotation nodes linked to the same Model.",
        icon: "palette",
        defaultVisible: true,
        defaultConfig: {
          value: 0,
          numberMode: "float",
          cardValueControl: "input",
          glbMaterialParam: "emissive",
        },
        outputPorts: [{ id: "out", portType: "number", label: "Out" }],
      },
      {
        id: "glb-material-texture",
        category: "generator",
        title: "GLB Material Texture",
        description:
          "Swap a texture map (base color, normal, roughness, etc.) on a named GLB material. Spawn from Library **GLB → Materials → Tex** or bind `glbExtractKind: material` manually. Pick a 2D texture on the node card.",
        icon: "image",
        defaultVisible: true,
        defaultConfig: {
          glbMaterialTextureSlot: "map",
          textureUrl: "",
          selectedStudioTextureAssetId: "",
        },
        outputPorts: [{ id: "out", portType: "string", label: "Texture URL" }],
      },
    ],
  },
};
