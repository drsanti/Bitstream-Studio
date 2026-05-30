import type { StudioNode } from "../../store/flow-editor.store";

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
  const hist = d.liveHistory ?? [];
  const histTail = hist.slice(-24);
  const nums = d.liveNumberByHandle;
  const vec3h = d.liveVector3ByHandle;
  const scope = d.liveScopeHistory;

  return (
    <div className="space-y-2 text-xs">
      <div className="rounded border border-emerald-800/45 bg-emerald-950/20 px-2 py-2">
        <div className="text-[11px] font-medium text-emerald-200/90">Primary output</div>
        <div className="mt-1 font-mono text-sm text-emerald-50/95">{formatScalar(d.liveValue)}</div>
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
          <span>updated {d.lastUpdatedAt ?? "—"}</span>
          {d.sensorHealth != null ? (
            <span className="rounded border border-zinc-600/60 px-1 py-px text-zinc-400">
              health {String(d.sensorHealth)}
            </span>
          ) : null}
          {d.sensorStreamMode === "live" ? (
            <span className="rounded border border-emerald-700/50 px-1 py-px text-emerald-300/80">
              stream live
            </span>
          ) : null}
        </div>
      </div>

      {d.sensorInvalidReason != null && d.sensorInvalidReason.length > 0 ? (
        <div className="rounded border border-rose-800/50 bg-rose-950/25 px-2 py-1.5 text-[11px] text-rose-100/90">
          <div className="font-semibold text-rose-200/95">Sensor</div>
          <div className="mt-0.5 leading-snug">{d.sensorInvalidReason}</div>
        </div>
      ) : null}

      {d.sensorInvalidByHandle != null && Object.keys(d.sensorInvalidByHandle).length > 0 ? (
        <div className="rounded border border-rose-800/45 bg-rose-950/20 px-2 py-1.5">
          <div className="text-[11px] font-semibold text-rose-200/95">Pin issues</div>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10px] text-rose-100/90">
            {Object.entries(d.sensorInvalidByHandle).map(([handle, msg]) => (
              <li key={handle}>
                <span className="font-mono text-zinc-300">{handle}</span>: {msg}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {histTail.length > 0 ? (
        <div className="rounded border border-zinc-700/70 bg-zinc-950/40 px-2 py-1.5">
          <div className="text-[11px] text-zinc-400">
            Recent history <span className="text-zinc-600">({hist.length} samples)</span>
          </div>
          <div className="mt-1 break-all font-mono text-[10px] leading-relaxed text-zinc-300">
            {histTail.map((v) => (Number.isFinite(v) ? v.toFixed(3) : String(v))).join(" · ")}
          </div>
        </div>
      ) : null}

      {nums != null && Object.keys(nums).length > 0 ? (
        <div className="rounded border border-zinc-700/70 bg-zinc-950/35 px-2 py-1.5">
          <div className="text-[11px] text-zinc-400">Numeric pins</div>
          <dl className="mt-1 space-y-0.5 font-mono text-[10px] text-zinc-200">
            {Object.entries(nums).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="shrink-0 text-zinc-500">{k}</dt>
                <dd className="min-w-0 truncate">{formatScalar(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {vec3h != null && Object.keys(vec3h).length > 0 ? (
        <div className="rounded border border-zinc-700/70 bg-zinc-950/35 px-2 py-1.5">
          <div className="text-[11px] text-zinc-400">Vector3 pins</div>
          <dl className="mt-1 space-y-0.5 font-mono text-[10px] text-zinc-200">
            {Object.entries(vec3h).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                <dt className="shrink-0 text-zinc-500">{k}</dt>
                <dd className="min-w-0 break-all">{formatVec3(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {d.liveVector3Wire != null ? (
        <div className="rounded border border-zinc-700/70 bg-zinc-950/35 px-2 py-1.5">
          <div className="text-[11px] text-zinc-400">Vector3 wire</div>
          <div className="mt-1 font-mono text-[10px] text-zinc-200">
            {formatVec3(d.liveVector3Wire)}
          </div>
        </div>
      ) : null}

      {d.liveQuaternionWire != null ? (
        <div className="rounded border border-zinc-700/70 bg-zinc-950/35 px-2 py-1.5">
          <div className="text-[11px] text-zinc-400">Quaternion wire</div>
          <div className="mt-1 break-all font-mono text-[10px] text-zinc-200">
            {formatQuat(d.liveQuaternionWire)}
          </div>
        </div>
      ) : null}

      {scope != null && Object.keys(scope).length > 0 ? (
        <div className="rounded border border-zinc-700/70 bg-zinc-950/35 px-2 py-1.5">
          <div className="text-[11px] text-zinc-400">Oscilloscope channels</div>
          <dl className="mt-1 space-y-1 font-mono text-[10px] text-zinc-200">
            {Object.entries(scope).map(([ch, series]) => {
              const last = series.length > 0 ? series[series.length - 1] : Number.NaN;
              return (
                <div key={ch} className="flex flex-col gap-0.5 border-b border-zinc-800/50 pb-1 last:border-0 last:pb-0">
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
        </div>
      ) : null}
    </div>
  );
}
