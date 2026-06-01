import { useFlowEditorStore } from "../store/flow-editor.store";
import { STUDIO_ROOT_GRAPH_ID } from "../subgraphs/studio-subgraph.types";

function useFlowGraphBreadcrumbCrumbs(): { id: string; label: string }[] | null {
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const graphStack = useFlowEditorStore((s) => s.graphStack);
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);

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

  return crumbs;
}

/** Top-left flow canvas chrome — hidden on the root graph with no nested groups. */
export function FlowGraphBreadcrumbChrome() {
  const crumbs = useFlowGraphBreadcrumbCrumbs();
  const jumpToGraph = useFlowEditorStore((s) => s.jumpToGraph);

  if (crumbs == null) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20">
      <div className="pointer-events-auto rounded border border-zinc-700/70 bg-zinc-950/80 px-2 py-1 backdrop-blur-sm">
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
      </div>
    </div>
  );
}

/** @deprecated Use {@link FlowGraphBreadcrumbChrome}. */
export function FlowGraphBreadcrumb() {
  const crumbs = useFlowGraphBreadcrumbCrumbs();
  const jumpToGraph = useFlowEditorStore((s) => s.jumpToGraph);

  if (crumbs == null) {
    return null;
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
