import { useEffect, useMemo, useState } from "react";
import type {
  FlowCanvasEdgeBundleMode,
  FlowCanvasEdgeBusLaneSort,
  FlowCanvasEdgeMarkerSize,
  FlowCanvasEdgeRoutingStyle,
  FlowCanvasEdgeSelectionHighlight,
  FlowCanvasEdgeStrokeWidth,
  FlowCanvasEdgeTypeLabelMode,
  FlowCanvasHandleBorderWidthPx,
  FlowCanvasHandleSizePx,
  FlowCanvasPreferences,
} from "../flow-canvas-ui-persistence";
import {
  CANVAS_EDGE_BUS_LANE_SORT_OPTIONS,
  CANVAS_EDGE_BUNDLE_MODE_OPTIONS,
  CANVAS_EDGE_MARKER_SIZE_OPTIONS,
  CANVAS_EDGE_ROUTING_OPTIONS,
  CANVAS_EDGE_SELECTION_HIGHLIGHT_OPTIONS,
  CANVAS_EDGE_STROKE_WIDTH_OPTIONS,
  CANVAS_EDGE_TYPE_LABEL_OPTIONS,
  CANVAS_HANDLE_BORDER_OPTIONS,
  CANVAS_HANDLE_SIZE_OPTIONS,
} from "./canvas-inspector-helpers";
import { CanvasInspectorCard } from "./CanvasInspectorCard";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorNumericField, InspectorNumericScrubRow } from "./InspectorNumericScrubRow";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import {
  InspectorSegmentButtonGroup,
  type InspectorSegmentOption,
} from "./InspectorSegmentButtonGroup";
import {
  DEFAULT_WIRES_TAB_CARD_ORDER,
  mergeWiresTabCardOrder,
  readWiresTabCardCollapsed,
  readWiresTabCardOrder,
  writeWiresTabCardCollapsed,
  writeWiresTabCardOrder,
  type CanvasInspectorWiresTabCardId,
} from "./canvas-inspector-ui-persistence";

export type CanvasInspectorWiresTabProps = {
  flowCanvasPreferences: FlowCanvasPreferences;
  onFlowCanvasPreferencesChange: (patch: Partial<FlowCanvasPreferences>) => void;
};

