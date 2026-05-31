import type { SensorInspectorAboutContent } from "./sensor-inspector-about-content";
import type { UtilityInspectorDetailsContent } from "./utility-inspector-details-content";

function mdCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function bulletList(items: readonly string[]): string {
  if (items.length === 0) {
    return "";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

export function buildUtilityDetailsMarkdown(
  content: UtilityInspectorDetailsContent,
  catalogLead?: string | null,
): string {
  const parts: string[] = [content.role];
  if (catalogLead != null && catalogLead !== content.role) {
    parts.push("", catalogLead);
  }
  if (content.learnMore.length > 0) {
    parts.push("", "### Learn", bulletList(content.learnMore));
  }
  if (content.wireNotes != null && content.wireNotes.length > 0) {
    parts.push("", "### Wires", bulletList(content.wireNotes));
  }
  if (content.inStudio.length > 0) {
    parts.push("", "### In Sensor Studio", bulletList(content.inStudio));
  }
  return parts.join("\n");
}

export function buildSensorAboutMarkdown(
  content: SensorInspectorAboutContent,
  catalogLead?: string | null,
): string {
  const parts: string[] = [
    `**${content.vendor} ${content.chip}**`,
    "",
    content.role,
  ];
  if (catalogLead != null && catalogLead !== content.role) {
    parts.push("", catalogLead);
  }
  if (content.tapNote != null) {
    parts.push("", `> ${content.tapNote}`);
  }
  if (content.learnMore.length > 0) {
    parts.push("", "### Learn", bulletList(content.learnMore));
  }

  if (content.ranges.length > 0) {
    parts.push(
      "",
      "### Measurement range (datasheet FSR / operating)",
      "",
      "| Quantity | Min | Max | Unit |",
      "| --- | --- | --- | --- |",
    );
    for (const row of content.ranges) {
      const unit =
        row.note != null ? `${row.unit} — ${row.note}` : row.unit;
      parts.push(
        `| ${mdCell(row.quantity)} | ${mdCell(row.min)} | ${mdCell(row.max)} | ${mdCell(unit)} |`,
      );
    }
  }

  if (content.accuracy.length > 0) {
    parts.push(
      "",
      "### Typical accuracy (datasheet)",
      "",
      "| Quantity | Typical |",
      "| --- | --- |",
    );
    for (const row of content.accuracy) {
      const typical =
        row.note != null ? `${row.typical} — ${row.note}` : row.typical;
      parts.push(`| ${mdCell(row.quantity)} | ${mdCell(typical)} |`);
    }
  }

  parts.push("", "### In Bitstream Studio", "", content.bitstreamNote);
  parts.push(
    "",
    `[${content.datasheetLabel} (PDF)](${content.datasheetUrl})`,
  );
  return parts.join("\n");
}
