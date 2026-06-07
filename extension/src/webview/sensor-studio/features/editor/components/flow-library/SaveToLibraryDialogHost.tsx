import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { STUDIO_ROOT_GRAPH_ID } from "../../subgraphs/studio-subgraph.types";
import { resolveSaveToLibraryTarget } from "../../flow-library/resolve-save-to-library-target";
import { SaveToLibraryDialog } from "./SaveToLibraryDialog";

/** Global Save to library dialog — open via store or Ctrl+Shift+S. */
export function SaveToLibraryDialogHost() {
  const open = useFlowEditorStore((s) => s.saveToLibraryDialogOpen);
  const closeSaveToLibraryDialog = useFlowEditorStore((s) => s.closeSaveToLibraryDialog);
  const saveToLibrary = useFlowEditorStore((s) => s.saveToLibrary);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);

  const saveTarget = useMemo(() => resolveSaveToLibraryTarget(nodes), [nodes]);
  const scopeHint =
    activeGraphId === STUDIO_ROOT_GRAPH_ID ? "Root graph" : `Graph ${activeGraphId}`;

  return (
    <SaveToLibraryDialog
      open={open}
      target={saveTarget}
      scopeHint={scopeHint}
      onCancel={closeSaveToLibraryDialog}
      onConfirm={(args) => {
        saveToLibrary(args);
        closeSaveToLibraryDialog();
      }}
    />
  );
}
