import { twMerge } from "tailwind-merge";
import {
  normalizeCompareOperation,
  type CompareOperation,
} from "../../../../core/flow/compare-operations";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  compareOperationGlyph,
  compareOperationLabel,
  COMPARE_OPERATION_PICKER_ORDER,
} from "./compare-operation-display";

export type CompareNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function CompareOperationHeaderChip(props: { operation: CompareOperation }) {
  const { operation } = props;
  return (
    <span
      className="rounded border border-amber-500/55 bg-amber-950/45 px-1.5 py-px font-mono text-[11px] font-semibold tabular-nums text-amber-200/95"
      title={compareOperationLabel(operation)}
    >
      {compareOperationGlyph(operation)}
    </span>
  );
}

export function CompareNodePanel(props: CompareNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);

  const operation = normalizeCompareOperation(
    typeof defaultConfig.operation === "string" ? defaultConfig.operation : undefined,
  );

  return (
    <div
      className="nodrag nopan flex w-full justify-center px-2 pb-1.5 pt-1.5"
      role="group"
      aria-label="Compare operation"
    >
      <div className="grid grid-cols-6 gap-px">
        {COMPARE_OPERATION_PICKER_ORDER.map((op) => {
          const selected = operation === op;
          return (
            <button
              key={op}
              type="button"
              className={twMerge(
                "nodrag nopan flex h-5 w-5 items-center justify-center rounded-[3px] border p-0 font-mono text-[9px] font-semibold leading-none tabular-nums transition-colors",
                selected
                  ? "border-amber-500/70 bg-amber-950/55 text-amber-100"
                  : "border-zinc-700/80 bg-zinc-900/70 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-zinc-200",
              )}
              aria-label={compareOperationLabel(op)}
              aria-pressed={selected}
              onClick={() => {
                updateField(nodeId, "operation", op);
              }}
            >
              {compareOperationGlyph(op)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
