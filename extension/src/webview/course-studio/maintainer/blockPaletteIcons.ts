import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Box,
  Compass,
  Gauge,
  Code,
  CodeXml,
  FileText,
  Frame,
  Heading,
  Image,
  MessageSquareWarning,
  Link2,
  PenLine,
  Square,
  Youtube,
} from "lucide-react";
import type { CourseBlockPaletteIconId } from "./blockPaletteMeta";

export const COURSE_BLOCK_PALETTE_ICONS: Record<CourseBlockPaletteIconId, LucideIcon> = {
  heading: Heading,
  callout: MessageSquareWarning,
  markdown: FileText,
  card: Square,
  "live-metric": Activity,
  "dashboard-widget": Gauge,
  "sensor-telemetry-card": Compass,
  diagram: PenLine,
  "scene-3d": Box,
  image: Image,
  code: Code,
  youtube: Youtube,
  iframe: Frame,
  "html-page": CodeXml,
  embed: Link2,
};
