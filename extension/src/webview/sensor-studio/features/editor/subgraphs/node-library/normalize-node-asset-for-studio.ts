import type { Edge, Node } from "@xyflow/react";
import type { StudioPortType } from "../../store/flow-editor.store";
import type { StudioGroupInterface, StudioSubgraphDocument } from "../studio-subgraph.types";
import {
  STUDIO_NODE_ASSET_MARKER,
  STUDIO_NODE_ASSET_VERSION,
  type StudioNodeAssetFile,
} from "./studio-node-asset-file";

const NA_HOST = "nodeGroup";
const NA_INPUT = "groupInput";
const NA_OUTPUT = "groupOutput";

function mapPortType(raw: unknown): StudioPortType {
  if (raw === "number" || raw === "float") {
    return "number";
  }
  if (raw === "boolean") {
    return "boolean";
  }
  if (raw === "string") {
    return "string";
  }
  if (raw === "vector3") {
    return "vector3";
  }
  if (raw === "quaternion") {
    return "quaternion";
  }
  if (raw === "event") {
    return "event";
  }
  if (raw === "environment" || raw === "env") {
    return "environment";
  }
  if (raw === "camera" || raw === "cam") {
    return "camera";
  }
  if (raw === "animation" || raw === "anim") {
    return "animation";
  }
  if (raw === "transform" || raw === "xf") {
    return "transform";
  }
  return "number";
}

function normalizeGroupInterface(raw: unknown): StudioGroupInterface {
  if (raw == null || typeof raw !== "object") {
    return { inputs: [], outputs: [] };
  }
  const iface = raw as {
    inputs?: Array<Record<string, unknown>>;
    outputs?: Array<Record<string, unknown>>;
  };
  const mapSocket = (socket: Record<string, unknown>, direction: "input" | "output") => ({
    id: typeof socket.id === "string" ? socket.id : `sock_${Math.random().toString(36).slice(2, 8)}`,
    label: typeof socket.label === "string" ? socket.label : "Value",
    portType: mapPortType(socket.portType ?? socket.type),
    direction,
    boundaryKey:
      typeof socket.boundaryKey === "string"
        ? socket.boundaryKey
        : `${direction}:${String(socket.label ?? "Value")}`,
  });
  return {
    inputs: Array.isArray(iface.inputs) ? iface.inputs.map((s) => mapSocket(s, "input")) : [],
    outputs: Array.isArray(iface.outputs) ? iface.outputs.map((s) => mapSocket(s, "output")) : [],
  };
}

