import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { SlidePage } from "../../../../layout/SlidePage";
import { LiveBar } from "../../../../widgets/LiveBar";
import {
  BMI270_ACTIVITIES,
  classifyBmi270Activity,
  type Bmi270Activity,
} from "../../../../core/bmi270-activity-classifier";

export default function BmiDemoActivitySlide() {
  const frame = usePresentationBmi270();
  const magHistoryRef = useRef<number[]>([]);
  const [activity, setActivity] = useState<Bmi270Activity>("Unknown");
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    if (!frame.accValid) {
      return;
    }
    const result = classifyBmi270Activity(
      frame.ax,
      frame.ay,
      frame.az,
      frame.gx,
      frame.gy,
      frame.gz,
      magHistoryRef.current,
    );
    magHistoryRef.current = result.magHistory;
    setActivity(result.activity);
    setConfidence(result.confidence);
  }, [frame.ax, frame.ay, frame.az, frame.gx, frame.gy, frame.gz, frame.accValid]);

  const current = BMI270_ACTIVITIES.find((a) => a.label === activity);
  const accMag = Math.sqrt(frame.ax ** 2 + frame.ay ** 2 + frame.az ** 2);
  const omegaMag = Math.sqrt(frame.gx ** 2 + frame.gy ** 2 + frame.gz ** 2);

  return (
    <SlidePage
      layout="split-50"
      heading={{
        eyebrow: "Demo",
        title: "Activity classifier",
        subtitle: "Host-side thresholds on live accel + gyro — mirrors BMI270 on-chip motion features.",
        accent: "amber",
      }}
      footer={
        frame.hasSample
          ? `Classified: ${activity} — tilt, shake, or spin the board to change state`
          : "Connect telemetry — classifier needs live BMI270 samples"
      }
      main={
        <>
          <p
            className="shrink-0 rounded-lg border px-4 py-2 text-sm text-[var(--text-secondary)]"
            style={{
              borderColor: "color-mix(in srgb, var(--accent-amber) 30%, transparent)",
              background: "var(--accent-amber-bg)",
            }}
          >
            On-chip BMI270 exposes step/activity hardware — this demo teaches the same physics with simple
            magnitude rules.
          </p>
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
            {BMI270_ACTIVITIES.map((item) => {
              const isActive = item.label === activity;
              return (
                <div
                  key={item.label}
                  className={`flex flex-col gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                    isActive ? "scale-[1.02] shadow-lg" : "opacity-55"
                  }`}
                  style={{
                    background: isActive ? item.bg : "var(--surface-card)",
                    borderColor: isActive ? item.color : "transparent",
                  }}
                >
                  <div className="text-2xl" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="text-sm font-bold" style={{ color: isActive ? item.color : "var(--text-secondary)" }}>
                    {item.label}
                  </div>
                  <div className="text-2xs text-[var(--text-muted)]">{item.desc}</div>
                  {isActive ? (
                    <div className="mt-auto flex items-center gap-1">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface-border)]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${confidence * 100}%`, background: item.color }}
                        />
                      </div>
                      <span className="text-2xs" style={{ color: item.color }}>
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      }
      visual={
        <div className="flex h-full flex-col justify-center gap-6 px-2">
          <div className="flex items-center gap-2">
            <Zap size={18} strokeWidth={1.5} style={{ color: "var(--accent-amber)" }} />
            <span className="text-2xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Current activity
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{
                background: current?.bg ?? "var(--surface-card)",
                border: `2px solid ${current?.color ?? "var(--surface-border)"}`,
              }}
            >
              {current?.icon ?? "?"}
            </div>
            <span className="text-3xl font-extrabold" style={{ color: current?.color ?? "var(--text-primary)" }}>
              {activity}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <LiveBar label="|ACC|" value={accMag} min={0} max={4} color="var(--accent-cyan)" showValue unit="g" decimals={2} />
            <LiveBar label="|GYRO|" value={omegaMag} min={0} max={500} color="var(--accent-amber)" showValue unit="°/s" decimals={1} />
            <LiveBar label="aZ" value={frame.az} min={-2} max={2} color="var(--axis-z)" showValue unit="g" decimals={3} />
          </div>
        </div>
      }
    />
  );
}
