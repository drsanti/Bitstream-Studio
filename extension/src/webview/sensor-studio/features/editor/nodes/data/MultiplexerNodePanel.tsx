import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  DEFAULT_MULTIPLEXER_PATHS,
  readMultiplexerPaths,
} from "../../../../core/flow/json-path";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

export type MultiplexerNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function MultiplexerNodePanel(props: MultiplexerNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const paths = readMultiplexerPaths(defaultConfig);

  return (
    <ReadingPanel className="nodrag nopan space-y-1.5">
      {Object.keys(DEFAULT_MULTIPLEXER_PATHS).map((key) => (
        <label key={key} className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span className="w-4 shrink-0 font-semibold uppercase text-zinc-300">{key}</span>
          <input
            className="min-w-0 flex-1 rounded border border-zinc-700/80 bg-zinc-950/60 px-2 py-1 text-[10px] text-zinc-100"
            value={paths[key] ?? ""}
            onChange={(e) => {
              updateField(nodeId, "paths", { ...paths, [key]: e.target.value });
            }}
            aria-label={`JSON path for output ${key}`}
          />
        </label>
      ))}
    </ReadingPanel>
  );
}