function normalizeInnerNode(node: Node): Node {
  if (node.type === NA_HOST) {
    return {
      ...node,
      type: "studio-node-group",
      data: {
        ...(node.data as Record<string, unknown>),
      },
    };
  }
  if (node.type === NA_INPUT) {
    return {
      ...node,
      type: "studio-group-input",
      data: {
        role: "input",
        interface: normalizeGroupInterface((node.data as { interface?: unknown })?.interface),
      },
    };
  }
  if (node.type === NA_OUTPUT) {
    return {
      ...node,
      type: "studio-group-output",
      data: {
        role: "output",
        interface: normalizeGroupInterface((node.data as { interface?: unknown })?.interface),
      },
    };
  }
  if (node.type === "float" || node.type === "number") {
    const data = node.data as Record<string, unknown>;
    const value = typeof data.value === "number" ? data.value : 0;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Constant",
        category: "generator",
        nodeId: "number-constant",
        defaultConfig: { value },
      },
    };
  }
  if (node.type === "math") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Math",
        category: "utility",
        nodeId: "math",
        defaultConfig: {
          operation: typeof data.operation === "string" ? data.operation : "add",
        },
      },
    };
  }
  if (node.type === "compare") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Compare",
        category: "logic",
        nodeId: "compare",
        defaultConfig: {
          operation: typeof data.operation === "string" ? data.operation : ">",
        },
      },
    };
  }
  if (node.type === "lerp") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Lerp",
        category: "utility",
        nodeId: "lerp",
        defaultConfig: {},
      },
    };
  }
  if (node.type === "switch" || node.type === "ifElse") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : node.type === "ifElse" ? "If / Else" : "Switch",
        category: "logic",
        nodeId: "switch",
        defaultConfig: {},
      },
    };
  }
  if (node.type === "combineXYZ") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Combine XYZ",
        category: "utility",
        nodeId: "combine-xyz",
        defaultConfig: {},
      },
    };
  }
  if (node.type === "logicGate") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Logic Gate",
        category: "logic",
        nodeId: "logic-gate",
        defaultConfig: {
          operation: typeof data.operation === "string" ? data.operation : "and",
        },
      },
    };
  }
  if (node.type === "multiplexer") {
    const data = node.data as Record<string, unknown>;
    const pathsRaw = data.paths;
    const paths =
      pathsRaw != null && typeof pathsRaw === "object" && !Array.isArray(pathsRaw)
        ? (pathsRaw as Record<string, string>)
        : { a: "a", b: "b", c: "c" };
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Multiplexer",
        category: "utility",
        nodeId: "multiplexer",
        defaultConfig: { paths },
      },
    };
  }
  if (node.type === "valueNormalizer") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Normalize",
        category: "utility",
        nodeId: "value-normalizer",
        defaultConfig: {
          inMin: typeof data.inMin === "number" ? data.inMin : 0,
          inMax: typeof data.inMax === "number" ? data.inMax : 1,
          outMin: typeof data.outMin === "number" ? data.outMin : 0,
          outMax: typeof data.outMax === "number" ? data.outMax : 1,
        },
      },
    };
  }
  if (node.type === "mapRange") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Map Range",
        category: "transform",
        nodeId: "map-range",
        defaultConfig: {
          value: typeof data.value === "number" ? data.value : 0,
          inMin: typeof data.inMin === "number" ? data.inMin : 0,
          inMax: typeof data.inMax === "number" ? data.inMax : 1,
          outMin: typeof data.outMin === "number" ? data.outMin : -1,
          outMax: typeof data.outMax === "number" ? data.outMax : 1,
          clamp: data.clamp !== false,
        },
      },
    };
  }
  if (node.type === "clamp") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Clamp",
        category: "transform",
        nodeId: "clamp",
        defaultConfig: {
          value: typeof data.value === "number" ? data.value : 0,
          min: typeof data.min === "number" ? data.min : 0,
          max: typeof data.max === "number" ? data.max : 1,
        },
      },
    };
  }
  if (node.type === "bool") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Boolean",
        category: "generator",
        nodeId: "boolean-constant",
        defaultConfig: { value: data.value === true },
      },
    };
  }
  if (node.type === "vector") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Vector",
        category: "generator",
        nodeId: "vector-constant",
        defaultConfig: {
          x: typeof data.x === "number" ? data.x : 0,
          y: typeof data.y === "number" ? data.y : 0,
          z: typeof data.z === "number" ? data.z : 0,
        },
      },
    };
  }
  if (node.type === "sineWaveSim") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Sine Wave",
        category: "generator",
        nodeId: "sine-wave",
        defaultConfig: {
          amplitude: typeof data.amplitude === "number" ? data.amplitude : 1,
          frequency: typeof data.frequency === "number" ? data.frequency : 1,
          phase: typeof data.phase === "number" ? data.phase : 0,
          offset: typeof data.offset === "number" ? data.offset : 0,
        },
      },
    };
  }
  if (node.type === "rampSim") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Ramp",
        category: "generator",
        nodeId: "ramp-sim",
        defaultConfig: {
          rate: typeof data.rate === "number" ? data.rate : 0.1,
          min: typeof data.min === "number" ? data.min : 0,
          max: typeof data.max === "number" ? data.max : 1,
          wrap: data.wrap !== false,
        },
      },
    };
  }
  if (node.type === "stepSim") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Step",
        category: "generator",
        nodeId: "step-sim",
        defaultConfig: {
          interval: typeof data.interval === "number" ? data.interval : 1,
          low: typeof data.low === "number" ? data.low : 0,
          high: typeof data.high === "number" ? data.high : 1,
        },
      },
    };
  }
  if (node.type === "noiseSim") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Noise",
        category: "generator",
        nodeId: "noise-sim",
        defaultConfig: {
          seed: typeof data.seed === "number" ? data.seed : 1,
          amplitude: typeof data.amplitude === "number" ? data.amplitude : 1,
          offset: typeof data.offset === "number" ? data.offset : 0,
          smooth: typeof data.smooth === "number" ? data.smooth : 0.25,
        },
      },
    };
  }
  if (
    node.type === "environment" ||
    node.type === "environmentHdri" ||
    node.type === "environmentCubemap"
  ) {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Environment",
        category: "utility",
        nodeId: "environment",
        defaultConfig: {
          presetIndex: 0,
          useIbl: true,
          iblStrength: typeof data.intensity === "number" ? data.intensity : 1,
        },
      },
    };
  }
  if (node.type === "texture") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "GLB Texture",
        category: "transform",
        nodeId: "glb-material-texture",
        defaultConfig: {
          mapSlot: "map",
          url: typeof data.url === "string" ? data.url : "",
        },
      },
    };
  }
  if (node.type === "camera") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Camera View",
        category: "utility",
        nodeId: "camera-view",
        defaultConfig: {
          fovDeg: typeof data.fov === "number" ? data.fov : 50,
        },
      },
    };
  }
  if (node.type === "transform") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Object Transform",
        category: "utility",
        nodeId: "object-transform",
        defaultConfig: {
          position: {
            x: typeof data.posX === "number" ? data.posX : 0,
            y: typeof data.posY === "number" ? data.posY : 0,
            z: typeof data.posZ === "number" ? data.posZ : 0,
          },
        },
      },
    };
  }
  if (node.type === "animationClip" || node.type === "animationPlayer") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "GLB Animation Bundle",
        category: "utility",
        nodeId: "glb-animation-bundle",
        defaultConfig: {
          clipName: typeof data.clip === "string" ? data.clip : "",
        },
      },
    };
  }
  if (node.type === "visibility") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Toggle GLB Part",
        category: "logic",
        nodeId: "event-toggle-glb-part",
        defaultConfig: {
          partPath: typeof data.partName === "string" ? data.partName : "root",
        },
      },
    };
  }
  if (node.type === "time") {
    return {
      ...node,
      type: "studio",
      data: {
        label: "Scene Time",
        category: "generator",
        nodeId: "scene-time",
        defaultConfig: {},
      },
    };
  }
  if (node.type === "frameDelta") {
    return {
      ...node,
      type: "studio",
      data: {
        label: "Frame Delta",
        category: "generator",
        nodeId: "frame-delta",
        defaultConfig: {},
      },
    };
  }
  if (node.type === "debug") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Debug",
        category: "generator",
        nodeId: "debug",
        defaultConfig: {
          value: typeof data.value === "number" ? data.value : 0,
        },
      },
    };
  }
  if (node.type === "position") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Position",
        category: "utility",
        nodeId: "position",
        defaultConfig: {
          px: typeof data.px === "number" ? data.px : 0,
          py: typeof data.py === "number" ? data.py : 0,
          pz: typeof data.pz === "number" ? data.pz : 0,
        },
      },
    };
  }
  if (node.type === "rotation") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Rotation",
        category: "utility",
        nodeId: "rotation",
        defaultConfig: {
          rx: typeof data.rx === "number" ? data.rx : 0,
          ry: typeof data.ry === "number" ? data.ry : 0,
          rz: typeof data.rz === "number" ? data.rz : 0,
        },
      },
    };
  }
  if (node.type === "scale") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Scale",
        category: "utility",
        nodeId: "scale",
        defaultConfig: {
          sx: typeof data.sx === "number" ? data.sx : 1,
          sy: typeof data.sy === "number" ? data.sy : 1,
          sz: typeof data.sz === "number" ? data.sz : 1,
        },
      },
    };
  }
  if (node.type === "sceneSettings") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Scene Settings",
        category: "utility",
        nodeId: "scene-settings",
        defaultConfig: {
          exposure: typeof data.exposure === "number" ? data.exposure : 1,
        },
      },
    };
  }
  if (node.type === "fog") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Fog",
        category: "utility",
        nodeId: "fog",
        defaultConfig: {
          near: typeof data.near === "number" ? data.near : 1,
          far: typeof data.far === "number" ? data.far : 50,
          density: typeof data.density === "number" ? data.density : 0.05,
        },
      },
    };
  }
  if (node.type === "morph") {
    const data = node.data as Record<string, unknown>;
    const label = typeof data.label === "string" ? data.label : "";
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Morph Target",
        category: "utility",
        nodeId: "morph-target",
        defaultConfig: {
          morphTargetId: label,
          value: typeof data.value === "number" ? data.value : 0,
        },
      },
    };
  }
  if (node.type === "light") {
    const data = node.data as Record<string, unknown>;
    const lightType = data.type === "directional" ? "directional" : "point";
    return {
      ...node,
      type: "studio",
      data: {
        label:
          typeof data.graphTitle === "string"
            ? data.graphTitle
            : lightType === "directional"
              ? "Directional Light"
              : "Point Light",
        category: "utility",
        nodeId: "scene-light",
        defaultConfig: {
          lightType,
          lightTarget: typeof data.label === "string" ? data.label : "",
          intensity: typeof data.intensity === "number" ? data.intensity : 1,
          r: typeof data.r === "number" ? data.r : 1,
          g: typeof data.g === "number" ? data.g : 1,
          b: typeof data.b === "number" ? data.b : 1,
          x: typeof data.x === "number" ? data.x : 0,
          y: typeof data.y === "number" ? data.y : 5,
          z: typeof data.z === "number" ? data.z : 0,
        },
      },
    };
  }
  if (node.type === "cameraSwitch") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Camera Switch",
        category: "utility",
        nodeId: "camera-switch",
        defaultConfig: {
          index: typeof data.index === "number" ? data.index : 0,
        },
      },
    };
  }
  if (node.type === "postProcessing") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Post-Processing",
        category: "utility",
        nodeId: "post-processing",
        defaultConfig: {
          enableBloom: data.enableBloom !== false,
          bloomIntensity: typeof data.bloomIntensity === "number" ? data.bloomIntensity : 1.5,
          bloomThreshold: typeof data.bloomThreshold === "number" ? data.bloomThreshold : 1.0,
        },
      },
    };
  }
  if (node.type === "contactShadows") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Contact Shadows",
        category: "utility",
        nodeId: "contact-shadows",
        defaultConfig: {
          opacity: typeof data.opacity === "number" ? data.opacity : 0.5,
          blur: typeof data.blur === "number" ? data.blur : 2,
          far: typeof data.far === "number" ? data.far : 10,
          scale: typeof data.scale === "number" ? data.scale : 10,
        },
      },
    };
  }
  if (node.type === "emitter") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Particle Emitter",
        category: "utility",
        nodeId: "particle-emitter",
        defaultConfig: {
          preset: typeof data.preset === "string" ? data.preset : "sparks",
          rate: typeof data.rate === "number" ? data.rate : 0,
          life: typeof data.life === "number" ? data.life : 1,
          color: typeof data.color === "string" ? data.color : "#ffaa00",
          trigger: typeof data.trigger === "number" ? data.trigger : 0,
        },
      },
    };
  }
  if (node.type === "uvTransform") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "UV Transform",
        category: "utility",
        nodeId: "uv-transform",
        defaultConfig: {
          uvScaleU: typeof data.uvScaleU === "number" ? data.uvScaleU : 1,
          uvScaleV: typeof data.uvScaleV === "number" ? data.uvScaleV : 1,
          uvOffsetU: typeof data.uvOffsetU === "number" ? data.uvOffsetU : 0,
          uvOffsetV: typeof data.uvOffsetV === "number" ? data.uvOffsetV : 0,
          uvRotation: typeof data.uvRotation === "number" ? data.uvRotation : 0,
        },
      },
    };
  }
  if (node.type === "materialVariant") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Material Variant",
        category: "utility",
        nodeId: "material-variant",
        defaultConfig: {
          modelSourceId: typeof data.modelSourceId === "string" ? data.modelSourceId : "",
          variant: typeof data.variant === "string" ? data.variant : "",
        },
      },
    };
  }
  if (node.type === "material") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "GLB Material Color",
        category: "generator",
        nodeId: "glb-material-color",
        defaultConfig: {
          r: typeof data.r === "number" ? data.r : 1,
          g: typeof data.g === "number" ? data.g : 1,
          b: typeof data.b === "number" ? data.b : 1,
        },
      },
    };
  }
  if (node.type === "dataSource" || node.type === "wsClient") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label:
          typeof data.graphTitle === "string"
            ? data.graphTitle
            : node.type === "wsClient"
              ? "WebSocket In"
              : "Data Source",
        category: "input",
        nodeId: "sensor-input",
        defaultConfig: {
          sourceKey:
            typeof data.channel === "string" && data.channel.trim()
              ? data.channel.trim()
              : typeof data.url === "string" && data.url.trim()
                ? data.url.trim()
                : "",
        },
      },
    };
  }
  if (node.type === "wsClientOut") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "WebSocket Out",
        category: "input",
        nodeId: "sensor-input",
        defaultConfig: {
          sourceKey:
            typeof data.channel === "string" && data.channel.trim()
              ? `${data.channel.trim()}:out`
              : "ws:out",
        },
      },
    };
  }
  if (node.type === "separateXYZ") {
    const data = node.data as Record<string, unknown>;
    return {
      ...node,
      type: "studio",
      data: {
        label: typeof data.graphTitle === "string" ? data.graphTitle : "Vector Splitter",
        category: "utility",
        nodeId: "vector-splitter",
        defaultConfig: {},
      },
    };
  }
  if (node.type === "studio") {
    return node;
  }
  return node;
}

