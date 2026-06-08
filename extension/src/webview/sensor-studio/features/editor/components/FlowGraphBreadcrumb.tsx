import { Box, ChevronRight, CornerUpLeft, Home } from "lucide-react";
import { TRNTooltip } from "../../../../ui/TRN";
import { useFlowEditorStore } from "../store/flow-editor.store";
import {
  resolveGroupBreadcrumbCrumb,
  type GroupBreadcrumbCrumb,
} from "../subgraphs/studio-group-breadcrumb-label";
import { STUDIO_ROOT_GRAPH_ID } from "../subgraphs/studio-subgraph.types";

function useFlowGraphBreadcrumbCrumbs(): GroupBreadcrumbCrumb[] | null {
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const graphStack = useFlowEditorStore((s) => s.graphStack);
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);

  if (activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    return null;
  }

  const crumbs: GroupBreadcrumbCrumb[] = [
    resolveGroupBreadcrumbCrumb(STUDIO_ROOT_GRAPH_ID, subgraphs),
  ];
  const seen = new Set<string>([STUDIO_ROOT_GRAPH_ID]);
  for (const id of graphStack) {
    if (id === STUDIO_ROOT_GRAPH_ID || seen.has(id)) {
      continue;
    }
    seen.add(id);
    crumbs.push(resolveGroupBreadcrumbCrumb(id, subgraphs));
  }
  if (activeGraphId !== STUDIO_ROOT_GRAPH_ID && !seen.has(activeGraphId)) {
    crumbs.push(resolveGroupBreadcrumbCrumb(activeGraphId, subgraphs));
  }

  return crumbs;
}

function BreadcrumbStep(props: {
  crumb: GroupBreadcrumbCrumb;
  isActive: boolean;
  onJump: () => void;
}) {
  const { crumb, isActive, onJump } = props;
  const Icon = crumb.isRoot ? Home : Box;
  const countHint =
    !crumb.isRoot && crumb.inputCount != null && crumb.outputCount != null
      ? ` · ${crumb.inputCount} in / ${crumb.outputCount} out`
      : "";

  const label = (
    <span className="studio-flow-graph-breadcrumb-pill__step-inner">
      <Icon className="studio-flow-graph-breadcrumb-pill__icon" aria-hidden />
      <span className="studio-flow-graph-breadcrumb-pill__label-text">{crumb.title}</span>
      {isActive && countHint.length > 0 ? (
        <span className="studio-flow-graph-breadcrumb-pill__meta">{countHint}</span>
      ) : null}
    </span>
  );

  if (isActive) {
    return (
      <span
        className="studio-flow-graph-breadcrumb-pill__step studio-flow-graph-breadcrumb-pill__step--active"
        aria-current="location"
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="studio-flow-graph-breadcrumb-pill__step studio-flow-graph-breadcrumb-pill__step--link"
      onClick={onJump}
    >
      {label}
    </button>
  );
}

/** Bottom-center flow canvas chrome — hidden on the root graph. */
export function FlowGraphBreadcrumbChrome() {
  const crumbs = useFlowGraphBreadcrumbCrumbs();
  const jumpToGraph = useFlowEditorStore((s) => s.jumpToGraph);
  const exitGroup = useFlowEditorStore((s) => s.exitGroup);

  if (crumbs == null || crumbs.length < 2) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
      <nav
        aria-label="Graph navigation"
        className="pointer-events-auto studio-flow-graph-breadcrumb-pill nodrag"
      >
        <TRNTooltip
          content="Exit one nested group (Shift+Tab)."
          triggerWrapper="span"
          trigger={
            <button
              type="button"
              className="studio-flow-graph-breadcrumb-pill__parent"
              onClick={() => {
                exitGroup();
              }}
            >
              <CornerUpLeft className="studio-flow-graph-breadcrumb-pill__icon" aria-hidden />
              <span className="sr-only">Parent graph</span>
            </button>
          }
        />

        <span className="studio-flow-graph-breadcrumb-pill__divider" aria-hidden />

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={crumb.id} className="inline-flex min-w-0 items-center">
              {index > 0 ? (
                <ChevronRight
                  className="studio-flow-graph-breadcrumb-pill__chevron"
                  aria-hidden
                />
              ) : null}
              <BreadcrumbStep
                crumb={crumb}
                isActive={isLast}
                onJump={() => {
                  jumpToGraph(crumb.id);
                }}
              />
            </span>
          );
        })}
      </nav>
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
              {crumb.isRoot
                ? crumb.title
                : `${crumb.title} (${crumb.inputCount} in / ${crumb.outputCount} out)`}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
