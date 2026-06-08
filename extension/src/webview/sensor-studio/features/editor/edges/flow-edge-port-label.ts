import type { StudioPortType } from "../store/flow-editor.store";

const PORT_TYPE_LABEL: Partial<Record<StudioPortType, string>> = {
  number: "Number",
  boolean: "Boolean",
  string: "String",
  event: "Event",
  vector3: "Vector3",
  quaternion: "Quaternion",
  environment: "Environment",
  camera: "Camera",
  glbAnimation: "Animation",
  transform: "Transform",
  fog: "Fog",
  studioLight: "Light",
  postProcessing: "Post FX",
  contactShadows: "Contact shadows",
  particleEmitter: "Particles",
  audioBus: "Audio",
  videoBus: "Video",
  videoTexture: "Texture",
  physicsScene: "Physics scene",
  physicsCollider: "Collider",
  physicsBody: "Rigid body",
  material: "Material",
  mesh: "Mesh",
};

export function formatFlowPortTypeLabel(portType: string | undefined): string {
  if (portType == null || portType.length === 0) {
    return "Wire";
  }
  const mapped = PORT_TYPE_LABEL[portType as StudioPortType];
  if (mapped != null) {
    return mapped;
  }
  return portType.charAt(0).toUpperCase() + portType.slice(1);
}
