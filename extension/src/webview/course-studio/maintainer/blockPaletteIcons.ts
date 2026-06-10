import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Box,
  Compass,
  Gauge,
  Code,
  FileText,
  Frame,
  Heading,
  Image,
  MessageSquareWarning,
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
};
