import { Frame, Maximize2, Trash2 } from "lucide-react";
import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNRangeSlider,
  TRNToggleSwitch,
} from "../../../../../ui/TRN";
import {
  FRAME_FIT_PAD,
  FRAME_HEADER_H,
} from "../../layout/frame-flow-nodes";
import type { FrameLayoutNodeData } from "../../layout/layout-flow-nodes.types";
import { useFlowEditorStore } from "../../store/flow-editor.store";

type FrameLayoutInspectorSectionProps = {
  frameNodeId: string;
  data: FrameLayoutNodeData;
};

export function FrameLayoutInspectorSection(props: FrameLayoutInspectorSectionProps) {
  const { frameNodeId, data } = props;
  const childCount = useFlowEditorStore(
    (s) => s.nodes.filter((n) => n.parentId === frameNodeId).length,
  );
  const updateLayoutNodeData = useFlowEditorStore((s) => s.updateLayoutNodeData);
  const fitSelectedFramesToContents = useFlowEditorStore((s) => s.fitSelectedFramesToContents);
  const dissolveSelectedFrames = useFlowEditorStore((s) => s.dissolveSelectedFrames);

  const padding = typeof data.padding === "number" ? data.padding : FRAME_FIT_PAD;
  const headerHeight = typeof data.headerHeight === "number" ? data.headerHeight : FRAME_HEADER_H;
  const padTop = typeof data.padTop === "number" ? data.padTop : 0;
  const autoFit = Boolean(data.autoFit);

  const applyLayout = (patch: Partial<FrameLayoutNodeData>) => {
    updateLayoutNodeData(frameNodeId, patch);
    if (childCount > 0) {
      fitSelectedFramesToContents([frameNodeId]);
    }
  };

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-hide">
      <TRNHintText className="text-[11px]">
        Drag studio nodes onto the frame to parent them. Children move with the frame.
      </TRNHintText>

      <div className="flex flex-col gap-2">
        <TRNButton
          type="button"
          className="w-full justify-center"
          disabled={childCount === 0}
          prefixIcon={<Maximize2 className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => {
            fitSelectedFramesToContents([frameNodeId]);
          }}
        >
          Fit to contents
        </TRNButton>
        <TRNButton
          type="button"
          className="w-full justify-center"
          prefixIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => {
            dissolveSelectedFrames([frameNodeId]);
          }}
        >
          Dissolve frame (keep nodes)
        </TRNButton>
      </div>

      <TRNFormField label="Auto-fit to contents" id={`frame-${frameNodeId}-autofit`} className="space-y-1.5">
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-zinc-950/45 px-2.5 py-2">
          <span className="text-[11px] text-zinc-300">
            Resize frame when children move or drop in
          </span>
          <TRNToggleSwitch
            checked={autoFit}
            ariaLabel="Auto-fit frame to contents"
            onCheckedChange={(next) => {
              updateLayoutNodeData(frameNodeId, { autoFit: next });
              if (next && childCount > 0) {
                fitSelectedFramesToContents([frameNodeId]);
              }
            }}
          />
        </div>
      </TRNFormField>

      <div className="space-y-2 border-t border-zinc-800/80 pt-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          <Frame className="h-3 w-3" aria-hidden />
          Padding
        </div>
        <TRNRangeSlider
          label="Sides & bottom"
          min={0}
          max={64}
          step={1}
          value={padding}
          valueLabel={`${padding}px`}
          onChange={(event) => {
            applyLayout({
              padding: Number(event.target.value),
              padX: undefined,
              padY: undefined,
              padLeft: undefined,
              padRight: undefined,
              padBottom: undefined,
            });
          }}
        />
        <TRNRangeSlider
          label="Header height"
          min={20}
          max={72}
          step={1}
          value={headerHeight}
          valueLabel={`${headerHeight}px`}
          onChange={(event) => {
            applyLayout({ headerHeight: Number(event.target.value) });
          }}
        />
        <TRNRangeSlider
          label="Gap below header"
          min={0}
          max={48}
          step={1}
          value={padTop}
          valueLabel={`${padTop}px`}
          onChange={(event) => {
            applyLayout({ padTop: Number(event.target.value) });
          }}
        />
      </div>

      <TRNHintText className="text-[10px]">
        {childCount === 0
          ? "No child nodes — drop nodes on the frame or enable auto-fit before parenting."
          : `${childCount} child node${childCount === 1 ? "" : "s"} in this frame.`}
      </TRNHintText>
    </div>
  );
}
