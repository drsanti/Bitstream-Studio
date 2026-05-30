import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { EnvironmentNodeControls } from "./EnvironmentNodeControls";

export type EnvironmentNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function EnvironmentNodePanel(props: EnvironmentNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);

  return (
    <ReadingPanel className="space-y-2">
      <EnvironmentNodeControls
        defaultConfig={defaultConfig}
        compactForFlowNodeBody
        onUpdateField={(key, value) => {
          updateField(nodeId, key, value);
        }}
      />
    </ReadingPanel>
  );
}
