import { TRNScrubNumberInput } from "../../../../../ui/TRN";
import { resolveStudioNodeMinDimensionFloor } from "../../nodes/flow-node/studio-node-resize-defaults";
import {
  readStudioFlowNodeLayoutSize,
  STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX,
} from "../../nodes/flow-node/studio-node-layout-size";
import {
  readStudioNodeChromeLayoutWidthMap,
  resolveStudioNodeChromeLayoutKey,
  STUDIO_NODE_CHROME_LAYOUT_KEY_META,
  studioNodeChromeLayoutKeysForData,
  type StudioNodeChromeLayoutKey,
} from "../../nodes/flow-node/studio-node-chrome-layout";
import type { StudioNode } from "../../store/flow-editor.store";
import { studioNodeHasHideableBody } from "../../nodes/flow-node/socket-display";

const LAYOUT_SIZE_MAX_PX = 4096;

export type InspectorNodeChromeLayoutWidthFieldsProps = {
  selectedNode: StudioNode;
  onCommitChromeWidth: (chromeKey: StudioNodeChromeLayoutKey, widthPx: number) => void;
};

export function InspectorNodeChromeLayoutWidthFields(
  props: InspectorNodeChromeLayoutWidthFieldsProps,
) {
  const { selectedNode, onCommitChromeWidth } = props;
  const keys = studioNodeChromeLayoutKeysForData(selectedNode.data);
  const map = readStudioNodeChromeLayoutWidthMap(selectedNode.data.ui);
  const catalogFloor = resolveStudioNodeMinDimensionFloor(selectedNode.data.nodeId).minWidth;
  const canvasWidth = readStudioFlowNodeLayoutSize(selectedNode).width;
  const activeKey = resolveStudioNodeChromeLayoutKey(
    selectedNode.data.ui,
    studioNodeHasHideableBody(selectedNode.data),
  );

  return (
    <div className="space-y-1">
      {keys.map((key) => {
        const meta = STUDIO_NODE_CHROME_LAYOUT_KEY_META[key];
        const stored = map[key];
        const isActive = key === activeKey;
        const displayValue =
          stored ??
          (isActive ? canvasWidth : catalogFloor);
        const unset = stored == null;
        return (
          <label
            key={key}
            className={
              "flex min-w-0 items-center gap-2 rounded border px-2 py-1 " +
              (isActive
                ? "border-violet-500/45 bg-violet-950/20"
                : "border-zinc-700/60 bg-zinc-900/35")
            }
          >
            <span
              className={
                "min-w-0 flex-1 text-[10px] font-medium leading-snug " +
                (isActive ? "text-violet-100" : "text-zinc-300")
              }
              title={meta.hint}
            >
              {meta.label}
              {isActive ? (
                <span className="ml-1 text-[9px] font-semibold uppercase tracking-wide text-violet-300/90">
                  · active
                </span>
              ) : null}
              {unset ? (
                <span className="ml-1 text-[9px] text-zinc-500">· unset</span>
              ) : null}
            </span>
            <TRNScrubNumberInput
              aria-label={`Width for ${meta.label}`}
              value={displayValue}
              min={STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX}
              max={LAYOUT_SIZE_MAX_PX}
              step={1}
              fractionDigits={0}
              pointerScrubEnabled
              onChange={(next) => onCommitChromeWidth(key, next)}
            />
          </label>
        );
      })}
    </div>
  );
}
