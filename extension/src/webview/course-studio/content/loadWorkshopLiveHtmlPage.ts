import { parsePageV1, type PageBlockV1, type PageV1 } from "../schemas/page.v1";
import { htmlPageTelemetryProviderExampleBlock } from "./courseTelemetryProviderExampleBlock";
import { WORKSHOP_EXAMPLE_HTML } from "./workshopExampleHtml.generated";

export const WORKSHOP_LIVE_HTML_PAGE_ID = "workshop-live-html";
export const WORKSHOP_LIVE_HTML_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/workshop-live-html.page.v1.json";

function baseWorkshopPage(): PageV1 {
  return parsePageV1({
    version: 1,
    id: WORKSHOP_LIVE_HTML_PAGE_ID,
    title: "Workshop live sensor HTML",
    meta: {
      telemetryPreference: "auto",
      staleMs: 3000,
      defaultLinkHealth: "freeze-gray",
    },
    grid: {
      columns: 12,
      rowHeightPx: 48,
      gapPx: 12,
      paddingPx: 32,
    },
    blocks: [
      {
        id: "heading-workshop-html",
        kind: "heading",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
        eyebrow: "Workshop · HTML Editor",
        title: "Live sensor dashboards",
        subtitle:
          "Read-only HTML blocks — bitstream:ready in Course Studio, WebSocket in a browser tab. TESAIoT DevKit first.",
      },
      {
        id: "callout-workshop",
        kind: "callout-tip",
        placement: { column: 1, row: 3, columnSpan: 12, rowSpan: 2 },
        title: "Connect for live data",
        body: "Toolbar Bitstream or Simulator + Link. BMI270 panels need Raw output profile in Sensor Telemetry.",
        icon: "Lightbulb",
      },
    ],
  });
}

function appendHtmlBlocks(
  page: PageV1,
  blocks: Extract<PageBlockV1, { kind: "html-page" }>[],
): PageV1 {
  return { ...page, blocks: [...page.blocks, ...blocks] };
}

export function loadWorkshopLiveHtmlPage(): PageV1 {
  const page = baseWorkshopPage();
  return appendHtmlBlocks(page, [
    htmlPageTelemetryProviderExampleBlock({
      id: "workshop-html-sht40",
      title: "SHT40 · climate",
      caption: "temperatureC + humidityPct",
      placement: { column: 1, row: 5, columnSpan: 6, rowSpan: 5 },
      html: WORKSHOP_EXAMPLE_HTML.sht40Climate,
    }),
    htmlPageTelemetryProviderExampleBlock({
      id: "workshop-html-dps368",
      title: "DPS368 · pressure",
      caption: "pressureHpa sea-level band",
      placement: { column: 7, row: 5, columnSpan: 6, rowSpan: 5 },
      html: WORKSHOP_EXAMPLE_HTML.dps368Pressure,
    }),
    htmlPageTelemetryProviderExampleBlock({
      id: "workshop-html-bmi270",
      title: "BMI270 · motion",
      caption: "gyroX bar + acceleration strength",
      placement: { column: 1, row: 10, columnSpan: 6, rowSpan: 5 },
      html: WORKSHOP_EXAMPLE_HTML.bmi270Motion,
    }),
    htmlPageTelemetryProviderExampleBlock({
      id: "workshop-html-bmm350",
      title: "BMM350 · magnetic field",
      caption: "magX / magY / magZ",
      placement: { column: 7, row: 10, columnSpan: 6, rowSpan: 5 },
      html: WORKSHOP_EXAMPLE_HTML.bmm350Mag,
    }),
    htmlPageTelemetryProviderExampleBlock({
      id: "workshop-html-four-sensor",
      title: "Four-sensor dashboard",
      caption: "Chapter 6 capstone layout",
      placement: { column: 1, row: 15, columnSpan: 12, rowSpan: 6 },
      html: WORKSHOP_EXAMPLE_HTML.fourSensorDashboard,
    }),
  ]);
}
