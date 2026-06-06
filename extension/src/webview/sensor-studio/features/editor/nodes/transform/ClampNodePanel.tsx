import { TRNBadgedScrubNumberFieldGrid } from "../../../../../ui/TRN";
import { CLAMP_INPUT_DEFAULTS } from "../../../../core/flow/clamp-operations";
import { STUDIO_HANDLE_IN } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowCardBadgedScrubNumberField } from "../flow-node/FlowCardBadgedScrubNumberField";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

const FIELDS = [
  {
    key: "min" as const,
    badge: { kind: "text" as const, text: "Min", tone: "sky" as const },
    fallback: CLAMP_INPUT_DEFAULTS.min,
  },
  {
    key: "max" as const,
    badge: { kind: "text" as const, text: "Max", tone: "violet" as const },
    fallback: CLAMP_INPUT_DEFAULTS.max,
  },
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

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <ReadingPanel className="nodrag nopan space-y-2">
      <TRNBadgedScrubNumberFieldGrid columns={2}>
        {visibleFields.map(({ key, badge, fallback }) => (
          <FlowCardBadgedScrubNumberField
            key={key}
            badge={badge}
            ariaLabel={`Clamp ${key}`}
            value={readFiniteConfigNumber(defaultConfig[key], fallback)}
            step={0.01}
            onCommit={(next) => {
              updateField(nodeId, key, next);
            }}
          />
        ))}
      </TRNBadgedScrubNumberFieldGrid>
    </ReadingPanel>
  );
}
