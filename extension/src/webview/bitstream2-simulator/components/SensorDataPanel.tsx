import { useMemo } from "react";
import type { Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";
import { TRNHintText } from "../../ui/TRN";
import { TRNSectionContainer } from "../../ui/TRN/TRNSectionContainer";
import type { Bitstream2SimulatorFeed } from "../hooks/useBitstream2SimulatorFeed";
import { formatSensorSample, sensorIdLabel } from "../lib/formatSensorSample";
import { isAppliedSensorStreaming } from "../lib/sensorCfgDraft";

type Props = Pick<Bitstream2SimulatorFeed, "samplesBySensor" | "sampleHistory" | "simState">;

function StreamStatusChip({ streaming }: { streaming: boolean }) {
  if (streaming) {
    return (
      <span className="shrink-0 rounded-full border border-emerald-600/45 bg-emerald-950/45 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
        Streaming
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-zinc-600/50 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
      Inactive
    </span>
  );
}

function SensorLiveCard({
  sample,
  simCount,
  streaming,
}: {
  sample: Bitstream2SensorSamplePayload;
  simCount: number | undefined;
  streaming: boolean;
}) {
  const rows = formatSensorSample(sample);

  return (
    <article
      className={
        "min-w-0 rounded-lg border p-3 transition-colors " +
        (streaming
          ? "border-zinc-800 bg-zinc-950/60"
          : "border-dashed border-zinc-700/80 bg-zinc-950/30 opacity-75")
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className={
              "text-sm font-medium " + (streaming ? "text-zinc-100" : "text-zinc-400")
            }
          >
            {sensorIdLabel(sample.sensorId)}
          </h3>
          {!streaming ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Last sample — stream off (applied config)
            </p>
          ) : null}
        </div>
        <StreamStatusChip streaming={streaming} />
      </div>

      <p className="mt-1 font-mono text-xs text-zinc-500">
        {streaming ? "Live · " : "Held · "}
        counter {sample.counter}
        {simCount != null ? ` · sim total ${simCount}` : ""}
        {" · mask 0x"}
        {sample.mask.toString(16)}
        {" · tMs "}
        {sample.tMs}
      </p>

      {rows.length > 0 ? (
        <dl
          className={
            "mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-3 " +
            (streaming ? "" : "text-zinc-500")
          }
        >
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-zinc-500">{row.label}</dt>
              <dd className={"font-mono " + (streaming ? "text-zinc-200" : "text-zinc-400")}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 break-all font-mono text-xs text-zinc-400">
          [{sample.values.join(", ")}]
        </p>
      )}
    </article>
  );
}

export function SensorDataPanel(props: Props) {
  const latest = Object.values(props.samplesBySensor).sort((a, b) => a.sensorId - b.sensorId);

  const { streamingCount, inactiveCount } = useMemo(() => {
    let streaming = 0;
    let inactive = 0;
    for (const s of latest) {
      if (isAppliedSensorStreaming(s.sensorId, props.simState)) streaming += 1;
      else inactive += 1;
    }
    return { streamingCount: streaming, inactiveCount: inactive };
  }, [latest, props.simState]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <TRNSectionContainer title="Live sensors" glass glassPreset="soft">
        <div className="mb-3 space-y-1.5">
          <TRNHintText tone="info">
            Cards stay visible with the <strong className="font-medium text-zinc-300">last</strong> sample
            when a stream is off. Values do not update until you Apply cfg and re-enable streaming.
          </TRNHintText>
          {latest.length > 0 ? (
            <p className="text-[11px] text-zinc-500">
              <span className="text-emerald-400/90">{streamingCount} streaming</span>
              {" · "}
              <span className="text-zinc-400">{inactiveCount} inactive (held)</span>
            </p>
          ) : null}
        </div>

        {latest.length === 0 ? (
          <p className="text-sm text-zinc-500">Waiting for EVT_SENSOR…</p>
        ) : (
          <div className="space-y-3">
            {latest.map((sample) => (
              <SensorLiveCard
                key={sample.sensorId}
                sample={sample}
                simCount={props.simState?.sampleCountBySensorId[sample.sensorId]}
                streaming={isAppliedSensorStreaming(sample.sensorId, props.simState)}
              />
            ))}
          </div>
        )}
      </TRNSectionContainer>

      <TRNSectionContainer title="Sample history" glass glassPreset="soft">
        <TRNHintText className="mb-2">
          New rows appear only for sensors that are actively streaming.
        </TRNHintText>
        <div className="scrollbar-hide max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-900/95 text-zinc-500">
              <tr>
                <th className="py-1 pr-2">sensor</th>
                <th className="py-1 pr-2">state</th>
                <th className="py-1 pr-2">ctr</th>
                <th className="py-1 pr-2">mask</th>
                <th className="py-1">values</th>
              </tr>
            </thead>
            <tbody className="font-mono text-zinc-300">
              {props.sampleHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-zinc-500">
                    —
                  </td>
                </tr>
              ) : (
                props.sampleHistory.map((s, i) => {
                  const live = isAppliedSensorStreaming(s.sensorId, props.simState);
                  return (
                    <tr
                      key={`${s.sensorId}-${s.counter}-${i}`}
                      className={
                        "border-t border-zinc-800/80 " + (live ? "" : "text-zinc-500 opacity-60")
                      }
                    >
                      <td className="py-1 pr-2">{sensorIdLabel(s.sensorId)}</td>
                      <td className="py-1 pr-2">{live ? "live" : "held"}</td>
                      <td className="py-1 pr-2">{s.counter}</td>
                      <td className="py-1 pr-2">0x{s.mask.toString(16)}</td>
                      <td className="max-w-48 truncate py-1">
                        {s.values.slice(0, 6).join(", ")}…
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TRNSectionContainer>
    </div>
  );
}
