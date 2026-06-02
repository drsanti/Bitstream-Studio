import type { Viewport } from "@xyflow/react";
import { Expand, Focus, LayoutGrid, MousePointerClick, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TRNButton } from "../../../../../ui/TRN";
import type { FlowCanvasEdgeRoutingStyle, FlowCanvasGridSize, FlowCanvasPreferences } from "../flow-canvas-ui-persistence";
import {
  CANVAS_EDGE_ROUTING_OPTIONS,
  CANVAS_GRID_SIZE_OPTIONS,
  formatCanvasZoomPercent,
} from "./canvas-inspector-helpers";
import { CanvasInspectorCard } from "./CanvasInspectorCard";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { InspectorSegmentButtonGroup, type InspectorSegmentOption } from "./InspectorSegmentButtonGroup";
import {
  DEFAULT_CANVAS_TAB_CARD_ORDER,
  mergeCanvasTabCardOrder,
  readCanvasTabCardCollapsed,
  readCanvasTabCardOrder,
  writeCanvasTabCardCollapsed,
  writeCanvasTabCardOrder,
  type CanvasInspectorCanvasTabCardId,
} from "./canvas-inspector-ui-persistence";

export type CanvasInspectorCanvasTabProps = {
  flowViewport?: Viewport | null;
  selectionCount: number;
  onFitView?: () => void;
  onRestoreFlowViewport?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onResetWorkspaceLayout?: () => void;
  flowCanvasPreferences: FlowCanvasPreferences;
  themeCanvasBackgroundColor: string;
  onFlowCanvasPreferencesChange: (patch: Partial<FlowCanvasPreferences>) => void;
};

