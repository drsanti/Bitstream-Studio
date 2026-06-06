import { TRNInlineToggleRow, TRNBadgedScrubNumberFieldGrid } from "../../../../../ui/TRN";
import { MAP_RANGE_INPUT_DEFAULTS } from "../../../../core/flow/map-range-operations";
import { STUDIO_HANDLE_IN } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowCardBadgedScrubNumberField } from "../flow-node/FlowCardBadgedScrubNumberField";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

const RANGE_FIELDS = [
  {
    key: "inMin" as const,
    badge: { kind: "text" as const, text: "In−", tone: "sky" as const },
    fallback: MAP_RANGE_INPUT_DEFAULTS.inMin,
  },
  {
    key: "inMax" as const,
    badge: { kind: "text" as const, text: "In+", tone: "sky" as const },
    fallback: MAP_RANGE_INPUT_DEFAULTS.inMax,
  },
  {
    key: "outMin" as const,
    badge: { kind: "text" as const, text: "Out−", tone: "violet" as const },
    fallback: MAP_RANGE_INPUT_DEFAULTS.outMin,
  },
  {
    key: "outMax" as const,
    badge: { kind: "text" as const, text: "Out+", tone: "violet" as const },
    fallback: MAP_RANGE_INPUT_DEFAULTS.outMax,
  },
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

  const visibleFields = RANGE_FIELDS.filter(({ key }) => !isHandleWired(key));

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
      {visibleFields.length > 0 ? (
        <TRNBadgedScrubNumberFieldGrid columns={2}>
          {visibleFields.map(({ key, badge, fallback }) => (
            <FlowCardBadgedScrubNumberField
              key={key}
              badge={badge}
              ariaLabel={`Map range ${key}`}
              value={readFiniteConfigNumber(defaultConfig[key], fallback)}
              step={0.01}
              onCommit={(next) => {
                updateField(nodeId, key, next);
              }}
            />
          ))}
        </TRNBadgedScrubNumberFieldGrid>
      ) : null}
    </ReadingPanel>
  );
}
