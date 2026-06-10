import type { PageBlockV1 } from "../schemas/page.v1";
import { courseSensorTelemetryCardPresetLabel } from "../schemas/sensorTelemetryCardPreset";

export function coursePageBlockSelectionLabel(block: PageBlockV1): string {
  switch (block.kind) {
    case "heading":
      return block.title?.trim() || "Heading";
    case "card":
      return block.title?.trim() || "Card";
    case "markdown":
      return "Markdown";
    case "live-metric":
      return block.title?.trim() || "Live metric";
    case "dashboard-widget":
      return block.title?.trim() || "Dashboard widget";
    case "widget-board":
      return "Widget board";
    case "sensor-telemetry-card":
      return courseSensorTelemetryCardPresetLabel(block.preset);
    case "diagram-2d":
      return block.caption?.trim() || "Diagram";
    case "scene-3d":
      return block.caption?.trim() || "3D Scene";
    case "image":
      return block.caption?.trim() || block.alt?.trim() || "Image";
    case "code":
      return block.caption?.trim() || "Code";
    case "youtube":
      return block.caption?.trim() || "YouTube";
    case "iframe":
      return block.caption?.trim() || block.title?.trim() || "iFrame";
    case "html-page":
      return block.caption?.trim() || block.title?.trim() || "HTML page";
    default:
      if (block.kind.startsWith("callout-")) {
        return block.title?.trim() || "Callout";
      }
      return block.id;
  }
}
