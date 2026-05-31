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
  if (node.type === "studio") {
    return node;
  }
  return node;
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
    edges: doc.edges.map((edge) => ({ ...edge })) as Edge[],
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