function remapNaEdgeHandle(handle: string | null | undefined): string | undefined {
  if (handle == null) {
    return handle;
  }
  switch (handle) {
    case "inX":
      return "x";
    case "inY":
      return "y";
    case "inZ":
      return "z";
    case "outX":
      return "x";
    case "outY":
      return "y";
    case "outZ":
      return "z";
    default:
      return handle;
  }
}

function normalizeSubgraphEdge(edge: Edge): Edge {
  return {
    ...edge,
    sourceHandle: remapNaEdgeHandle(edge.sourceHandle ?? undefined),
    targetHandle: remapNaEdgeHandle(edge.targetHandle ?? undefined),
  };
}

function normalizeSubgraphDocument(doc: StudioSubgraphDocument): StudioSubgraphDocument {
  const interfaceNorm = normalizeGroupInterface(doc.interface);
  return {
    ...doc,
    interface: interfaceNorm,
    nodes: doc.nodes.map((node) => {
      const normalized = normalizeInnerNode(node as Node);
      if (normalized.type === "studio-group-input" || normalized.type === "studio-group-output") {
        return {
          ...normalized,
          data: {
            ...(normalized.data as Record<string, unknown>),
            interface: interfaceNorm,
          },
        };
      }
      return normalized;
    }) as Node[],
    edges: doc.edges.map((edge) => normalizeSubgraphEdge(edge as Edge)) as Edge[],
  };
}

