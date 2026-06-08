import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { resolveSaveToLibraryDialogDefaults } from "../../flow-library/resolve-save-to-library-dialog-defaults";
import { SaveToLibraryDialog } from "./SaveToLibraryDialog";

/** Global Save to library dialog — open via store or Ctrl+Shift+S. */
export function SaveToLibraryDialogHost() {
  const open = useFlowEditorStore((s) => s.saveToLibraryDialogOpen);
  const closeSaveToLibraryDialog = useFlowEditorStore((s) => s.closeSaveToLibraryDialog);
  const saveToLibrary = useFlowEditorStore((s) => s.saveToLibrary);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const nodeGroupLibrary = useFlowEditorStore((s) => s.nodeGroupLibrary);
  const flowPresetLibrary = useFlowEditorStore((s) => s.flowPresetLibrary);

  const defaults = useMemo(
    () =>
      resolveSaveToLibraryDialogDefaults({
        nodes,
        activeGraphId,
        nodeGroupLibrary,
        flowPresetLibrary,
      }),
    [activeGraphId, flowPresetLibrary, nodeGroupLibrary, nodes],
  );

  return (
    <SaveToLibraryDialog
      open={open}
      target={defaults.target}
      scopeHint={defaults.scopeHint}
      defaultName={defaults.defaultName}
      defaultFlowCategory={defaults.defaultFlowCategory}
      defaultGroupCategory={defaults.defaultGroupCategory}
      defaultDescription={defaults.defaultDescription}
      linkedPresetName={defaults.linkedPresetName}
      onCancel={closeSaveToLibraryDialog}
      onConfirm={(args) => {
        saveToLibrary(args);
        closeSaveToLibraryDialog();
      }}
    />
  );
}
