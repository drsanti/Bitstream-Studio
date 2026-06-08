import type { Viewport } from "@xyflow/react";
import { Expand, Focus, LayoutGrid, MousePointerClick, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCanvasInspectorFocusStore } from "../../../../state/canvas-inspector-focus.store";
import { TRNButton } from "../../../../../ui/TRN";
import type { FlowCanvasGridSize, FlowCanvasPreferences } from "../flow-canvas-ui-persistence";
import {
  CANVAS_GRID_SIZE_OPTIONS,
  CANVAS_NODE_SELECTION_RING_WIDTH_OPTIONS,
  formatCanvasZoomPercent,
} from "./canvas-inspector-helpers";
import { CanvasInspectorCard } from "./CanvasInspectorCard";
import { InspectorColorField } from "./InspectorDenseControls";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorNumericScrubRow } from "./InspectorNumericScrubRow";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { InspectorSegmentButtonGroup, type InspectorSegmentOption } from "./InspectorSegmentButtonGroup";
import type { FlowCanvasNodeSelectionRingWidthPx } from "../flow-canvas-ui-persistence";
import {
  DEFAULT_CANVAS_TAB_CARD_ORDER,
  mergeCanvasTabCardOrder,
  readCanvasTabCardCollapsed,
  readCanvasTabCardOrder,
  writeCanvasTabCardCollapsed,
  writeCanvasTabCardOrder,
  type CanvasInspectorCanvasTabCardId,
} from "./canvas-inspector-ui-persistence";
import { ScrubFieldInspectorPreferences } from "./ScrubFieldInspectorPreferences";
import type { StagePresentationPreferences } from "../../../stage/stage-presentation-preferences";
import { StageMeshesOnlyScenePreferencesSection } from "./StageMeshesOnlyScenePreferencesSection";
import { SensorStudioPerformancePreferencesSection } from "./SensorStudioPerformancePreferencesSection";
import { useSensorStudioPerformanceStore } from "../../../../state/sensor-studio-performance.store";

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
  stagePresentationPreferences: StagePresentationPreferences;
  onStagePresentationPreferencesChange: (
    patch: Partial<StagePresentationPreferences>,
  ) => void;
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
    stagePresentationPreferences,
    onStagePresentationPreferencesChange,
  } = props;

  const effectiveBackgroundHex =
    flowCanvasPreferences.backgroundHex ?? themeCanvasBackgroundColor;
  const usingThemeBackground = flowCanvasPreferences.backgroundHex == null;
  const performancePreferences = useSensorStudioPerformanceStore((s) => s.preferences);
  const patchPerformancePreferences = useSensorStudioPerformanceStore(
    (s) => s.patchPreferences,
  );

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
  const focusRequest = useCanvasInspectorFocusStore((s) => s.request);
  const clearFocusRequest = useCanvasInspectorFocusStore((s) => s.clearRequest);
  const handledFocusNonceRef = useRef(0);

  useEffect(() => {
    setCardOrder((prev) => mergeCanvasTabCardOrder(prev, visibleCardIds));
  }, [visibleCardIds]);

  useEffect(() => {
    if (focusRequest?.expandCardId !== "performance") {
      return;
    }
    const nonce = Date.now();
    handledFocusNonceRef.current = nonce;
    setCollapsedById((prev) => {
      const next = { ...prev, performance: false };
      writeCanvasTabCardCollapsed(next);
      return next;
    });
    const scrollTimer = window.setTimeout(() => {
      if (handledFocusNonceRef.current !== nonce) {
        return;
      }
      document
        .getElementById("canvas-inspector-card-performance")
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      clearFocusRequest();
    }, 50);
    return () => window.clearTimeout(scrollTimer);
  }, [focusRequest, clearFocusRequest]);

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
    performance: (
      <CanvasInspectorCard
        id="canvas-inspector-card-performance"
        title="Performance"
        hint="Frame-rate caps and renderer suspension when workbench panes are collapsed."
        collapsible
        collapsed={collapsedById.performance}
        onCollapsedChange={(next) => setCardCollapsed("performance", next)}
      >
        <SensorStudioPerformancePreferencesSection
          preferences={performancePreferences}
          onPreferencesChange={patchPerformancePreferences}
        />
      </CanvasInspectorCard>
    ),
    grid: (
      <CanvasInspectorCard
        id="canvas-inspector-card-grid"
        title="Grid & snap"
        hint="Alignment aids on the flow canvas."
        collapsible
        collapsed={collapsedById.grid}
        onCollapsedChange={(next) => setCardCollapsed("grid", next)}
      >
        <InspectorCompactToggleRow
          label="Show grid"
          hint="Dot grid aligned to the snap size."
          checked={flowCanvasPreferences.showGrid}
          onCheckedChange={(next) => onFlowCanvasPreferencesChange({ showGrid: next })}
        />
        <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
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
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <InspectorColorField
                  ariaLabel="Flow canvas background color"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(effectiveBackgroundHex)
                      ? effectiveBackgroundHex
                      : "#09090b"
                  }
                  onChange={(next) =>
                    onFlowCanvasPreferencesChange({ backgroundHex: next })
                  }
                />
              </div>
              <TRNButton
                size="compact"
                className="h-[26px] shrink-0 px-2 text-[10px]"
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
        hint="Selection ring style, marquee rectangle, and multi-select helpers."
        collapsible
        collapsed={collapsedById.selection}
        onCollapsedChange={(next) => setCardCollapsed("selection", next)}
      >
        <InspectorCompactToggleRow
          label="Node selection ring"
          hint="Cyan-style outline on selected nodes, groups, notes, and frames."
          checked={flowCanvasPreferences.showNodeSelectionRing}
          onCheckedChange={(next) =>
            onFlowCanvasPreferencesChange({ showNodeSelectionRing: next })
          }
        />
        {flowCanvasPreferences.showNodeSelectionRing ? (
          <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
            <InspectorPropertyRow
              label="Ring color"
              description="Stroke color for selected node chrome."
            >
              <InspectorColorField
                ariaLabel="Node selection ring color"
                value={flowCanvasPreferences.nodeSelectionRingHex}
                onChange={(next) =>
                  onFlowCanvasPreferencesChange({ nodeSelectionRingHex: next })
                }
              />
            </InspectorPropertyRow>
            <InspectorPropertyRow label="Ring width (px)">
              <InspectorSegmentButtonGroup
                ariaLabel="Node selection ring width"
                layout="grid-3"
                value={flowCanvasPreferences.nodeSelectionRingWidthPx}
                options={CANVAS_NODE_SELECTION_RING_WIDTH_OPTIONS}
                onChange={(next) =>
                  onFlowCanvasPreferencesChange({
                    nodeSelectionRingWidthPx: next as FlowCanvasNodeSelectionRingWidthPx,
                  })
                }
              />
            </InspectorPropertyRow>
            <InspectorNumericScrubRow
              label="Ring opacity"
              description="Transparency of the selection ring stroke."
              ariaLabel="Node selection ring opacity"
              value={flowCanvasPreferences.nodeSelectionRingOpacity}
              min={0.15}
              max={1}
              step={0.05}
              fractionDigits={2}
              onCommit={(next) =>
                onFlowCanvasPreferencesChange({ nodeSelectionRingOpacity: next })
              }
            />
          </div>
        ) : null}
        <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorCompactToggleRow
            label="Marquee rectangle"
            hint="Show the drag-select box while marquee-selecting nodes on the canvas."
            checked={flowCanvasPreferences.showMarqueeSelectionRect}
            onCheckedChange={(next) =>
              onFlowCanvasPreferencesChange({ showMarqueeSelectionRect: next })
            }
          />
          {flowCanvasPreferences.showMarqueeSelectionRect ? (
            <>
              <InspectorPropertyRow
                label="Marquee color"
                description="Stroke and fill tint for the drag-select rectangle."
              >
                <InspectorColorField
                  ariaLabel="Marquee selection rectangle color"
                  value={flowCanvasPreferences.marqueeSelectionHex}
                  onChange={(next) =>
                    onFlowCanvasPreferencesChange({ marqueeSelectionHex: next })
                  }
                />
              </InspectorPropertyRow>
              <InspectorNumericScrubRow
                label="Marquee opacity"
                ariaLabel="Marquee selection rectangle opacity"
                value={flowCanvasPreferences.marqueeSelectionOpacity}
                min={0.1}
                max={1}
                step={0.05}
                fractionDigits={2}
                onCommit={(next) =>
                  onFlowCanvasPreferencesChange({ marqueeSelectionOpacity: next })
                }
              />
            </>
          ) : null}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-zinc-800/60 pt-2.5">
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
    "numeric-scrub": (
      <CanvasInspectorCard
        id="canvas-inspector-card-numeric-scrub"
        title="Numeric scrub fields"
        hint="Global scrub field chrome and interaction for Number nodes and other numeric controls."
        collapsible
        collapsed={collapsedById["numeric-scrub"]}
        onCollapsedChange={(next) => setCardCollapsed("numeric-scrub", next)}
      >
        <ScrubFieldInspectorPreferences showValueRules />
      </CanvasInspectorCard>
    ),
    "meshes-only-scene": (
      <CanvasInspectorCard
        id="canvas-inspector-card-meshes-only-scene"
        title="Meshes-only scene"
        hint="Stage behavior when Scene Output has Meshes wired but no committed Models."
        collapsible
        collapsed={collapsedById["meshes-only-scene"]}
        onCollapsedChange={(next) => setCardCollapsed("meshes-only-scene", next)}
      >
        <p className="mb-2.5 text-[10px] leading-snug text-zinc-500">
          Also under Scene Output node settings and Stage inspector Toolbar → 3D Scene (Stage).
        </p>
        <StageMeshesOnlyScenePreferencesSection
          preferences={stagePresentationPreferences}
          onPreferencesChange={onStagePresentationPreferencesChange}
          showHeading={false}
        />
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
