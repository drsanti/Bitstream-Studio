import { useEffect, useRef } from "react";
import { DEFAULT_LINK_HEALTH_POLICY } from "../../schemas/linkHealth";
import type { DiagramNodeV1, DiagramV1 } from "../../schemas/diagram.v1";
import type { LinkHealthPolicy } from "../../schemas/linkHealth";
import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import { diagramFill, diagramStroke, diagramTextFill } from "./diagramTheme";
import { evaluateBindingGate, evaluateNumericProp, evaluateTextProp } from "./evaluateDiagramScene";
import {
  buildQuadraticConnectorPath,
  hasConnectorCurve,
} from "./diagramConnectorPath";
import {
  resolveDiagramRenderSnapshot,
} from "./diagramLinkHealth";
import { useCourseTelemetryLinkState } from "../useCourseTelemetryLinkState";
import { DIAGRAM_DESIGN_TIME_SNAPSHOT } from "./diagramDesignTimeSnapshot";

const ARROW_MARKER_ID = "course-diagram-arrowhead";

function ConnectorShape({
  node,
  globalFlowActive,
  snapshot,
}: {
  node: Extract<DiagramNodeV1, { type: "line" } | { type: "arrow" }>;
  globalFlowActive: boolean;
  snapshot: DiagramLiveSnapshot;
}) {
  const strokeToken =
    node.highlightWhen != null && evaluateBindingGate(node.highlightWhen, snapshot)
      ? (node.highlightStroke ?? "accent-cyan")
      : node.stroke;
  const stroke = diagramStroke(strokeToken);
  const strokeWidth = node.strokeWidth ?? 2;
  const flowGate =
    node.flowWhen != null
      ? evaluateBindingGate(node.flowWhen, snapshot)
      : node.type === "line" && node.strokeDasharray != null;
  const flowClass =
    globalFlowActive && flowGate ? "course-diagram-line--flow" : undefined;
  const highlightClass =
    node.highlightWhen != null && evaluateBindingGate(node.highlightWhen, snapshot)
      ? "course-diagram-line--highlight"
      : undefined;
  const markerEnd = node.type === "arrow" ? `url(#${ARROW_MARKER_ID})` : undefined;

  if (hasConnectorCurve(node)) {
    return (
      <path
        key={node.id}
        d={buildQuadraticConnectorPath(node, node.curve)}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={node.type === "line" ? node.strokeDasharray : undefined}
        markerEnd={markerEnd}
        className={[flowClass, highlightClass].filter(Boolean).join(" ") || undefined}
        opacity={node.opacity}
      />
    );
  }

  return (
    <line
      key={node.id}
      x1={node.x1}
      y1={node.y1}
      x2={node.x2}
      y2={node.y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={node.type === "line" ? node.strokeDasharray : undefined}
      markerEnd={markerEnd}
      className={[flowClass, highlightClass].filter(Boolean).join(" ") || undefined}
      opacity={node.opacity}
    />
  );
}

function DiagramNode({
  node,
  snapshot,
  globalFlowActive,
}: {
  node: DiagramNodeV1;
  snapshot: DiagramLiveSnapshot;
  globalFlowActive: boolean;
}) {
  if (node.visible === false) {
    return null;
  }

  const opacity = node.opacity;

  switch (node.type) {
    case "rect": {
      const x = evaluateNumericProp(node.x, snapshot);
      const y = evaluateNumericProp(node.y, snapshot);
      return (
        <g key={node.id} opacity={opacity}>
          <rect
            x={x}
            y={y}
            width={node.width}
            height={node.height}
            rx={node.rx ?? 0}
            fill={diagramFill(node.fill)}
            stroke={diagramStroke(node.stroke)}
            strokeWidth={node.strokeWidth ?? 1}
          />
          {node.label ? (
            <text
              x={x + node.width / 2}
              y={y + node.height / 2 + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={diagramTextFill(node.stroke ?? node.fill ?? "accent-amber")}
            >
              {node.label}
            </text>
          ) : null}
        </g>
      );
    }
    case "ellipse": {
      const cx = evaluateNumericProp(node.cx, snapshot);
      const cy = evaluateNumericProp(node.cy, snapshot);
      return (
        <ellipse
          key={node.id}
          cx={cx}
          cy={cy}
          rx={node.rx}
          ry={node.ry}
          fill={diagramFill(node.fill)}
          stroke={diagramStroke(node.stroke)}
          strokeWidth={node.strokeWidth ?? 1}
          opacity={opacity}
        />
      );
    }
    case "line":
      return <ConnectorShape node={node} globalFlowActive={globalFlowActive} snapshot={snapshot} />;
    case "arrow":
      return <ConnectorShape node={node} globalFlowActive={globalFlowActive} snapshot={snapshot} />;
    case "text":
      return (
        <text
          key={node.id}
          x={node.x}
          y={node.y}
          textAnchor={node.textAnchor ?? "start"}
          fontSize={node.fontSize ?? 10}
          fontWeight={node.fontWeight ?? 400}
          fill={diagramTextFill(node.fill)}
          opacity={opacity}
        >
          {evaluateTextProp(node.content, snapshot)}
        </text>
      );
    case "group":
      return (
        <g key={node.id} opacity={opacity}>
          {node.children.map((child: DiagramNodeV1) => (
            <DiagramNode key={child.id} node={child} snapshot={snapshot} globalFlowActive={globalFlowActive} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

export function CourseDiagramRenderer({
  diagram,
  pageLinkHealth,
  pageStaleMs,
  designTime = false,
}: {
  diagram: DiagramV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  /** Maintainer canvas — static binding fallbacks, no live telemetry offset. */
  designTime?: boolean;
}) {
  const live = useCourseTelemetryLinkState(pageStaleMs);
  const lastGoodRef = useRef<DiagramLiveSnapshot | null>(null);

  const currentSnapshot = designTime ? null : live.snapshot;
  const healthy = designTime ? false : live.healthy;
  const lastRxAtMs = designTime ? null : live.lastRxAtMs;
  const nowMs = designTime ? Date.now() : live.nowMs;

  useEffect(() => {
    if (designTime || !healthy) {
      return;
    }
    if (currentSnapshot != null) {
      lastGoodRef.current = currentSnapshot;
    }
  }, [currentSnapshot, designTime, healthy]);

  const policy = diagram.linkHealth ?? pageLinkHealth ?? DEFAULT_LINK_HEALTH_POLICY;
  const { snapshot, inactive, hidden } = designTime
    ? {
        snapshot: DIAGRAM_DESIGN_TIME_SNAPSHOT,
        inactive: false,
        hidden: false,
      }
    : resolveDiagramRenderSnapshot({
        current: currentSnapshot!,
        lastGood: lastGoodRef.current,
        policy,
        freshness: {
          nowMs,
          lastRxAtMs,
          staleMs: pageStaleMs,
        },
      });

  if (hidden) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center text-2xs text-[var(--text-muted)]">
        Diagram hidden — link unhealthy
      </div>
    );
  }

  const [minX, minY, width, height] = diagram.viewBox;
  const globalFlowActive = !inactive && healthy;

  return (
    <svg
      className={`course-diagram-svg presentation-diagram-svg h-full w-full ${
        inactive ? "course-diagram-svg--inactive" : ""
      }`}
      viewBox={`${minX} ${minY} ${width} ${height}`}
      role="img"
      aria-label={diagram.title ?? diagram.id}
      data-diagram-link={inactive ? "stale" : "live"}
    >
      <defs>
        <marker
          id={ARROW_MARKER_ID}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-muted)" />
        </marker>
      </defs>
      {diagram.nodes.map((node) => (
        <DiagramNode key={node.id} node={node} snapshot={snapshot} globalFlowActive={globalFlowActive} />
      ))}
    </svg>
  );
}
