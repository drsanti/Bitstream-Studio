import { DATA_TYPE_COLORS_DEFAULTS } from "../../../config/data-type-colors.config";
import type { StudioPortType } from "../store/flow-editor.store";

const DT = DATA_TYPE_COLORS_DEFAULTS.payload;

/** Accent color for flow sockets / port-type pills (matches canvas edges). */
export function studioPortAccent(portType: StudioPortType): string {
  switch (portType) {
    case "number":
      return DT.number;
    case "boolean":
      return DT.boolean;
    case "string":
      return DT.string;
    case "event":
      return DT.event;
    case "vector3":
      return DT.vector3;
    case "quaternion":
      return DT.quaternion;
    case "environment":
      return DT.environment;
    case "camera":
      return DT.camera;
    case "glbAnimation":
      return DT.glbAnimation;
    case "transform":
      return DT.transform;
    default:
      return "#a1a1aa";
  }
}
