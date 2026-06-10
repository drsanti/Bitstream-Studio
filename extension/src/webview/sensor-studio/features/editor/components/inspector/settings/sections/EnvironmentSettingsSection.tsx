import { TRNInlineToggleRow } from "../../../../../../../ui/TRN";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { EnvironmentNodeControls } from "../../../../nodes/environment/EnvironmentNodeControls";
import {
  ENVIRONMENT_INPUT_HANDLE_DEFS,
  buildNextEnvironmentInputSocketVisibility,
  canHideEnvironmentInputSocket,
  environmentNodeHasIncomingOnHandle,
  readEnvironmentInputSocketVisibility,
} from "../../../../nodes/environment/environment-node-inputs";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function EnvironmentSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const edges = useFlowEditorStore((s) => s.edges);
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const vis = readEnvironmentInputSocketVisibility(dc);

  const patchSocketVisibility = (handleId: string, visible: boolean) => {
    if (!visible && !canHideEnvironmentInputSocket(edges, selectedNode.id, handleId)) {
      return;
    }
    onUpdateConfigField(
      "inputSocketVisibility",
      buildNextEnvironmentInputSocketVisibility(vis, handleId, visible),
    );
  };

  return (
    <InspectorSettingsSectionFrame title="Environment">
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-zinc-300">Modulation inputs</div>
          <div className="space-y-2">
            {ENVIRONMENT_INPUT_HANDLE_DEFS.map((def) => {
              const shown = vis[def.id] === true;
              const wired = environmentNodeHasIncomingOnHandle(edges, selectedNode.id, def.id);
              const disableToggle = shown && wired;
              return (
                <TRNInlineToggleRow
                  key={def.id}
                  label={`Pin · ${def.label}`}
                  hint={
                    wired
                      ? "This input has an incoming edge — disconnect it before you can hide the pin."
                      : "Expose this modulation input on the node (left handles). While shown, the duplicate manual control for that field is hidden on the node card only — Parameters below always lists every field for editing."
                  }
                  checked={shown}
                  disabled={disableToggle}
                  ariaLabel={`Show ${def.label} pin on node`}
                  onCheckedChange={(next) => {
                    patchSocketVisibility(def.id, next);
                  }}
                />
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-zinc-300">Parameters</div>
          <EnvironmentNodeControls
            defaultConfig={dc}
            edges={edges}
            nodeId={selectedNode.id}
            onUpdateField={(key, value) => {
              onUpdateConfigField(key, value);
            }}
          />
        </div>
      </div>
    </InspectorSettingsSectionFrame>
  );
}