export function CanvasInspectorCanvasTab(props: CanvasInspectorCanvasTabProps) {
  const {
    flowViewport,
    selectionCount,
    onFitView,
    onRestoreFlowViewport,
    onSelectAllNodes,
    onClearCanvasSelection,
    onResetWorkspaceLayout,
    flowCanvasPreferences,
    themeCanvasBackgroundColor,
    onFlowCanvasPreferencesChange,
  } = props;

  const effectiveBackgroundHex =
    flowCanvasPreferences.backgroundHex ?? themeCanvasBackgroundColor;
  const usingThemeBackground = flowCanvasPreferences.backgroundHex == null;

  const visibleCardIds = useMemo((): CanvasInspectorCanvasTabCardId[] => {
    const base = DEFAULT_CANVAS_TAB_CARD_ORDER.filter((id) => id !== "workbench");
    return onResetWorkspaceLayout != null ? [...base, "workbench"] : base;
  }, [onResetWorkspaceLayout]);

  const [cardOrder, setCardOrder] = useState<CanvasInspectorCanvasTabCardId[]>(() =>
    mergeCanvasTabCardOrder(readCanvasTabCardOrder(), visibleCardIds),
  );
  const [collapsedById, setCollapsedById] = useState<Record<CanvasInspectorCanvasTabCardId, boolean>>(
    () => readCanvasTabCardCollapsed(),
  );
  const [dragId, setDragId] = useState<CanvasInspectorCanvasTabCardId | null>(null);

  useEffect(() => {
    setCardOrder((prev) => mergeCanvasTabCardOrder(prev, visibleCardIds));
  }, [visibleCardIds]);

  const onDropCard = (targetId: CanvasInspectorCanvasTabCardId) => {
    if (dragId == null || dragId === targetId) {
      return;
    }
    setCardOrder((prev) => {
      const next = prev.filter((id) => id !== dragId);
      const targetIdx = next.indexOf(targetId);
      if (targetIdx < 0) {
        return prev;
      }
      next.splice(targetIdx, 0, dragId);
      writeCanvasTabCardOrder(next);
      return next;
    });
  };

  const setCardCollapsed = (id: CanvasInspectorCanvasTabCardId, collapsed: boolean) => {
    setCollapsedById((prev) => {
      const next = { ...prev, [id]: collapsed };
      writeCanvasTabCardCollapsed(next);
      return next;
    });
  };

  const edgeRoutingOptions = useMemo(
    () =>
      CANVAS_EDGE_ROUTING_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasEdgeRoutingStyle> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
          icon: o.Icon ? (
            <o.Icon className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          ) : undefined,
        }),
      ),
    [],
  );

  const cardsById: Partial<Record<CanvasInspectorCanvasTabCardId, JSX.Element>> = {
    viewport: (
      <CanvasInspectorCard
        id="canvas-inspector-card-viewport"
        title="Viewport"
        hint="Pan and zoom for the flow canvas."
        collapsible
        collapsed={collapsedById.viewport}
        onCollapsedChange={(next) => setCardCollapsed("viewport", next)}
      >
        <InspectorPropertyRow label="Zoom level">
          <span className="text-[12px] text-zinc-200/95">
            {formatCanvasZoomPercent(flowViewport?.zoom)}
          </span>
        </InspectorPropertyRow>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <TRNButton
            size="compact"
            className="min-w-0 flex-1"
            prefixIcon={<Expand className="h-3 w-3" aria-hidden />}
            hint="Fit all nodes in view (Ctrl+Shift+F)."
            onClick={() => onFitView?.()}
          >
            Fit view
          </TRNButton>
          {onRestoreFlowViewport != null ? (
            <TRNButton
              size="compact"
              className="min-w-0 flex-1"
              prefixIcon={<RotateCcw className="h-3 w-3" aria-hidden />}
              hint="Restore the last saved pan/zoom from this flow document."
              onClick={() => onRestoreFlowViewport()}
            >
              Restore view
            </TRNButton>
          ) : null}
        </div>
        <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorCompactToggleRow
            label="Auto fit after replace"
            hint="Fit view after Run template or JSON import without a saved viewport."
            checked={flowCanvasPreferences.autoFitViewOnReplace}
            onCheckedChange={(next) =>
              onFlowCanvasPreferencesChange({ autoFitViewOnReplace: next })
            }
          />
        </div>
      </CanvasInspectorCard>
    ),
    "wires-grid": (
      <CanvasInspectorCard
        id="canvas-inspector-card-wires-grid"
        title="Wires & grid"
        hint="Edge paths and alignment aids."
        collapsible
        collapsed={collapsedById["wires-grid"]}
        onCollapsedChange={(next) => setCardCollapsed("wires-grid", next)}
      >
        <InspectorPropertyRow
          label="Edge routing"
          description="Applies to all wires and new connections."
        >
          <InspectorSegmentButtonGroup
            ariaLabel="Flow edge routing style"
            layout="grid-2"
            value={flowCanvasPreferences.edgeRoutingStyle}
            options={edgeRoutingOptions}
            onChange={(next) =>
              onFlowCanvasPreferencesChange({
                edgeRoutingStyle: next as FlowCanvasEdgeRoutingStyle,
              })
            }
          />
        </InspectorPropertyRow>
        <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorCompactToggleRow
            label="Show grid"
            hint="Dot grid aligned to the snap size."
            checked={flowCanvasPreferences.showGrid}
            onCheckedChange={(next) => onFlowCanvasPreferencesChange({ showGrid: next })}
          />
          <InspectorCompactToggleRow
            label="Snap to grid"
            hint="Snap node drag and palette drops."
            checked={flowCanvasPreferences.snapToGrid}
            onCheckedChange={(next) => onFlowCanvasPreferencesChange({ snapToGrid: next })}
          />
          <InspectorPropertyRow label="Grid size (px)">
            <InspectorSegmentButtonGroup
              ariaLabel="Flow canvas grid size"
              layout="grid-5"
              value={flowCanvasPreferences.gridSize}
              options={CANVAS_GRID_SIZE_OPTIONS}
              onChange={(next) =>
                onFlowCanvasPreferencesChange({
                  gridSize: next as FlowCanvasGridSize,
                })
              }
            />
          </InspectorPropertyRow>
        </div>
      </CanvasInspectorCard>
    ),
    "canvas-chrome": (
      <CanvasInspectorCard
        id="canvas-inspector-card-canvas-chrome"
        title="Canvas chrome"
        hint="Minimap and background fill."
        collapsible
        collapsed={collapsedById["canvas-chrome"]}
        onCollapsedChange={(next) => setCardCollapsed("canvas-chrome", next)}
      >
        <InspectorCompactToggleRow
          label="Minimap"
          hint="Overview map in the bottom-right of the flow canvas."
          checked={flowCanvasPreferences.showMinimap}
          onCheckedChange={(next) => onFlowCanvasPreferencesChange({ showMinimap: next })}
        />
        <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorPropertyRow
            label="Background"
            description={
              usingThemeBackground
                ? `Theme default (${themeCanvasBackgroundColor}).`
                : "Custom canvas fill."
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 min-w-0 flex-1 cursor-pointer rounded border border-zinc-700 bg-zinc-900"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(effectiveBackgroundHex)
                    ? effectiveBackgroundHex
                    : "#09090b"
                }
                aria-label="Flow canvas background color"
                onChange={(e) =>
                  onFlowCanvasPreferencesChange({ backgroundHex: e.target.value })
                }
              />
              <TRNButton
                size="compact"
                className="shrink-0"
                disabled={usingThemeBackground}
                hint="Revert to the Sensor Studio theme canvas color."
                onClick={() => onFlowCanvasPreferencesChange({ backgroundHex: null })}
              >
                Theme
              </TRNButton>
            </div>
          </InspectorPropertyRow>
        </div>
      </CanvasInspectorCard>
    ),
    selection: (
      <CanvasInspectorCard
        id="canvas-inspector-card-selection"
        title="Selection"
        hint="Multi-select helpers on the canvas."
        collapsible
        collapsed={collapsedById.selection}
        onCollapsedChange={(next) => setCardCollapsed("selection", next)}
      >
        <div className="flex flex-wrap gap-1.5">
          <TRNButton
            size="compact"
            className="min-w-0 flex-1"
            prefixIcon={<Focus className="h-3 w-3" aria-hidden />}
            hint="Select every node on the canvas."
            onClick={() => onSelectAllNodes?.()}
          >
            Select all
          </TRNButton>
          <TRNButton
            size="compact"
            className="min-w-0 flex-1"
            prefixIcon={<MousePointerClick className="h-3 w-3" aria-hidden />}
            hint="Clear the current selection (Esc)."
            disabled={selectionCount === 0}
            onClick={() => onClearCanvasSelection?.()}
          >
            Clear sel.
          </TRNButton>
        </div>
      </CanvasInspectorCard>
    ),
    workbench:
      onResetWorkspaceLayout != null ? (
        <CanvasInspectorCard
          id="canvas-inspector-card-workbench"
          title="Workbench"
          hint="Reset library / flow / inspector pane sizes."
          collapsible
          collapsed={collapsedById.workbench}
          onCollapsedChange={(next) => setCardCollapsed("workbench", next)}
        >
          <TRNButton
            size="compact"
            className="w-full"
            prefixIcon={<LayoutGrid className="h-3 w-3" aria-hidden />}
            hint="Restore default workbench split layout."
            onClick={() => onResetWorkspaceLayout()}
          >
            Reset workspace layout
          </TRNButton>
        </CanvasInspectorCard>
      ) : null,
  };

  return (
    <div className="space-y-2">
      {cardOrder.map((id) => {
        const card = cardsById[id];
        if (card == null) {
          return null;
        }
        return (
          <div
            key={id}
            className="min-w-0"
            draggable
            onDragStart={(e) => {
              const header = (e.target as HTMLElement | null)?.closest?.("[data-trn-card-header]");
              if (header == null) {
                e.preventDefault();
                return;
              }
              setDragId(id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", id);
            }}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => {
              if (dragId == null || dragId === id) {
                return;
              }
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDropCard(id);
            }}
          >
            {card}
          </div>
        );
      })}
    </div>
  );
}
