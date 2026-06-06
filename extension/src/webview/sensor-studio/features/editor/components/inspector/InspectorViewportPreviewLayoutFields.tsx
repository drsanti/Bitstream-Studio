import { useMemo } from "react";
import { TRNHintText } from "../../../../../ui/TRN/TRNHintText";
import type { StudioNode } from "../../store/flow-editor.store";
import { isScene3dInspectorNodeId } from "../../nodes/scene3d/scene3d-inspector-node-ids";
import { readStudioFlowNodeLayoutSize } from "../../nodes/flow-node/studio-node-layout-size";
import {
  formatViewportPreviewLayoutSummary,
  resolveViewportPreviewLayoutSelection,
  STUDIO_VIEWPORT_PREVIEW_ASPECTS,
  STUDIO_VIEWPORT_PREVIEW_SIZE_TIERS,
  studioViewportPreviewSizeTierLabel,
  type StudioViewportPreviewAspect,
  type StudioViewportPreviewSizeTier,
} from "../../nodes/flow-node/studio-viewport-preview-layout";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import {
  InspectorSegmentButtonGroup,
  type InspectorSegmentOption,
} from "./InspectorSegmentButtonGroup";

const ASPECT_OPTIONS: InspectorSegmentOption<StudioViewportPreviewAspect>[] =
  STUDIO_VIEWPORT_PREVIEW_ASPECTS.map((value) => ({
    value,
    label: value,
    hint: `Set node size to ${value} aspect (width-primary tiers).`,
  }));

const SIZE_OPTIONS: InspectorSegmentOption<StudioViewportPreviewSizeTier>[] =
  STUDIO_VIEWPORT_PREVIEW_SIZE_TIERS.map((value) => ({
    value,
    label: studioViewportPreviewSizeTierLabel(value),
    hint: `Preview width ${value === "sm" ? "320" : value === "md" ? "480" : "640"} px before aspect.`,
  }));

export type InspectorViewportPreviewLayoutFieldsProps = {
  selectedNode: StudioNode;
};

export function InspectorViewportPreviewLayoutFields(
  props: InspectorViewportPreviewLayoutFieldsProps,
) {
  const { selectedNode } = props;
  const applyViewportPreviewLayout = useFlowEditorStore(
    (s) => s.applySelectedViewportPreviewLayout,
  );

  const layoutSize = useMemo(
    () => readStudioFlowNodeLayoutSize(selectedNode),
    [selectedNode],
  );

  const selection = useMemo(
    () => resolveViewportPreviewLayoutSelection(selectedNode),
    [selectedNode, layoutSize.width, layoutSize.height],
  );

  if (!isScene3dInspectorNodeId(selectedNode.data.nodeId)) {
    return null;
  }

  const summary = formatViewportPreviewLayoutSummary({
    nodeWidth: layoutSize.width,
    nodeHeight: layoutSize.height,
    canvasWidth: selection.canvasWidth,
    canvasHeight: selection.canvasHeight,
    aspect: selection.aspect,
    sizeTier: selection.sizeTier,
    isCustom: selection.isCustom,
  });

  return (
    <div className="space-y-2">
      <InspectorPropertyRow
        label="Preview aspect"
        description="Shape of the 3D preview. Sizes apply to the whole node; socket rows sit above the canvas."
      >
        <InspectorSegmentButtonGroup<string>
          ariaLabel="Preview aspect ratio"
          layout="row"
          value={selection.aspect ?? ""}
          options={ASPECT_OPTIONS}
          onChange={(next) =>
            applyViewportPreviewLayout({
              aspect: next as StudioViewportPreviewAspect,
            })
          }
        />
      </InspectorPropertyRow>

      <InspectorPropertyRow
        label="Preview size"
        description="Small, medium, and large base widths; height follows the selected aspect."
      >
        <InspectorSegmentButtonGroup<string>
          ariaLabel="Preview size tier"
          layout="row"
          value={selection.sizeTier ?? ""}
          options={SIZE_OPTIONS}
          onChange={(next) =>
            applyViewportPreviewLayout({
              sizeTier: next as StudioViewportPreviewSizeTier,
            })
          }
        />
      </InspectorPropertyRow>

      <TRNHintText className="px-0.5 text-[10px]">{summary}</TRNHintText>
    </div>
  );
}
