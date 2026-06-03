import { useMemo } from "react";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorNodeLayoutSizeFields } from "./InspectorNodeLayoutSizeFields";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { InspectorSection } from "./InspectorSection";
import {
  readStudioFlowNodeLayoutSize,
  resolveStudioNodeEffectiveMinDimensions,
} from "../../nodes/flow-node/studio-node-layout-size";
import {
  isStudioSensorSocketPreviewNodeId,
  type StudioNode,
} from "../../store/flow-editor.store";
import { studioNodeHasHideableBody } from "../../nodes/flow-node/socket-display";
import { studioNodeAllowsBodyCollapse } from "../../nodes/flow-node/studio-body-collapse";

export type NodeInspectorCanvasLayoutSectionProps = {
  selectedNode: StudioNode;
  onResizableChange: (next: boolean) => void;
  onAllowBodyCollapseChange: (next: boolean) => void;
  onLayoutDimensionsChange: (patch: { width?: number; height?: number }) => void;
};

export function NodeInspectorCanvasLayoutSection(
  props: NodeInspectorCanvasLayoutSectionProps,
) {
  const {
    selectedNode,
    onResizableChange,
    onAllowBodyCollapseChange,
    onLayoutDimensionsChange,
  } = props;
  const resizable = selectedNode.data.ui?.resizable === true;
  const autoHeightHint = isStudioSensorSocketPreviewNodeId(selectedNode.data.nodeId);
  const hasBodyPanel = studioNodeHasHideableBody(selectedNode.data);
  const allowBodyCollapse = studioNodeAllowsBodyCollapse(selectedNode.data);

  const layout = useMemo(() => readStudioFlowNodeLayoutSize(selectedNode), [selectedNode]);
  const effectiveMin = useMemo(
    () =>
      resolveStudioNodeEffectiveMinDimensions(
        selectedNode.data.nodeId,
        selectedNode.data.ui,
      ),
    [selectedNode.data.nodeId, selectedNode.data.ui],
  );
  return (
    <InspectorSection
      title="Canvas"
      variant="compact"
      contentClassName="space-y-2 px-2 py-1.5"
      hint={
        autoHeightHint
          ? "Height usually follows socket content until you resize vertically."
          : undefined
      }
    >
      <InspectorCompactToggleRow
        label="Allow resize on canvas"
        hint="Saved in this flow · drag edges when the node is selected."
        checked={resizable}
        onCheckedChange={onResizableChange}
        ariaLabel="Allow resize on canvas"
      />
      {hasBodyPanel ? (
        <InspectorCompactToggleRow
          label="Allow collapsing node body"
          hint="When enabled, hide the body with the selection toolbar Panel button or Shift+B."
          checked={allowBodyCollapse}
          onCheckedChange={onAllowBodyCollapseChange}
          ariaLabel="Allow collapsing node body"
        />
      ) : null}

      <div className="space-y-1.5 border-t border-zinc-800/60 pt-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Node size (px)
        </div>
        <InspectorNodeLayoutSizeFields
          nodeId={selectedNode.id}
          width={layout.width}
          height={layout.height}
          disabled={!resizable}
          onCommit={onLayoutDimensionsChange}
        />
        <div className="rounded-md border border-zinc-700/60 bg-zinc-900/40 px-2 py-1.5">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
            Minimum (edge resize)
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <InspectorPropertyRow
              label="Min width"
              description="Edge resize on canvas cannot go below this"
            >
              <span className="text-[11px] font-medium text-zinc-300">
                {effectiveMin.minWidth}
              </span>
            </InspectorPropertyRow>
            <InspectorPropertyRow
              label="Min height"
              description="Edge resize on canvas cannot go below this"
            >
              <span className="text-[11px] font-medium text-zinc-300">
                {effectiveMin.minHeight}
              </span>
            </InspectorPropertyRow>
          </div>
        </div>
      </div>
    </InspectorSection>
  );
}
