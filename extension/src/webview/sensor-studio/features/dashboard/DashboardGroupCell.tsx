import type { CSSProperties, PointerEvent } from "react";
import type { DashboardWidgetSelectionModifiers } from "../../core/dashboard/dashboard-widget-selection";
import type { DashboardLayoutModeV1 } from "../../core/dashboard/dashboard-layout";
import { dashboardFlexPlacementStyle } from "../../core/dashboard/dashboard-flex-placement";
import { dashboardGroupLayoutGridStyle } from "../../core/dashboard/dashboard-group-layout";
import {
  dashboardPlacementGridStyle,
  type DashboardPlacementV1,
} from "../../core/dashboard/dashboard-placement";
import type { DashboardGroupEntryV1 } from "../../core/dashboard/dashboard-snapshot";
import { dashboardGroupEditChromeClass } from "./dashboard-grid-edit-chrome";
import { DashboardWidgetCell } from "./DashboardWidgetCell";

type DashboardGroupCellProps = {
  group: DashboardGroupEntryV1;
  layoutMode: DashboardLayoutModeV1;
  editMode: boolean;
  highlighted: boolean;
  onButtonClick?: (sourceNodeId: string) => void;
  onKnobValueChange?: (sourceNodeId: string, value: number) => void;
  onSwitchValueChange?: (sourceNodeId: string, value: boolean) => void;
  onSelectValueChange?: (sourceNodeId: string, value: string) => void;
  onSliderValueChange?: (sourceNodeId: string, value: number) => void;
  onSelectWidget?: (
    sourceNodeId: string,
    modifiers?: DashboardWidgetSelectionModifiers,
  ) => void;
  onSelectGroup?: (
    sourceNodeId: string,
    modifiers?: DashboardWidgetSelectionModifiers,
  ) => void;
  placementOverride?: Partial<DashboardPlacementV1>;
  onGridDragPointerDown?: (
    event: PointerEvent<HTMLDivElement>,
    placement: DashboardPlacementV1,
  ) => void;
  onWidgetGridDragPointerDown?: (
    sourceNodeId: string,
    event: PointerEvent<HTMLDivElement>,
    placement: DashboardPlacementV1,
  ) => void;
  widgetHighlightedIds?: ReadonlySet<string>;
  isGridDragging?: boolean;
  isWidgetGridDragging?: (sourceNodeId: string) => boolean;
};

function groupPlacement(
  group: DashboardGroupEntryV1,
  placementOverride?: Partial<DashboardPlacementV1>,
): DashboardPlacementV1 {
  return placementOverride == null
    ? group.placement
    : { ...group.placement, ...placementOverride };
}

function groupOuterStyle(
  group: DashboardGroupEntryV1,
  layoutMode: DashboardLayoutModeV1,
  placementOverride?: Partial<DashboardPlacementV1>,
): CSSProperties {
  if (layoutMode === "flex") {
    return dashboardFlexPlacementStyle(group.flexPlacement);
  }
  return dashboardPlacementGridStyle(groupPlacement(group, placementOverride));
}

export function DashboardGroupCell(props: DashboardGroupCellProps) {
  const {
    group,
    layoutMode,
    editMode,
    highlighted,
    onButtonClick,
    onKnobValueChange,
    onSwitchValueChange,
    onSelectValueChange,
    onSliderValueChange,
    onSelectWidget,
    onSelectGroup,
    placementOverride,
    onGridDragPointerDown,
    onWidgetGridDragPointerDown,
    widgetHighlightedIds,
    isGridDragging = false,
    isWidgetGridDragging,
  } = props;

  const placement = groupPlacement(group, placementOverride);
  const outerStyle = groupOuterStyle(group, layoutMode, placementOverride);
  const innerStyle = dashboardGroupLayoutGridStyle(group.groupLayout);
  const gridDragEnabled =
    editMode && layoutMode === "grid" && onGridDragPointerDown != null;
  const chrome = [
    dashboardGroupEditChromeClass(editMode, highlighted, layoutMode, group.showBorder, {
      dragging: isGridDragging,
    }),
    editMode && !gridDragEnabled ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={chrome}
      style={{
        ...outerStyle,
        backgroundColor: "var(--dashboard-panel-bg, #18181b)",
      }}
      data-dashboard-group-id={group.sourceNodeId}
      onPointerDown={
        gridDragEnabled
          ? (event) => {
              event.stopPropagation();
              onGridDragPointerDown(event, placement);
            }
          : editMode
            ? (event) => {
                event.stopPropagation();
                onSelectGroup?.(group.sourceNodeId, {
                  shiftKey: event.shiftKey,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                });
              }
            : undefined
      }
    >
      {group.showTitle ? (
        <div
          className="pointer-events-none shrink-0 border-b border-zinc-700/50 px-2 py-1 text-[11px] font-medium"
          style={{ color: "var(--dashboard-text-secondary, #a1a1aa)" }}
        >
          {group.label}
        </div>
      ) : null}
      <div className="min-h-0 flex-1" style={innerStyle}>
        {group.children.map((widget) => (
          <DashboardWidgetCell
            key={widget.sourceNodeId}
            widget={widget}
            layoutMode="grid"
            editMode={editMode}
            highlighted={widgetHighlightedIds?.has(widget.sourceNodeId) ?? false}
            onButtonClick={onButtonClick}
            onKnobValueChange={onKnobValueChange}
            onSwitchValueChange={onSwitchValueChange}
            onSelectValueChange={onSelectValueChange}
            onSliderValueChange={onSliderValueChange}
            onSelectWidget={onSelectWidget}
            onGridDragPointerDown={
              gridDragEnabled && onWidgetGridDragPointerDown != null
                ? (event, childPlacement) =>
                    onWidgetGridDragPointerDown(widget.sourceNodeId, event, childPlacement)
                : undefined
            }
            isGridDragging={isWidgetGridDragging?.(widget.sourceNodeId) ?? false}
            nestedInGroup
          />
        ))}
      </div>
    </div>
  );
}
