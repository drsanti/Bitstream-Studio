import type { StudioNode } from "../../store/flow-editor.store";
import {
  isStudioAlignedOutputSocketColumnsNodeId,
  isStudioLiveInspectorReadingsNodeId,
  isStudioSensorTapNodeId,
} from "../../store/flow-editor.store";
import { InspectorSection } from "./InspectorSection";
import { LiveSensorInspectorReadings } from "./LiveSensorInspectorReadings";

export type NodeInspectorLiveTabProps = {
  selectedNode: StudioNode;
};

function formatScalar(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v.toFixed(4);
  }
  if (v == null) {
    return "—";
  }
  return String(v);
}

function formatVec3(v: { x: number; y: number; z: number }): string {
  return `${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)}`;
}

function formatQuat(q: { x: number; y: number; z: number; w: number }): string {
  return `${q.x.toFixed(3)} ${q.y.toFixed(3)} ${q.z.toFixed(3)} ${q.w.toFixed(3)}`;
}

/**
 * Single-node inspector **Live** tab: simulation readouts, per-pin snapshots, and compact history.
 */
export function NodeInspectorLiveTab(props: NodeInspectorLiveTabProps) {
  const { selectedNode: n } = props;
  const d = n.data;
  const nodeId = d.nodeId;
  const hasDedicatedReadings = isStudioLiveInspectorReadingsNodeId(nodeId);
  const isMultiOutputSource = isStudioAlignedOutputSocketColumnsNodeId(nodeId);
  const isTap = isStudioSensorTapNodeId(nodeId);
  const hist = d.liveHistory ?? [];
  const histTail = hist.slice(-24);
  const nums = d.liveNumberByHandle;
  const vec3h = d.liveVector3ByHandle;
  const scope = d.liveScopeHistory;

  const hasSensorIssue =
    (d.sensorInvalidReason != null && d.sensorInvalidReason.length > 0) ||
    (d.sensorInvalidByHandle != null && Object.keys(d.sensorInvalidByHandle).length > 0);

  return (
    <div className="space-y-3 text-xs">
      {hasDedicatedReadings ? (
        <LiveSensorInspectorReadings selectedNode={n} />
      ) : (
        <InspectorSection title="Primary output">
          <div className="font-mono text-sm tabular-nums text-emerald-50/95">
            {formatScalar(d.liveValue)}
          </div>
        </InspectorSection>
      )}

      {hasSensorIssue ? (
        <InspectorSection title="Diagnostics" variant="error" defaultExpanded>
          {d.sensorInvalidReason != null && d.sensorInvalidReason.length > 0 ? (
            <p className="text-[11px] leading-snug text-rose-100/90">{d.sensorInvalidReason}</p>
          ) : null}
          {d.sensorInvalidByHandle != null && Object.keys(d.sensorInvalidByHandle).length > 0 ? (
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10px] text-rose-100/90">
              {Object.entries(d.sensorInvalidByHandle).map(([handle, msg]) => (
                <li key={handle}>
                  <span className="font-mono text-zinc-300">{handle}</span>: {msg}
                </li>
              ))}
            </ul>
          ) : null}
        </InspectorSection>
      ) : null}

      {histTail.length > 0 ? (
        <InspectorSection
          title="Recent history"
          hint={`${hist.length} samples · last ${histTail.length} shown`}
          collapsible
          defaultExpanded={false}
        >
          <div className="break-all font-mono text-[10px] leading-relaxed text-zinc-300">
            {histTail.map((v) => (Number.isFinite(v) ? v.toFixed(3) : String(v))).join(" · ")}
          </div>
        </InspectorSection>
      ) : null}

      {nums != null && Object.keys(nums).length > 0 && (!hasDedicatedReadings || !isMultiOutputSource) ? (
        <InspectorSection title="Numeric pins" collapsible defaultExpanded={false}>
          <dl className="space-y-0.5 font-mono text-[10px] text-zinc-200">
            {Object.entries(nums).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="shrink-0 text-zinc-500">{k}</dt>
                <dd className="min-w-0 truncate">{formatScalar(v)}</dd>
              </div>
            ))}
          </dl>
        </InspectorSection>
      ) : null}

      {vec3h != null && Object.keys(vec3h).length > 0 && (!hasDedicatedReadings || !isMultiOutputSource) ? (
        <InspectorSection title="Vector3 pins" collapsible defaultExpanded={false}>
          <dl className="space-y-0.5 font-mono text-[10px] text-zinc-200">
            {Object.entries(vec3h).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                <dt className="shrink-0 text-zinc-500">{k}</dt>
                <dd className="min-w-0 break-all">{formatVec3(v)}</dd>
              </div>
            ))}
          </dl>
        </InspectorSection>
      ) : null}

      {d.liveVector3Wire != null && (!hasDedicatedReadings || !isTap) ? (
        <InspectorSection title="Vector3 wire" collapsible defaultExpanded={false}>
          <div className="font-mono text-[10px] text-zinc-200">{formatVec3(d.liveVector3Wire)}</div>
        </InspectorSection>
      ) : null}

      {d.liveQuaternionWire != null &&
      (!hasDedicatedReadings ||
        (nodeId !== "bmi270-input" && nodeId !== "bmi270-tap-quaternion")) ? (
        <InspectorSection title="Quaternion wire" collapsible defaultExpanded={false}>
          <div className="break-all font-mono text-[10px] text-zinc-200">
            {formatQuat(d.liveQuaternionWire)}
          </div>
        </InspectorSection>
      ) : null}

      {scope != null && Object.keys(scope).length > 0 ? (
        <InspectorSection title="Oscilloscope channels" collapsible defaultExpanded={false}>
          <dl className="space-y-1 font-mono text-[10px] text-zinc-200">
            {Object.entries(scope).map(([ch, series]) => {
              const last = series.length > 0 ? series[series.length - 1] : Number.NaN;
              return (
                <div
                  key={ch}
                  className="flex flex-col gap-0.5 border-b border-zinc-800/50 pb-1 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between gap-2 text-zinc-500">
                    <span>{ch}</span>
                    <span>
                      last {Number.isFinite(last) ? last.toFixed(4) : "—"} · {series.length} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </dl>
        </InspectorSection>
      ) : null}
    </div>
  );
}