/**
 * Convert node-animator `.trn-node-asset.json` shapes into Sensor Studio subgraph types.
 */
export function normalizeNodeAssetForStudio(raw: Partial<StudioNodeAssetFile>): StudioNodeAssetFile | null {
  if (raw.marker !== STUDIO_NODE_ASSET_MARKER || raw.version !== STUDIO_NODE_ASSET_VERSION) {
    return null;
  }
  if (!raw.meta || typeof raw.meta.name !== "string") {
    return null;
  }
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    return null;
  }
  if (raw.subgraphs == null || typeof raw.subgraphs !== "object" || Array.isArray(raw.subgraphs)) {
    return null;
  }

  const nodes = (raw.nodes as Node[]).map((node) => {
    if (node.type === NA_HOST || node.type === "studio-node-group") {
      return normalizeInnerNode(node);
    }
    return node;
  });

  const host = nodes.find((n) => n.type === "studio-node-group");
  if (!host) {
    return null;
  }

  const subgraphs: Record<string, StudioSubgraphDocument> = {};
  for (const [key, doc] of Object.entries(raw.subgraphs as Record<string, StudioSubgraphDocument>)) {
    subgraphs[key] = normalizeSubgraphDocument(doc);
  }

  return {
    marker: STUDIO_NODE_ASSET_MARKER,
    version: STUDIO_NODE_ASSET_VERSION,
    meta: {
      id: typeof raw.meta.id === "string" ? raw.meta.id : `remote_${Date.now()}`,
      name: raw.meta.name,
      description: typeof raw.meta.description === "string" ? raw.meta.description : undefined,
      tags: Array.isArray(raw.meta.tags) ? (raw.meta.tags as string[]) : undefined,
      category: raw.meta.category as StudioNodeAssetFile["meta"]["category"],
      createdAt:
        typeof raw.meta.createdAt === "string" ? raw.meta.createdAt : new Date().toISOString(),
      updatedAt:
        typeof raw.meta.updatedAt === "string" ? raw.meta.updatedAt : new Date().toISOString(),
      appVersion: typeof raw.meta.appVersion === "string" ? raw.meta.appVersion : undefined,
    },
    nodes,
    edges: raw.edges as Edge[],
    subgraphs,
    dependencies: raw.dependencies,
  };
}
