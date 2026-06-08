const STEPS = [
  { label: "TESAIoT sensors", detail: "BMI270 · BMM350 · SHT40 · DPS368" },
  { label: "MCU firmware", detail: "BS2 EVT_SENSOR frames" },
  { label: "UART 921600", detail: "or Simulator inject-rx" },
  { label: "Serial bridge", detail: "ws://127.0.0.1:9998" },
  { label: "Webview clients", detail: "Telemetry · Studio · Presentation" },
];

export function DataPathDiagram() {
  return (
    <div className="flex max-w-5xl flex-wrap items-stretch gap-2">
      {STEPS.map((step, index) => (
        <div key={step.label} className="flex min-w-[7.5rem] flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3">
            <div className="text-sm font-bold text-[var(--text-primary)]">{step.label}</div>
            <div className="mt-1 text-2xs leading-relaxed text-[var(--text-muted)]">{step.detail}</div>
          </div>
          {index < STEPS.length - 1 ? (
            <span className="shrink-0 text-lg text-[var(--accent-cyan)]" aria-hidden>
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
