import { SENSOR_TEST_IDS, SENSOR_TEST_LABEL, type SensorTestLastSample } from "../shared/sensorTestShared";
import type { Bs2SensorConfig } from "../../bitstream2/domains/config/sensor-config";

export type SensorHzMeterStripProps = {
  hzBySensorId: Record<number, number>;
  lastBySensorId: Record<number, SensorTestLastSample>;
  cfgBySensorId: Partial<Record<number, Bs2SensorConfig>>;
};

function targetHzLabel(cfg: Bs2SensorConfig | undefined): string {
  if (!cfg || !cfg.enabled) {
    return "disabled";
  }
  if (cfg.samplingIntervalMs > 0) {
    const hz = 1000 / cfg.samplingIntervalMs;
    return `~${hz.toFixed(1)} Hz`;
  }
  return "—";
}

function meterClass(hz: number, cfg: Bs2SensorConfig | undefined): string {
  if (!cfg?.enabled) {
    return "text-zinc-500";
  }
  if (hz <= 0.05) {
    return "text-zinc-500";
  }
  if (cfg.samplingIntervalMs > 0) {
    const target = 1000 / cfg.samplingIntervalMs;
    const ratio = hz / target;
    if (ratio >= 0.6) {
      return "text-emerald-400";
    }
    return "text-amber-400";
  }
  return "text-sky-300";
}

export function SensorHzMeterStrip(props: SensorHzMeterStripProps) {
  return (
    <div className="flex shrink-0 gap-2 border-t border-zinc-800 bg-zinc-900/80 p-3">
      {SENSOR_TEST_IDS.map((id) => {
        const hz = props.hzBySensorId[id] ?? 0;
        const last = props.lastBySensorId[id];
        const cfg = props.cfgBySensorId[id];
        const hzClass = meterClass(hz, cfg);
        return (
          <div
            key={id}
            className="min-w-[100px] flex-1 rounded-md border border-zinc-700/80 bg-zinc-950/60 px-3 py-2"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {SENSOR_TEST_LABEL[id]}
            </div>
            <div className={`font-mono text-2xl font-bold tabular-nums leading-tight ${hzClass}`}>
              {hz.toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-500">Hz · target {targetHzLabel(cfg)}</div>
            {last ? (
              <div className="mt-1 font-mono text-[10px] text-zinc-600">
                mask=0x{last.mask.toString(16)} len={last.valuesLen}
              </div>
            ) : (
              <div className="mt-1 text-[10px] text-zinc-600">no EVT yet</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
