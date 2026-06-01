import { TRNInlineToggleRow, TRNScrubNumberInput } from "../../../../../ui/TRN";
import { MAP_RANGE_INPUT_DEFAULTS } from "../../../../core/flow/map-range-operations";
import { STUDIO_HANDLE_IN } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

const RANGE_FIELDS = [
  { key: "inMin" as const, label: "From min", fallback: MAP_RANGE_INPUT_DEFAULTS.inMin },
  { key: "inMax" as const, label: "From max", fallback: MAP_RANGE_INPUT_DEFAULTS.inMax },
  { key: "outMin" as const, label: "To min", fallback: MAP_RANGE_INPUT_DEFAULTS.outMin },
  { key: "outMax" as const, label: "To max", fallback: MAP_RANGE_INPUT_DEFAULTS.outMax },
] as const;

function readFiniteConfigNumber(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export type MapRangeNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function MapRangeNodePanel(props: MapRangeNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const edges = useFlowEditorStore((s) => s.edges);
  const clampEnabled = defaultConfig.clamp !== false;

  const isHandleWired = (handleId: string): boolean =>
    edges.some(
      (e) =>
        e.target === nodeId &&
        (e.targetHandle ?? STUDIO_HANDLE_IN) === handleId,
    );

  return (
    <ReadingPanel className="nodrag nopan space-y-2">
      <TRNInlineToggleRow
        label="Clamp"
        hint="Clip mapped result to the output range."
        checked={clampEnabled}
        onCheckedChange={(next) => {
          updateField(nodeId, "clamp", next);
        }}
      />
      {RANGE_FIELDS.map(({ key, label, fallback }) => {
        const wired = isHandleWired(key);
        return (
          <label
            key={key}
            className={`flex items-center gap-2 text-[10px] ${wired ? "text-zinc-500" : "text-zinc-400"}`}
          >
            <span className="w-14 shrink-0 text-zinc-300">{label}</span>
            <TRNScrubNumberInput
              className="min-w-0 flex-1"
              value={readFiniteConfigNumber(defaultConfig[key], fallback)}
              step={0.01}
              disabled={wired}
              aria-label={`Map range ${label}`}
              onChange={(next) => {
                updateField(nodeId, key, next);
              }}
            />
          </label>
        );
      })}
    </ReadingPanel>
  );
}
