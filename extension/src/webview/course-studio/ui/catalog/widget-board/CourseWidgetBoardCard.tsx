import type { PageBlockV1 } from "../../../schemas/page.v1";
import {
  resolveWidgetBoardThemeTokens,
  widgetBoardThemeTokensToCssProperties,
} from "../../../schemas/widgetBoardTheme.v1";
import {
  widgetBoardEntryGridStyle,
  widgetBoardPublishedGridLayoutStyle,
} from "./widgetBoardLayout";
import { CourseWidgetBoardEntry } from "./CourseWidgetBoardEntry";

export function CourseWidgetBoardCard({
  block,
  staleMs,
}: {
  block: Extract<PageBlockV1, { kind: "widget-board" }>;
  staleMs?: number;
}) {
  const appearance = block.appearance ?? { themePresetId: "ev-compact" as const };
  const themeTokens = resolveWidgetBoardThemeTokens({
    presetId: appearance.themePresetId ?? "ev-compact",
    overrides: appearance.overrides,
  });
  const themeStyle = widgetBoardThemeTokensToCssProperties(themeTokens);
  const grid = block.grid;
  const gridStyle = widgetBoardPublishedGridLayoutStyle(grid, block.widgets);
  const showMeta =
    appearance.showMetaLine !== false &&
    appearance.metaLine != null &&
    appearance.metaLine.trim().length > 0;
  const showCaption =
    appearance.showCaption !== false &&
    appearance.caption != null &&
    appearance.caption.trim().length > 0;

  return (
    <div
      className="course-widget-board-shell box-border flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden"
      data-course-widget-board=""
      data-course-wb-theme={appearance.themePresetId ?? "ev-compact"}
      style={themeStyle}
    >
      {showMeta ? (
        <p className="shrink-0 px-4 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--course-wb-meta-text)]">
          {appearance.metaLine}
        </p>
      ) : null}
      <div
        className="course-widget-board-grid min-h-0 min-w-0 flex-1"
        style={gridStyle}
      >
        {block.widgets.map((widget) => (
          <div
            key={widget.id}
            className="course-widget-board-grid__cell min-h-0 min-w-0 overflow-hidden"
            style={widgetBoardEntryGridStyle(widget.placement, grid.columns)}
            data-course-widget-id={widget.id}
          >
            <CourseWidgetBoardEntry widget={widget} staleMs={staleMs} />
          </div>
        ))}
      </div>
      {showCaption ? (
        <p className="shrink-0 px-4 pb-4 pt-2 text-[10px] leading-snug text-[var(--course-wb-caption-text)]">
          {appearance.caption?.trim()}
        </p>
      ) : null}
    </div>
  );
}
