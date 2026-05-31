import { useFlowEditorStore } from "../store/flow-editor.store";
import { STUDIO_ROOT_GRAPH_ID } from "../subgraphs/studio-subgraph.types";

export function FlowGraphBreadcrumb() {
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const graphStack = useFlowEditorStore((s) => s.graphStack);
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const jumpToGraph = useFlowEditorStore((s) => s.jumpToGraph);

  if (activeGraphId === STUDIO_ROOT_GRAPH_ID && graphStack.length === 0) {
    return null;
  }

  const crumbs: { id: string; label: string }[] = [{ id: STUDIO_ROOT_GRAPH_ID, label: "Root" }];
  for (const id of graphStack) {
    if (id === STUDIO_ROOT_GRAPH_ID) {
      continue;
    }
    const title = subgraphs[id]?.graphTitle?.trim() || "Node Group";
    crumbs.push({ id, label: title });
  }
  if (activeGraphId !== STUDIO_ROOT_GRAPH_ID) {
    const activeTitle = subgraphs[activeGraphId]?.graphTitle?.trim() || "Node Group";
    if (crumbs[crumbs.length - 1]?.id !== activeGraphId) {
      crumbs.push({ id: activeGraphId, label: activeTitle });
    }
  }

  return (
    <nav aria-label="Graph navigation" className="studio-flow-graph-breadcrumb nodrag">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.id} className="inline-flex items-center gap-1">
            {index > 0 ? <span className="studio-flow-graph-breadcrumb__sep">›</span> : null}
            <button
              type="button"
              className={
                "studio-flow-graph-breadcrumb__link" +
                (isLast ? " studio-flow-graph-breadcrumb__link--active" : "")
              }
              disabled={isLast}
              onClick={() => {
                if (!isLast) {
                  jumpToGraph(crumb.id);
                }
              }}
            >
              {crumb.label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
