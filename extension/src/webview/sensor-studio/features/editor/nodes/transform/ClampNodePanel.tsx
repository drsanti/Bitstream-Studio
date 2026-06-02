import { TRNScrubNumberInput } from "../../../../../ui/TRN";
import { CLAMP_INPUT_DEFAULTS } from "../../../../core/flow/clamp-operations";
import { STUDIO_HANDLE_IN } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

const FIELDS = [
  { key: "min" as const, label: "Min", fallback: CLAMP_INPUT_DEFAULTS.min },
  { key: "max" as const, label: "Max", fallback: CLAMP_INPUT_DEFAULTS.max },
] as const;

function readFiniteConfigNumber(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export type ClampNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function ClampNodePanel(props: ClampNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const edges = useFlowEditorStore((s) => s.edges);

  const isHandleWired = (handleId: string): boolean =>
    edges.some(
      (e) =>
        e.target === nodeId &&
        (e.targetHandle ?? STUDIO_HANDLE_IN) === handleId,
    );

  const visibleFields = FIELDS.filter(({ key }) => !isHandleWired(key));

  // If both `Min` and `Max` handles are wired, socket rows already show the live values.
  // Avoid rendering disabled config controls (which create empty padding).
  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <ReadingPanel className="nodrag nopan space-y-2">
      {visibleFields.map(({ key, label, fallback }) => (
        <label
          key={key}
          className="flex items-center gap-2 text-[10px] text-zinc-400"
        >
          <span className="w-8 shrink-0 text-zinc-300">{label}</span>
          <TRNScrubNumberInput
            className="min-w-0 flex-1"
            value={readFiniteConfigNumber(defaultConfig[key], fallback)}
            step={0.01}
            aria-label={`Clamp ${label}`}
            onChange={(next) => {
              updateField(nodeId, key, next);
            }}
          />
        </label>
      ))}
    </ReadingPanel>
  );
}