export function CanvasInspectorWiresTab(props: CanvasInspectorWiresTabProps) {
  const { flowCanvasPreferences, onFlowCanvasPreferencesChange } = props;

  const visibleCardIds = DEFAULT_WIRES_TAB_CARD_ORDER;

  const [cardOrder, setCardOrder] = useState<CanvasInspectorWiresTabCardId[]>(() =>
    mergeWiresTabCardOrder(readWiresTabCardOrder(), visibleCardIds),
  );
  const [collapsedById, setCollapsedById] = useState<Record<CanvasInspectorWiresTabCardId, boolean>>(
    () => readWiresTabCardCollapsed(),
  );
  const [dragId, setDragId] = useState<CanvasInspectorWiresTabCardId | null>(null);

  useEffect(() => {
    setCardOrder((prev) => mergeWiresTabCardOrder(prev, visibleCardIds));
  }, [visibleCardIds]);

  const onDropCard = (targetId: CanvasInspectorWiresTabCardId) => {
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
      writeWiresTabCardOrder(next);
      return next;
    });
  };

  const setCardCollapsed = (id: CanvasInspectorWiresTabCardId, collapsed: boolean) => {
    setCollapsedById((prev) => {
      const next = { ...prev, [id]: collapsed };
      writeWiresTabCardCollapsed(next);
      return next;
    });
  };

  const edgeBusLaneSortOptions = useMemo(
    () =>
      CANVAS_EDGE_BUS_LANE_SORT_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasEdgeBusLaneSort> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

  const edgeBundleModeOptions = useMemo(
    () =>
      CANVAS_EDGE_BUNDLE_MODE_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasEdgeBundleMode> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

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

  const strokeWidthOptions = useMemo(
    () =>
      CANVAS_EDGE_STROKE_WIDTH_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasEdgeStrokeWidth> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

  const typeLabelOptions = useMemo(
    () =>
      CANVAS_EDGE_TYPE_LABEL_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasEdgeTypeLabelMode> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

  const selectionHighlightOptions = useMemo(
    () =>
      CANVAS_EDGE_SELECTION_HIGHLIGHT_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasEdgeSelectionHighlight> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

  const markerSizeOptions = useMemo(
    () =>
      CANVAS_EDGE_MARKER_SIZE_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasEdgeMarkerSize> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

  const handleSizeOptions = useMemo(
    () =>
      CANVAS_HANDLE_SIZE_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasHandleSizePx> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

  const handleBorderOptions = useMemo(
    () =>
      CANVAS_HANDLE_BORDER_OPTIONS.map(
        (o): InspectorSegmentOption<FlowCanvasHandleBorderWidthPx> => ({
          value: o.value,
          label: o.label,
          hint: o.hint,
        }),
      ),
    [],
  );

  const showSmoothCorners =
    flowCanvasPreferences.edgeRoutingStyle === "smoothstep" ||
    flowCanvasPreferences.edgeRoutingStyle === "step";

  const cardsById: Partial<Record<CanvasInspectorWiresTabCardId, JSX.Element>> = {
    "path-shape": (
      <CanvasInspectorCard
        id="canvas-inspector-card-path-shape"
        title="Path & shape"
        hint="How wires route between sockets."
        collapsible
        collapsed={collapsedById["path-shape"]}
        onCollapsedChange={(next) => setCardCollapsed("path-shape", next)}
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
          {showSmoothCorners ? (
            <InspectorNumericScrubRow
              label="Corner radius"
              description="Rounded corners on smooth and step paths (px)."
              ariaLabel="Wire corner radius in pixels"
              value={flowCanvasPreferences.smoothStepBorderRadius}
              min={0}
              max={24}
              step={1}
              fractionDigits={0}
              onCommit={(next) =>
                onFlowCanvasPreferencesChange({ smoothStepBorderRadius: next })
              }
            />
          ) : null}
          <InspectorNumericScrubRow
            label="Parallel spacing"
            description="Separate multiple wires between the same two nodes (0 = off)."
            ariaLabel="Parallel wire spacing in pixels"
            value={flowCanvasPreferences.edgeParallelSpacing}
            min={0}
            max={32}
            step={2}
            fractionDigits={0}
            onCommit={(next) =>
              onFlowCanvasPreferencesChange({ edgeParallelSpacing: next })
            }
          />
          <InspectorPropertyRow
            label="Bundle mode"
            description="Fan wires from shared output or input sockets (trunk spacing below)."
          >
            <InspectorSegmentButtonGroup
              ariaLabel="Wire bundle mode"
              layout="grid-2"
              value={flowCanvasPreferences.edgeBundleMode}
              options={edgeBundleModeOptions}
              onChange={(next) =>
                onFlowCanvasPreferencesChange({
                  edgeBundleMode: next as FlowCanvasEdgeBundleMode,
                })
              }
            />
          </InspectorPropertyRow>
          {flowCanvasPreferences.edgeBundleMode !== "off" ? (
            <InspectorNumericScrubRow
              label="Bundle spacing"
              description="Per-wire offset for fan-out / fan-in groups (px). Stacks with parallel spacing."
              ariaLabel="Wire bundle spacing in pixels"
              value={flowCanvasPreferences.edgeBundleSpacing}
              min={0}
              max={32}
              step={2}
              fractionDigits={0}
              onCommit={(next) =>
                onFlowCanvasPreferencesChange({ edgeBundleSpacing: next })
              }
            />
          ) : null}
          <InspectorNumericScrubRow
            label="Bus lane spacing"
            description="Order fan-out from the same output by target position (use after auto-layout)."
            ariaLabel="Bus lane wire spacing in pixels"
            value={flowCanvasPreferences.edgeBusLaneSpacing}
            min={0}
            max={32}
            step={2}
            fractionDigits={0}
            onCommit={(next) =>
              onFlowCanvasPreferencesChange({ edgeBusLaneSpacing: next })
            }
          />
          {flowCanvasPreferences.edgeBusLaneSpacing > 0 ? (
            <InspectorPropertyRow
              label="Bus lane sort"
              description="Which axis to order targets on."
            >
              <InspectorSegmentButtonGroup
                ariaLabel="Bus lane target sort axis"
                layout="grid-2"
                value={flowCanvasPreferences.edgeBusLaneSort}
                options={edgeBusLaneSortOptions}
                onChange={(next) =>
                  onFlowCanvasPreferencesChange({
                    edgeBusLaneSort: next as FlowCanvasEdgeBusLaneSort,
                  })
                }
              />
            </InspectorPropertyRow>
          ) : null}
          {showSmoothCorners ? (
            <InspectorCompactToggleRow
              label="Step lane hop"
              hint="Slightly round corners on offset step/smooth wires (visual separation, not overlap bridges)."
              checked={flowCanvasPreferences.edgeStepLaneHop}
              onCheckedChange={(next) =>
                onFlowCanvasPreferencesChange({ edgeStepLaneHop: next })
              }
            />
          ) : null}
        </div>
      </CanvasInspectorCard>
    ),
    "stroke-motion": (
      <CanvasInspectorCard
        id="canvas-inspector-card-stroke-motion"
        title="Stroke & motion"
        hint="Wire thickness and flowing animation."
        collapsible
        collapsed={collapsedById["stroke-motion"]}
        onCollapsedChange={(next) => setCardCollapsed("stroke-motion", next)}
      >
        <InspectorPropertyRow label="Stroke width">
          <InspectorSegmentButtonGroup
            ariaLabel="Flow edge stroke width"
            layout="grid-3"
            value={flowCanvasPreferences.edgeStrokeWidth}
            options={strokeWidthOptions}
            onChange={(next) =>
              onFlowCanvasPreferencesChange({
                edgeStrokeWidth: next as FlowCanvasEdgeStrokeWidth,
              })
            }
          />
        </InspectorPropertyRow>
        <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorCompactToggleRow
            label="Flowing wires"
            hint="Animated dash along connected wires."
            checked={flowCanvasPreferences.edgeAnimated}
            onCheckedChange={(next) => onFlowCanvasPreferencesChange({ edgeAnimated: next })}
          />
          <InspectorNumericScrubRow
            label="Idle opacity"
            description="Opacity when wires are not highlighted by selection."
            ariaLabel="Wire idle opacity"
            value={flowCanvasPreferences.edgeIdleOpacity}
            min={0.25}
            max={1}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => onFlowCanvasPreferencesChange({ edgeIdleOpacity: next })}
          />
        </div>
      </CanvasInspectorCard>
    ),
    selection: (
      <CanvasInspectorCard
        id="canvas-inspector-card-wire-selection"
        title="Selection"
        hint="Selected wires, hover, and node-linked dimming."
        collapsible
        collapsed={collapsedById.selection}
        onCollapsedChange={(next) => setCardCollapsed("selection", next)}
      >
        <InspectorPropertyRow
          label="Selected wire glow"
          description="Port-colored halo when a wire is selected on the canvas."
        >
          <InspectorSegmentButtonGroup
            ariaLabel="Selected wire highlight strength"
            layout="grid-3"
            value={flowCanvasPreferences.edgeSelectionHighlight}
            options={selectionHighlightOptions}
            onChange={(next) =>
              onFlowCanvasPreferencesChange({
                edgeSelectionHighlight: next as FlowCanvasEdgeSelectionHighlight,
              })
            }
          />
        </InspectorPropertyRow>
        <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorCompactToggleRow
            label="Elevate selected wires"
            hint="Draw selected wires above nodes and other edges."
            checked={flowCanvasPreferences.elevateEdgesOnSelect}
            onCheckedChange={(next) =>
              onFlowCanvasPreferencesChange({ elevateEdgesOnSelect: next })
            }
          />
          <InspectorCompactToggleRow
            label="Highlight on hover"
            hint="Brighter stroke when the pointer is over a wire."
            checked={flowCanvasPreferences.edgeHoverHighlight}
            onCheckedChange={(next) =>
              onFlowCanvasPreferencesChange({ edgeHoverHighlight: next })
            }
          />
          <InspectorCompactToggleRow
            label="Dim unrelated wires"
            hint="Fade connection lines that do not touch the selected node(s). Does not change socket dots — use Dim unwired sockets for that."
            checked={flowCanvasPreferences.dimUnrelatedEdgesOnSelection}
            onCheckedChange={(next) =>
              onFlowCanvasPreferencesChange({ dimUnrelatedEdgesOnSelection: next })
            }
          />
        </div>
      </CanvasInspectorCard>
    ),
    "direction-labels": (
      <CanvasInspectorCard
        id="canvas-inspector-card-direction-labels"
        title="Direction & labels"
        hint="Arrows and port-type badges on wires."
        collapsible
        collapsed={collapsedById["direction-labels"]}
        onCollapsedChange={(next) => setCardCollapsed("direction-labels", next)}
      >
        <InspectorCompactToggleRow
          label="Direction arrows"
          hint="Arrow at the target end of each wire (hidden when zoomed out)."
          checked={flowCanvasPreferences.edgeShowMarkers}
          onCheckedChange={(next) => onFlowCanvasPreferencesChange({ edgeShowMarkers: next })}
        />
        {flowCanvasPreferences.edgeShowMarkers ? (
          <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
            <InspectorPropertyRow label="Arrow size">
              <InspectorSegmentButtonGroup
                ariaLabel="Wire direction arrow size"
                layout="grid-2"
                value={flowCanvasPreferences.edgeMarkerSize}
                options={markerSizeOptions}
                onChange={(next) =>
                  onFlowCanvasPreferencesChange({
                    edgeMarkerSize: next as FlowCanvasEdgeMarkerSize,
                  })
                }
              />
            </InspectorPropertyRow>
            <InspectorNumericScrubRow
              label="Hide arrows below zoom"
              description="0.55 = hide when canvas is below 55% zoom."
              ariaLabel="Minimum zoom to show wire arrows"
              value={flowCanvasPreferences.edgeMarkerHideBelowZoom}
              min={0.3}
              max={1}
              step={0.05}
              fractionDigits={2}
              onCommit={(next) =>
                onFlowCanvasPreferencesChange({ edgeMarkerHideBelowZoom: next })
              }
            />
          </div>
        ) : null}
        <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorPropertyRow
            label="Port type on wire"
            description="Badge with port type name (wire color unchanged)."
          >
            <InspectorSegmentButtonGroup
              ariaLabel="Wire port type labels"
              layout="grid-2"
              value={flowCanvasPreferences.edgeShowTypeLabel}
              options={typeLabelOptions}
              onChange={(next) =>
                onFlowCanvasPreferencesChange({
                  edgeShowTypeLabel: next as FlowCanvasEdgeTypeLabelMode,
                })
              }
            />
          </InspectorPropertyRow>
        </div>
      </CanvasInspectorCard>
    ),
    "live-semantics": (
      <CanvasInspectorCard
        id="canvas-inspector-card-live-semantics"
        title="Live sensor wires"
        hint="Style wires from nodes with telemetry health on the source socket."
        collapsible
        collapsed={collapsedById["live-semantics"]}
        onCollapsedChange={(next) => setCardCollapsed("live-semantics", next)}
      >
        <InspectorCompactToggleRow
          label="Highlight live sources"
          hint="Glow wires whose source node is receiving live sensor data."
          checked={flowCanvasPreferences.liveEdgeHighlight}
          onCheckedChange={(next) => onFlowCanvasPreferencesChange({ liveEdgeHighlight: next })}
        />
        <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorCompactToggleRow
            label="Dashed stale / offline"
            hint="Dashed stroke when the source node health is stale or offline."
            checked={flowCanvasPreferences.staleEdgeDash}
            onCheckedChange={(next) => onFlowCanvasPreferencesChange({ staleEdgeDash: next })}
          />
        </div>
      </CanvasInspectorCard>
    ),
    handles: (
      <CanvasInspectorCard
        id="canvas-inspector-card-handles"
        title="Sockets (handles)"
        hint="Size and emphasis of connection points on nodes."
        collapsible
        collapsed={collapsedById.handles}
        onCollapsedChange={(next) => setCardCollapsed("handles", next)}
      >
        <InspectorPropertyRow label="Handle size (px)">
          <InspectorSegmentButtonGroup
            ariaLabel="Flow socket handle size"
            layout="grid-3"
            value={flowCanvasPreferences.handleSizePx}
            options={handleSizeOptions}
            onChange={(next) =>
              onFlowCanvasPreferencesChange({
                handleSizePx: next as FlowCanvasHandleSizePx,
              })
            }
          />
        </InspectorPropertyRow>
        <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorPropertyRow label="Ring width">
            <InspectorSegmentButtonGroup
              ariaLabel="Flow socket border width"
              layout="grid-2"
              value={flowCanvasPreferences.handleBorderWidthPx}
              options={handleBorderOptions}
              onChange={(next) =>
                onFlowCanvasPreferencesChange({
                  handleBorderWidthPx: next as FlowCanvasHandleBorderWidthPx,
                })
              }
            />
          </InspectorPropertyRow>
        </div>
        <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorCompactToggleRow
            label="Dim unwired sockets"
            hint="Fade socket dots with no wire on all nodes. Not the same as Dim unrelated wires, which fades connection lines."
            checked={flowCanvasPreferences.handleDimWhenUnwired}
            onCheckedChange={(next) =>
              onFlowCanvasPreferencesChange({ handleDimWhenUnwired: next })
            }
          />
          {flowCanvasPreferences.handleDimWhenUnwired ? (
            <InspectorPropertyRow
              label="Unwired fade"
              description="Opacity for unwired handles (0.15–0.85)."
            >
              <InspectorNumericField
                ariaLabel="Unwired socket dim opacity"
                value={flowCanvasPreferences.handleUnwiredDimOpacity}
                min={0.15}
                max={0.85}
                step={0.05}
                fractionDigits={2}
                onCommit={(next) =>
                  onFlowCanvasPreferencesChange({ handleUnwiredDimOpacity: next })
                }
              />
            </InspectorPropertyRow>
          ) : null}
        </div>
      </CanvasInspectorCard>
    ),
    connecting: (
      <CanvasInspectorCard
        id="canvas-inspector-card-connecting"
        title="Connecting"
        hint="Preview wire while dragging from a socket."
        collapsible
        collapsed={collapsedById.connecting}
        onCollapsedChange={(next) => setCardCollapsed("connecting", next)}
      >
        <InspectorNumericScrubRow
          label="Preview width"
          description="Stroke width of the wire preview (px)."
          ariaLabel="Connection preview stroke width"
          value={flowCanvasPreferences.connectionLineStrokeWidth}
          min={1}
          max={4}
          step={0.5}
          fractionDigits={1}
          onCommit={(next) =>
            onFlowCanvasPreferencesChange({ connectionLineStrokeWidth: next })
          }
        />
        <div className="mt-2.5 space-y-2.5 border-t border-zinc-800/60 pt-2.5">
          <InspectorNumericScrubRow
            label="Snap radius"
            description="Distance to snap onto a handle when connecting or re-wiring (px). Larger values feel more magnetic."
            ariaLabel="Connection handle snap radius"
            value={flowCanvasPreferences.connectionRadius}
            min={8}
            max={56}
            step={1}
            fractionDigits={0}
            onCommit={(next) => onFlowCanvasPreferencesChange({ connectionRadius: next })}
          />
          <InspectorNumericScrubRow
            label="Pick width"
            description="Invisible hit area around each wire for click and context menu (px)."
            ariaLabel="Wire interaction pick width"
            value={flowCanvasPreferences.edgeInteractionWidth}
            min={8}
            max={40}
            step={2}
            fractionDigits={0}
            onCommit={(next) =>
              onFlowCanvasPreferencesChange({ edgeInteractionWidth: next })
            }
          />
        </div>
      </CanvasInspectorCard>
    ),
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
