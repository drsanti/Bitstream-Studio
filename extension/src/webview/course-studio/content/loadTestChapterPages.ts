import { parsePageV1, type PageBlockV1, type PageV1 } from "../schemas/page.v1";
import { htmlPageTelemetryProviderExampleBlock } from "./courseTelemetryProviderExampleBlock";
import { EV_SPEED_HERO_COMPACT_HTML } from "./dashboardExampleHtml";
import newTopic2PageJson from "./new-topic-2.page.v1.json";
import { TELEMETRY_EXAMPLE_HTML } from "./telemetryExampleHtml.generated";

export const NEW_TOPIC_2_PAGE_ID = "new-topic-2";
export const NEW_TOPIC_2_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/new-topic-2.page.v1.json";

function appendHtmlPageBlocks(
  page: PageV1,
  blocks: Extract<PageBlockV1, { kind: "html-page" }>[],
): PageV1 {
  return {
    ...page,
    blocks: [...page.blocks, ...blocks],
  };
}

export function loadNewTopic2Page(): PageV1 {
  const page = parsePageV1(newTopic2PageJson);
  return appendHtmlPageBlocks(page, [
    htmlPageTelemetryProviderExampleBlock({
      id: "sandbox-gyro-bar",
      title: "BMI270 · gyro X",
      caption: "Kit example — bitstream:ready + gyroX bar",
      placement: { column: 1, row: 8, columnSpan: 4, rowSpan: 5 },
      html: TELEMETRY_EXAMPLE_HTML.bmi270GyroX,
    }),
    htmlPageTelemetryProviderExampleBlock({
      id: "sandbox-sht40-bar",
      title: "SHT40 · humidity",
      caption: "Kit example — humidityPct bar",
      placement: { column: 5, row: 8, columnSpan: 4, rowSpan: 5 },
      html: TELEMETRY_EXAMPLE_HTML.sht40Humidity,
    }),
    htmlPageTelemetryProviderExampleBlock({
      id: "sandbox-dps368-bar",
      title: "DPS368 · pressure",
      caption: "Kit example — pressureHpa bar",
      placement: { column: 9, row: 8, columnSpan: 4, rowSpan: 5 },
      html: TELEMETRY_EXAMPLE_HTML.dps368Pressure,
    }),
    htmlPageTelemetryProviderExampleBlock({
      id: "sandbox-ev-hero",
      title: "EV speed hero (decorative)",
      caption: "Visual-only — local animation, not wired to Bitstream",
      placement: { column: 1, row: 13, columnSpan: 6, rowSpan: 4 },
      html: EV_SPEED_HERO_COMPACT_HTML,
    }),
  ]);
}
