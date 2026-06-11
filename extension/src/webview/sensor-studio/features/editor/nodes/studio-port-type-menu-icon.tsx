import type { LucideIcon } from "lucide-react";
import {
  Box,
  Camera,
  CircleDot,
  Clapperboard,
  CloudFog,
  Cuboid,
  Gauge,
  Globe2,
  Hash,
  Image,
  LayoutGrid,
  Link2,
  PanelsTopLeft,
  Palette,
  Lightbulb,
  Move3d,
  Rotate3d,
  Sparkles,
  ToggleLeft,
  Type,
  Video,
  Volume2,
  Zap,
} from "lucide-react";
import type { StudioPortType } from "../flow-graph-types";
import { studioPortAccent } from "./port-accent";

const STUDIO_PORT_TYPE_ICON: Record<StudioPortType, LucideIcon> = {
  number: Hash,
  boolean: ToggleLeft,
  string: Type,
  event: Zap,
  vector3: Move3d,
  quaternion: Rotate3d,
  environment: Globe2,
  camera: Camera,
  glbAnimation: Clapperboard,
  transform: Box,
  fog: CloudFog,
  studioLight: Lightbulb,
  postProcessing: Sparkles,
  contactShadows: CircleDot,
  particleEmitter: Sparkles,
  audioBus: Volume2,
  videoBus: Video,
  videoTexture: Image,
  physicsScene: Gauge,
  physicsCollider: Box,
  physicsBody: Cuboid,
  physicsJoint: Link2,
  physicsSpawner: Sparkles,
  dashboardWidget: LayoutGrid,
  dashboardTheme: Palette,
  dashboardTab: PanelsTopLeft,
  material: Palette,
  mesh: Cuboid,
};

export type StudioPortTypeMenuIconProps = {
  portType: StudioPortType;
};

/** Accent-tinted badge + Lucide glyph for port-type listbox rows and select triggers. */
export function StudioPortTypeMenuIcon(props: StudioPortTypeMenuIconProps) {
  const { portType } = props;
  const accent = studioPortAccent(portType);
  const Icon = STUDIO_PORT_TYPE_ICON[portType] ?? Hash;

  return (
    <span
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm"
      style={{
        backgroundColor: `${accent}22`,
        color: accent,
      }}
      aria-hidden
    >
      <Icon className="size-2.5" strokeWidth={2.25} />
    </span>
  );
}
