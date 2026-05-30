/*******************************************************************************
 * File Name : Bs2SmokePanel.tsx
 *
 * Description : BS2 smoke — HELLO, metrics, last EVT_SENSOR, PING (Phase 3).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useMemo, useRef, useState } from "react";
import { Ruler } from "lucide-react";
import { TRNButton, TRNRangeSlider, TRNWindow } from "../../../ui/TRN";
import { useLabBs2Smoke } from "../../hooks/useLabBs2Smoke";
import { formatLabLastSensorLine } from "../../lib/labSensorNames";
import { useLabWorkbenchShell } from "../../workbench/lab-workbench-context";
import { formatSensorSample } from "../../../bitstream2-simulator/lib/formatSensorSample";
import { BITSTREAM2_TOPICS, type Bitstream2DevSimWaveSetPayload } from "../../../../bitstream2/bridge/protocol";
import { useWsClientStore } from "../../../ws-client-store";

function formatHelloAge(ageMs: number | null): string {
  if (ageMs == null)
  {
    return "—";
  }
  if (ageMs < 1000)
  {
    return `${ageMs} ms`;
  }
  return `${(ageMs / 1000).toFixed(1)} s`;
}

export function Bs2SmokePanel() {
  const { session, health } = useLabWorkbenchShell();
  const smoke = useLabBs2Smoke({ wsConnected: session.isConnected });
  const [unitMode, setUnitMode] = useState<"engineering" | "human">("engineering");
  const publish = useWsClientStore((s) => s.publish);

  type Wave3 = Bitstream2DevSimWaveSetPayload["waves"];
  type WaveEditorState = {
    sensorId: number;
    channelKey: string;
    title: string;
    maxHz: number;
    draft: Wave3;
  } | null;

  const [wavesByKey, setWavesByKey] = useState<Record<string, Wave3>>({});
  const [editor, setEditor] = useState<WaveEditorState>(null);
  const autoApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const waveKeyToId = (sensorId: number, channelKey: string) => `${sensorId}:${channelKey}`;

  const defaultWaves = (maxHz: number): Wave3 => [
    { freqHz: Math.min(0.2, maxHz), amp: 1 },
    { freqHz: 0, amp: 0 },
    { freqHz: 0, amp: 0 },
  ];

  const formatSigned = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

  const groupValue = (rows: Array<{ label: string; value: string }>, label: string): string | null => {
    const hit = rows.find((r) => r.label === label);
    return hit ? hit.value : null;
  };

  const formatScaled = (v: string | null, scale = 1, digits = 2): string => {
    if (v == null) return "—";
    const n = Number(v);
    if (!Number.isFinite(n)) return v;
    const nn = n * scale;
    const s = Math.abs(nn).toFixed(digits);
    return nn >= 0 ? `+${s}` : `-${s}`;
  };

  const AxisBadge = (props: { axis: string; tone: "x" | "y" | "z" | "w" | "other" }) => {
    const { axis, tone } = props;
    const toneClass =
      tone === "x"
        ? "bg-red-500/15 text-red-300"
        : tone === "y"
          ? "bg-emerald-500/15 text-emerald-300"
          : tone === "z"
            ? "bg-sky-500/15 text-sky-300"
            : tone === "w"
              ? "bg-violet-500/15 text-violet-300"
              : "bg-orange-500/15 text-orange-300";
    return (
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold leading-none ${toneClass}`}
      >
        {axis}
      </span>
    );
  };

  const AxisPill = (props: {
    axis: string;
    tone: "x" | "y" | "z" | "w" | "other";
    value: string | null;
    scale?: number;
    digits?: number;
    onEdit?: () => void;
  }) => (
    <span
      className={`inline-flex h-5 overflow-hidden rounded border border-zinc-800/70 bg-black/20 ${
        props.onEdit ? "cursor-pointer hover:border-zinc-700/70" : ""
      }`}
      role={props.onEdit ? "button" : undefined}
      tabIndex={props.onEdit ? 0 : undefined}
      onPointerDown={(e) => {
        if (!props.onEdit) return;
        e.stopPropagation();
      }}
      onClick={(e) => {
        if (!props.onEdit) return;
        e.preventDefault();
        e.stopPropagation();
        props.onEdit();
      }}
      onKeyDown={(e) => {
        if (!props.onEdit) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        props.onEdit();
      }}
      title={props.onEdit ? "Edit waveform" : undefined}
    >
      <span className={`flex items-center pr-1 ${props.axis === "W" ? "pl-0.5" : ""}`}>
        <AxisBadge axis={props.axis} tone={props.tone} />
      </span>
      <span className="inline-flex w-20 items-center justify-end px-2 font-mono text-[11px] tabular-nums text-zinc-100">
        {formatScaled(props.value, props.scale, props.digits)}
      </span>
    </span>
  );

  const VectorRow = (props: {
    name: string;
    unitHint?: string;
    scale?: number;
    digits?: number;
    axes: Array<{
      axis: string;
      tone: "x" | "y" | "z" | "w" | "other";
      value: string | null;
      onEdit?: () => void;
    }>;
  }) => {
    const { name, unitHint, scale, digits, axes } = props;
    const hasAny = axes.some((a) => a.value != null);
    if (!hasAny) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-20 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {name}
          {unitHint ? <span className="ml-1 font-normal text-zinc-600">({unitHint})</span> : null}
        </span>
        {axes.map((a) => (
          <AxisPill
            key={a.axis}
            axis={a.axis}
            tone={a.tone}
            value={a.value}
            scale={scale}
            digits={digits}
            onEdit={a.onEdit}
          />
        ))}
      </div>
    );
  };

  const ScalarsRow = (props: { temp: string | null; rh: string | null; pressure: string | null }) => {
    const { temp, rh, pressure } = props;
    if (temp == null && rh == null && pressure == null) return null;
    return (
      <div className="flex flex-wrap items-center gap-3">
        {temp != null ? (
          <div className="flex items-center gap-1.5">
            <span className="w-20 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Temp
            </span>
            <AxisPill axis="T" tone="other" value={temp} scale={1} digits={2} />
          </div>
        ) : null}
        {rh != null ? (
          <div className="flex items-center gap-1.5">
            <span className="w-20 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              RH
            </span>
            <AxisPill axis="H" tone="other" value={rh} scale={1} digits={2} />
          </div>
        ) : null}
        {pressure != null ? (
          <div className="flex items-center gap-1.5">
            <span className="w-20 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Pressure
            </span>
            <AxisPill axis="P" tone="other" value={pressure} scale={1} digits={2} />
          </div>
        ) : null}
      </div>
    );
  };

  const openEditor = useCallback(
    (sensorId: number, channelKey: string, title: string) => {
      const maxHz = Math.max(1, Math.round(smoke.fpsBySensor[sensorId] ?? 50));
      const id = waveKeyToId(sensorId, channelKey);
      const current = wavesByKey[id] ?? defaultWaves(maxHz);
      setEditor({ sensorId, channelKey, title, maxHz, draft: current });
    },
    [smoke.fpsBySensor, wavesByKey],
  );

  const updateEditorWave = useCallback(
    (idx: 0 | 1 | 2, patch: Partial<{ freqHz: number; amp: number }>) => {
      setEditor((prev) => {
        if (!prev) return prev;
        const next: Wave3 = [
          { ...prev.draft[0] },
          { ...prev.draft[1] },
          { ...prev.draft[2] },
        ];
        next[idx] = { ...next[idx], ...patch };
        const id = waveKeyToId(prev.sensorId, prev.channelKey);
        setWavesByKey((storePrev) => ({ ...storePrev, [id]: next }));

        if (autoApplyTimerRef.current) {
          clearTimeout(autoApplyTimerRef.current);
        }
        autoApplyTimerRef.current = setTimeout(() => {
          const clampHz = (hz: number) => Math.max(0, Math.min(prev.maxHz, hz));
          const clampAmp = (a: number) => Math.max(0, Math.min(1, a));
          const draft: Wave3 = [
            { freqHz: clampHz(next[0].freqHz), amp: clampAmp(next[0].amp) },
            { freqHz: clampHz(next[1].freqHz), amp: clampAmp(next[1].amp) },
            { freqHz: clampHz(next[2].freqHz), amp: clampAmp(next[2].amp) },
          ];
          void publish(
            BITSTREAM2_TOPICS.DEV_SIM_WAVE_SET,
            {
              sensorId: prev.sensorId,
              channelKey: prev.channelKey,
              waves: draft,
              atMs: Date.now(),
            } satisfies Bitstream2DevSimWaveSetPayload,
            0,
          );
        }, 120);
        return { ...prev, draft: next };
      });
    },
    [],
  );

  const closeEditor = useCallback(() => {
    setEditor((prev) => {
      if (!prev) {
        return null;
      }
      if (autoApplyTimerRef.current) {
        clearTimeout(autoApplyTimerRef.current);
        autoApplyTimerRef.current = null;
      }
      const clampHz = (hz: number) => Math.max(0, Math.min(prev.maxHz, hz));
      const clampAmp = (a: number) => Math.max(0, Math.min(1, a));
      const draft: Wave3 = [
        { freqHz: clampHz(prev.draft[0].freqHz), amp: clampAmp(prev.draft[0].amp) },
        { freqHz: clampHz(prev.draft[1].freqHz), amp: clampAmp(prev.draft[1].amp) },
        { freqHz: clampHz(prev.draft[2].freqHz), amp: clampAmp(prev.draft[2].amp) },
      ];
      void publish(
        BITSTREAM2_TOPICS.DEV_SIM_WAVE_SET,
        {
          sensorId: prev.sensorId,
          channelKey: prev.channelKey,
          waves: draft,
          atMs: Date.now(),
        } satisfies Bitstream2DevSimWaveSetPayload,
        0,
      );
      return null;
    });
  }, [publish]);

  const preview = useMemo(() => {
    if (!editor) return null;
    const waves = editor.draft;
    const amps = waves.map((w) => Math.max(0, Math.min(1, Number(w.amp ?? 0))));
    const freqs = waves.map((w) => Math.max(0, Math.min(editor.maxHz, Number(w.freqHz ?? 0))));
    const sumAmp = Math.max(1e-6, amps[0]! + amps[1]! + amps[2]!);
    const phaseOffsets = [0, 1.3, 2.6];
    const durationSec = 2.0;
    const points = 220;
    const samples: number[] = [];
    let peak = 0;
    let sumSq = 0;
    for (let i = 0; i < points; i++) {
      const t = (i / (points - 1)) * durationSec;
      const s =
        amps[0]! * Math.sin(2 * Math.PI * freqs[0]! * t + phaseOffsets[0]!) +
        amps[1]! * Math.sin(2 * Math.PI * freqs[1]! * t + phaseOffsets[1]!) +
        amps[2]! * Math.sin(2 * Math.PI * freqs[2]! * t + phaseOffsets[2]!);
      const n = s / sumAmp; // normalized
      samples.push(n);
      peak = Math.max(peak, Math.abs(n));
      sumSq += n * n;
    }
    const rms = Math.sqrt(sumSq / points);
    return { samples, peak, rms, durationSec };
  }, [editor]);

  const previewPath = useMemo(() => {
    if (!preview) return "";
    const w = 860;
    const h = 120;
    const padX = 8;
    const padY = 10;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const midY = padY + innerH / 2;
    const scaleY = innerH / 2;
    const pts = preview.samples;
    let d = "";
    for (let i = 0; i < pts.length; i++) {
      const x = padX + (i / (pts.length - 1)) * innerW;
      const y = midY - pts[i]! * scaleY;
      d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d;
  }, [preview]);

  const onPing = useCallback(async () => {
    try
    {
      await smoke.sendPing();
    }
    catch
    {
      /* activity log */
    }
  }, [smoke]);

  const onPrimeHello = useCallback(async () => {
    try
    {
      await smoke.primeHello();
    }
    catch
    {
      /* activity log */
    }
  }, [smoke]);

  const hello = smoke.hello;
  const metrics = smoke.metrics;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto scrollbar-hide p-2 text-[11px]">
      <section className="space-y-1 rounded border border-zinc-800 bg-zinc-900/40 p-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">HELLO</h3>
        {hello ? (
          <ul className="space-y-0.5 font-mono text-zinc-300">
            <li>
              version <span className="text-zinc-100">{hello.version}</span> · caps{" "}
              <span className="text-zinc-100">0x{hello.caps.toString(16)}</span> · age{" "}
              <span className={health.bs2Linked ? "text-emerald-400" : "text-amber-400"}>
                {formatHelloAge(smoke.helloAgeMs)}
              </span>
            </li>
            <li>
              MTU sensor/ctrl{" "}
              <span className="text-zinc-100">
                {hello.mtuSensor}/{hello.mtuCtrl}
              </span>
              {hello.fwTag ? (
                <>
                  {" "}
                  · fw <span className="text-cyan-400/90">{hello.fwTag}</span>
                </>
              ) : null}
            </li>
          </ul>
        ) : (
          <p className="text-zinc-600">No HELLO yet — open COM or run Prime HELLO.</p>
        )}
      </section>

      <section className="space-y-1 rounded border border-zinc-800 bg-zinc-900/40 p-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Metrics</h3>
        {metrics ? (
          <ul className="space-y-0.5 font-mono text-zinc-300">
            <li>
              frames OK <span className="text-emerald-400/90">{metrics.framesOk}</span> · CRC fail{" "}
              <span className={metrics.framesCrcFail > 0 ? "text-amber-400" : "text-zinc-400"}>
                {metrics.framesCrcFail}
              </span>
            </li>
            <li>
              UART in <span className="text-zinc-100">{metrics.uartBytesIn.toLocaleString()}</span> B ·
              resync skips {metrics.resyncByteSkips}
            </li>
          </ul>
        ) : (
          <p className="text-zinc-600">Waiting for bitstream2/metrics…</p>
        )}
      </section>

      <section className="space-y-1 rounded border border-zinc-800 bg-zinc-900/40 p-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Last evt/sensor
        </h3>
        {Object.keys(smoke.lastSamplesBySensor).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(smoke.lastSamplesBySensor)
              .map(([sensorId, sample]) => ({ sensorId: Number(sensorId), sample }))
              .sort((a, b) => a.sensorId - b.sensorId)
              .map(({ sensorId, sample }) => {
                const name = formatLabLastSensorLine(sample).split(" mask=")[0];
                return (
                  <div key={sensorId} className="rounded border border-zinc-800/70 bg-black/20 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-zinc-100">{name}</span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        mask=0x{sample.mask.toString(16)} cnt={sample.counter}{" "}
                        {smoke.fpsBySensor[sensorId] != null ? `fps=${smoke.fpsBySensor[sensorId].toFixed(1)}` : ""}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-zinc-300">
                      {sample.values.length > 0 ? (
                        sample.values.map((v, idx) => (
                          <span
                            key={idx}
                            className="inline-flex w-12 justify-end rounded border border-zinc-800 bg-zinc-950/40 px-1.5 py-0.5 text-right tabular-nums"
                            title={`idx=${idx}`}
                          >
                            {formatSigned(v)}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-zinc-600">No EVT_SENSOR yet.</p>
        )}
      </section>

      <section className="space-y-1 rounded border border-zinc-800 bg-zinc-900/40 p-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Sensing values</h3>
          <div className="flex items-center gap-2">
            <TRNButton
              type="button"
              size="compact"
              selected={unitMode === "human"}
              prefixIcon={<Ruler size={14} />}
              onClick={() => setUnitMode((m) => (m === "engineering" ? "human" : "engineering"))}
            >
              {unitMode === "engineering" ? "mg/mdps" : "g/dps"}
            </TRNButton>
            <TRNButton
              type="button"
              size="compact"
              onClick={() => {
                const s0 = smoke.lastSamplesBySensor[0];
                if (!s0) return;
                openEditor(0, "bmi270.acc.x", "BMI270 · ACC X");
              }}
              title="Debug: open wave editor"
            >
              Wave editor
            </TRNButton>
          </div>
        </div>
        {editor ? (
          <div className="text-[10px] text-zinc-600">
            editor: <span className="font-mono text-zinc-400">{editor.channelKey}</span>
          </div>
        ) : null}
        {Object.keys(smoke.lastSamplesBySensor).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(smoke.lastSamplesBySensor)
              .map(([sensorId, sample]) => ({ sensorId: Number(sensorId), sample }))
              .sort((a, b) => a.sensorId - b.sensorId)
              .map(({ sensorId, sample }) => {
                const rows = formatSensorSample(sample);
                const acc = {
                  x: groupValue(rows, "ACC X"),
                  y: groupValue(rows, "ACC Y"),
                  z: groupValue(rows, "ACC Z"),
                };
                const gyr = {
                  x: groupValue(rows, "GYR X"),
                  y: groupValue(rows, "GYR Y"),
                  z: groupValue(rows, "GYR Z"),
                };
                const mag = {
                  x: groupValue(rows, "Mag X"),
                  y: groupValue(rows, "Mag Y"),
                  z: groupValue(rows, "Mag Z"),
                };
                const eul = {
                  h: groupValue(rows, "Heading"),
                  p: groupValue(rows, "Pitch"),
                  r: groupValue(rows, "Roll"),
                };
                const quat = {
                  w: groupValue(rows, "Quat W"),
                  x: groupValue(rows, "Quat X"),
                  y: groupValue(rows, "Quat Y"),
                  z: groupValue(rows, "Quat Z"),
                };
                const temp = groupValue(rows, "Temp");
                const rh = groupValue(rows, "RH");
                const pressure = groupValue(rows, "Pressure");

                const hasStructured =
                  acc.x != null ||
                  gyr.x != null ||
                  mag.x != null ||
                  eul.h != null ||
                  quat.w != null ||
                  temp != null ||
                  rh != null ||
                  pressure != null;

                const title = formatLabLastSensorLine(sample).split(" mask=")[0];

                return (
                  <div
                    key={sensorId}
                    className="rounded border border-zinc-800/70 bg-linear-to-b from-zinc-950/30 to-black/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12px] font-semibold tracking-wide text-zinc-100">{title}</span>
                        <span className="rounded border border-zinc-800/60 bg-black/20 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                          id={sensorId}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-500">
                        <span>mask=0x{sample.mask.toString(16)}</span>
                        <span>cnt={sample.counter}</span>
                        {smoke.fpsBySensor[sensorId] != null ? <span>fps={smoke.fpsBySensor[sensorId].toFixed(1)}</span> : null}
                      </div>
                    </div>

                    <div className="mt-2">
                      {hasStructured ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <VectorRow
                              name="ACC"
                              unitHint={unitMode === "engineering" ? "mg" : "g"}
                              scale={unitMode === "engineering" ? 1 : 0.001}
                              digits={unitMode === "engineering" ? 0 : 3}
                              axes={[
                                { axis: "X", tone: "x", value: acc.x, onEdit: () => openEditor(sensorId, "bmi270.acc.x", `${title} · ACC X`) },
                                { axis: "Y", tone: "y", value: acc.y, onEdit: () => openEditor(sensorId, "bmi270.acc.y", `${title} · ACC Y`) },
                                { axis: "Z", tone: "z", value: acc.z, onEdit: () => openEditor(sensorId, "bmi270.acc.z", `${title} · ACC Z`) },
                              ]}
                            />
                            <VectorRow
                              name="GYR"
                              unitHint={unitMode === "engineering" ? "mdps" : "dps"}
                              scale={unitMode === "engineering" ? 1 : 0.001}
                              digits={unitMode === "engineering" ? 0 : 2}
                              axes={[
                                { axis: "X", tone: "x", value: gyr.x, onEdit: () => openEditor(sensorId, "bmi270.gyr.x", `${title} · GYR X`) },
                                { axis: "Y", tone: "y", value: gyr.y, onEdit: () => openEditor(sensorId, "bmi270.gyr.y", `${title} · GYR Y`) },
                                { axis: "Z", tone: "z", value: gyr.z, onEdit: () => openEditor(sensorId, "bmi270.gyr.z", `${title} · GYR Z`) },
                              ]}
                            />
                            <VectorRow
                              name="MAG"
                              unitHint="µT"
                              scale={1}
                              digits={2}
                              axes={[
                                { axis: "X", tone: "x", value: mag.x, onEdit: () => openEditor(sensorId, "bmm350.mag.x", `${title} · MAG X`) },
                                { axis: "Y", tone: "y", value: mag.y, onEdit: () => openEditor(sensorId, "bmm350.mag.y", `${title} · MAG Y`) },
                                { axis: "Z", tone: "z", value: mag.z, onEdit: () => openEditor(sensorId, "bmm350.mag.z", `${title} · MAG Z`) },
                              ]}
                            />
                            <VectorRow
                              name="EUL"
                              unitHint="deg"
                              scale={1}
                              digits={2}
                              axes={[
                                { axis: "H", tone: "x", value: eul.h, onEdit: () => openEditor(sensorId, "bmi270.euler.h", `${title} · EUL H`) },
                                { axis: "P", tone: "y", value: eul.p, onEdit: () => openEditor(sensorId, "bmi270.euler.p", `${title} · EUL P`) },
                                { axis: "R", tone: "z", value: eul.r, onEdit: () => openEditor(sensorId, "bmi270.euler.r", `${title} · EUL R`) },
                              ]}
                            />
                            <VectorRow
                              name="QUAT"
                              scale={1}
                              digits={4}
                              axes={[
                                { axis: "W", tone: "w", value: quat.w, onEdit: () => openEditor(sensorId, "bmi270.quat.w", `${title} · QUAT W`) },
                                { axis: "X", tone: "x", value: quat.x, onEdit: () => openEditor(sensorId, "bmi270.quat.x", `${title} · QUAT X`) },
                                { axis: "Y", tone: "y", value: quat.y, onEdit: () => openEditor(sensorId, "bmi270.quat.y", `${title} · QUAT Y`) },
                                { axis: "Z", tone: "z", value: quat.z, onEdit: () => openEditor(sensorId, "bmi270.quat.z", `${title} · QUAT Z`) },
                              ]}
                            />
                          </div>

                          {(temp != null || rh != null || pressure != null) ? (
                            <ScalarsRow temp={temp} rh={rh} pressure={pressure} />
                          ) : null}
                        </div>
                      ) : (
                        <div className="rounded border border-zinc-800/60 bg-black/10 p-2 font-mono text-[10px] text-zinc-300">
                          raw: {sample.values.map((v) => formatSigned(v)).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-zinc-600">No decoded samples yet.</p>
        )}
      </section>

      {editor ? (
        <TRNWindow
          title={editor.title}
          onClose={closeEditor}
          modalBackdropCloses={false}
          footer={
            <div className="flex items-center justify-end gap-2">
              <TRNButton type="button" size="compact" selected onClick={closeEditor}>
                Close
              </TRNButton>
            </div>
          }
        >
          <div className="space-y-2 text-[11px]">
            <div className="text-zinc-500">
              Each wave: freqHz (0..{editor.maxHz}), amp (0..1). Three sines are summed then normalized.
            </div>

            {preview ? (
              <div className="space-y-1 rounded border border-zinc-800 bg-black/20 p-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Preview (normalized, {preview.durationSec.toFixed(1)}s)
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500">
                    peak={preview.peak.toFixed(2)} · rms={preview.rms.toFixed(2)}
                  </div>
                </div>
                <svg
                  viewBox="0 0 860 120"
                  className="h-28 w-full overflow-hidden rounded bg-zinc-950/30"
                  role="img"
                  aria-label="Waveform preview"
                >
                  <path d="M 8 60 L 852 60" stroke="rgba(161,161,170,0.25)" strokeWidth="1" fill="none" />
                  <path d={previewPath} stroke="rgba(34,211,238,0.95)" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            ) : null}

            {([0, 1, 2] as const).map((i) => (
              <div
                key={i}
                className="space-y-2 rounded border border-zinc-800 bg-black/20 p-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Wave {i + 1}</div>
                  <div className="font-mono text-[10px] text-zinc-500">
                    f={editor.draft[i].freqHz.toFixed(2)} Hz · a={editor.draft[i].amp.toFixed(2)}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Freq (Hz)</div>
                    <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                      {editor.draft[i].freqHz.toFixed(2)} Hz
                    </span>
                  </div>
                  <TRNRangeSlider
                    value={editor.draft[i].freqHz}
                    min={0}
                    max={editor.maxHz}
                    step={0.05}
                    onChange={(e) => updateEditorWave(i, { freqHz: Number(e.currentTarget.value) })}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Amp</div>
                    <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                      {editor.draft[i].amp.toFixed(2)}
                    </span>
                  </div>
                  <TRNRangeSlider
                    value={editor.draft[i].amp}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(e) => updateEditorWave(i, { amp: Number(e.currentTarget.value) })}
                  />
                </div>
              </div>
            ))}
          </div>
        </TRNWindow>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <TRNButton
          type="button"
          size="compact"
          selected
          disabled={smoke.busy || !session.isConnected}
          onClick={() => void onPing()}
        >
          Ping
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          disabled={smoke.busy || !session.isConnected || !health.serialOpen}
          onClick={() => void onPrimeHello()}
        >
          Prime HELLO
        </TRNButton>
        {smoke.lastPing ? (
          <span
            className={`font-mono text-[10px] ${smoke.lastPing.ok ? "text-emerald-400/90" : "text-red-400/90"}`}
          >
            last RES: {smoke.lastPing.ok ? "OK" : "FAIL"} status={smoke.lastPing.status}{" "}
            {smoke.lastPing.rttMs} ms
            {smoke.lastPing.error ? ` — ${smoke.lastPing.error}` : ""}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-600">No PING yet</span>
        )}
      </div>
      {!session.isConnected ? (
        <p className="text-amber-400/90">Connect WebSocket to use BS2 smoke.</p>
      ) : null}
    </div>
  );
}
