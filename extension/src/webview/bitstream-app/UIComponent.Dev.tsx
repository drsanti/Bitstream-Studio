import { Cog } from "lucide-react";

import { metricProgressPercent } from "./telemetry/telemetryFormat.js";

const DEMO_VALUE = 123.456;
const GAUGE_MIN = 0;
const GAUGE_MAX = 100;

export function UIComponentDev() {
  const progressPct = metricProgressPercent(DEMO_VALUE, GAUGE_MIN, GAUGE_MAX);

  return (
    <div className="w-[280px]">
      {/* 1st row */}
      <div className="flex w-full flex-row bg-blue-900/50">
        {/* Icon */}
        <div className="flex items-center min-w-0 shrink grow basis-0 text-left pl-2 border">
          <Cog className="size-4 shrink-0 opacity-80" aria-hidden />
        </div>

        {/* Name */}
        <div className="min-w-0 shrink grow-4 basis-0 border">Humidity</div>

        {/* Value */}
        <div className="min-w-0 shrink grow-5 basis-0 border pr-2 text-right ">
          {DEMO_VALUE}
        </div>

        {/* Unit */}
        <div className="flex flex-row items-center justify-end min-w-0 shrink grow-2 basis-0 text-right pr-2 text-sm  text-zinc-400 border">
          Unit
        </div>
      </div>

      {/* 2nd row */}
      <div className="flex w-full flex-row bg-blue-900/50">
        {/* min 1/5 */}
        <div className="flex flex-row items-center justify-end min-w-0 shrink grow basis-0 text-right box-content pr-1 text-sm  text-zinc-400 border">
          0
        </div>

        {/* Progressbar 3/5 */}
        <div className="flex flex-row min-h-0 min-w-0 shrink grow-3 basis-0 items-center border">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full border border-white/15 bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPct)}
          >
            <div
              className="h-full rounded-full bg-emerald-400/90"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* max 1/5 */}
        <div className="flex flex-row items-center justify-start min-w-0 shrink grow basis-0 text-left pl-1 text-sm  text-zinc-400 border">
          100
        </div>
      </div>
    </div>
  );
}
