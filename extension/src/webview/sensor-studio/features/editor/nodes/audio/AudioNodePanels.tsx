import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { studioAudioRuntime } from "../../../../core/audio/studio-audio-runtime";
import { resolveAudioSinkSourceNodeId } from "../../../../core/audio/resolve-audio-monitor-source";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { TRNSelect, TRNScrubNumberInput, type TRNSelectOption } from "../../../../../ui/TRN";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { InspectorTextField } from "../../components/inspector/InspectorNumericScrubRow";

function readBool(dc: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = dc[key];
  return typeof v === "boolean" ? v : fallback;
}

function readString(dc: Record<string, unknown>, key: string, fallback: string): string {
  const v = dc[key];
  return typeof v === "string" ? v : fallback;
}

export function MicInputNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", false);
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const [ui, setUi] = useState(() => studioAudioRuntime.getMicUiState(nodeId));

  useEffect(() => {
    const t = window.setInterval(() => {
      setUi(studioAudioRuntime.getMicUiState(nodeId));
    }, 250);
    return () => window.clearInterval(t);
  }, [nodeId]);

  const statusLabel =
    ui.status === "active"
      ? "Active"
      : ui.status === "requesting"
        ? "Requesting…"
        : ui.status === "denied"
          ? "Denied"
          : ui.status === "error"
            ? "Error"
            : enabled
              ? "Idle"
              : "Disabled";

  const statusClass =
    ui.status === "active"
      ? "text-emerald-300"
      : ui.status === "requesting"
        ? "text-cyan-200/90"
        : ui.status === "denied"
          ? "text-amber-200/90"
          : ui.status === "error"
            ? "text-rose-200/90"
            : "text-zinc-400";

  return (
    <ReadingPanel className="nodrag nopan space-y-2 px-3 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-300">Microphone</div>
        <div className={twMerge("text-[10px] font-semibold uppercase tracking-wide", statusClass)}>
          {statusLabel}
        </div>
      </div>
      <button
        type="button"
        className={twMerge(
          "nodrag w-full rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          enabled
            ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-100 hover:bg-emerald-950/35"
            : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
        )}
        onClick={() => update(nodeId, "enabled", !enabled)}
      >
        {enabled ? "Disable mic" : "Enable mic"}
      </button>
      {ui.errorMessage != null && ui.errorMessage.trim().length > 0 ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{ui.errorMessage}</div>
      ) : null}
      <div className="text-[10px] leading-snug text-zinc-500">
        Tip: enabling microphone requires permission in the webview.
      </div>
    </ReadingPanel>
  );
}

export function AudioOutputNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", false);
  const gate = readBool(defaultConfig, "gate", false);
  const gainRaw = typeof defaultConfig.gain === "number" ? defaultConfig.gain : Number(defaultConfig.gain);
  const gain = Number.isFinite(gainRaw) ? gainRaw : 0;
  const maxGainRaw =
    typeof defaultConfig.maxGain === "number" ? defaultConfig.maxGain : Number(defaultConfig.maxGain);
  const maxGain = Number.isFinite(maxGainRaw) ? Math.max(0, Math.min(1, maxGainRaw)) : 0.25;
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const muteAllAudio = useFlowEditorStore((s) => s.muteAllAudio);
  const edges = useFlowEditorStore((s) => s.edges);
  const [ui, setUi] = useState(() => studioAudioRuntime.getMasterUiState());

  useEffect(() => {
    const t = window.setInterval(() => {
      setUi(studioAudioRuntime.getMasterUiState());
    }, 250);
    return () => window.clearInterval(t);
  }, []);

  const statusLabel =
    ui.status === "running"
      ? "Running"
      : ui.status === "suspended"
        ? "Suspended"
        : ui.status === "error"
          ? "Error"
          : "Idle";

  const statusClass =
    ui.status === "running"
      ? "text-emerald-300"
      : ui.status === "suspended"
        ? "text-amber-200/90"
        : ui.status === "error"
          ? "text-rose-200/90"
          : "text-zinc-400";

  const isGateWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gate"),
    [edges, nodeId],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gain"),
    [edges, nodeId],
  );

  return (
    <ReadingPanel className="nodrag nopan space-y-2 px-3 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-300">Audio Output</div>
        <div className={twMerge("text-[10px] font-semibold uppercase tracking-wide", statusClass)}>
          {statusLabel}
        </div>
      </div>
      <button
        type="button"
        className={twMerge(
          "nodrag w-full rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          enabled
            ? "border-cyan-500/35 bg-cyan-950/20 text-cyan-100 hover:bg-cyan-950/30"
            : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
        )}
        onClick={() => update(nodeId, "enabled", !enabled)}
      >
        {enabled ? "Disable audio engine" : "Enable audio engine"}
      </button>
      {ui.errorMessage != null && ui.errorMessage.trim().length > 0 ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{ui.errorMessage}</div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={twMerge(
            "nodrag rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            gate
              ? "border-emerald-500/35 bg-emerald-950/20 text-emerald-100 hover:bg-emerald-950/30"
              : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
            isGateWired ? "opacity-60" : "",
          )}
          disabled={isGateWired}
          onClick={() => update(nodeId, "gate", !gate)}
        >
          {gate ? "Gate: on" : "Gate: off"}
        </button>
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Gain</div>
          <TRNScrubNumberInput
            aria-label="Audio output gain"
            value={Math.max(0, Math.min(maxGain, gain))}
            min={0}
            max={maxGain}
            step={0.01}
            pointerScrubEnabled
            disabled={isGainWired}
            inputClassName="w-full rounded-md border border-zinc-700/70 bg-zinc-950/30 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            onChange={(next) => update(nodeId, "gain", Math.max(0, Math.min(maxGain, next)))}
          />
        </div>
      </div>
      {isGateWired || isGainWired ? (
        <div className="text-[10px] leading-snug text-zinc-500">
          {isGateWired ? (
            <>
              <span className="font-medium text-zinc-400">Gate</span> is wired
            </>
          ) : null}
          {isGateWired && isGainWired ? <span> · </span> : null}
          {isGainWired ? (
            <>
              <span className="font-medium text-zinc-400">Gain</span> is wired
            </>
          ) : null}
          <span> — card controls are overridden.</span>
        </div>
      ) : null}
      <div className="text-[10px] leading-snug text-zinc-500">
        Wire <span className="font-medium text-zinc-400">Audio</span> from a source, or enable{" "}
        <span className="font-medium text-zinc-400">Monitor mode</span> in the Inspector.
      </div>
      <button
        type="button"
        className={twMerge(
          "nodrag w-full rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          "border-rose-900/45 bg-rose-950/15 text-rose-100/90 hover:bg-rose-950/25",
        )}
        onClick={() => muteAllAudio()}
      >
        Mute all audio
      </button>
      <div className="text-[10px] leading-snug text-zinc-500">
        Use the <span className="font-medium text-zinc-400">Gate</span> input to start/stop monitoring (mic) or playback (oscillator).
      </div>
      <div className="text-[10px] leading-snug text-zinc-500">
        Safety cap: <span className="font-medium text-zinc-400">maxGain</span> ={" "}
        <span className="font-mono text-zinc-300">{maxGain.toFixed(2)}</span>
      </div>
    </ReadingPanel>
  );
}

export function AudioScopeNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", true);
  const mode = typeof defaultConfig.mode === "string" ? defaultConfig.mode : "waveform";
  const fpsRaw = typeof defaultConfig.fps === "number" ? defaultConfig.fps : 30;
  const fps = Number.isFinite(fpsRaw) ? Math.max(5, Math.min(60, Math.round(fpsRaw))) : 30;
  const fftSizeRaw =
    typeof defaultConfig.fftSize === "number" ? defaultConfig.fftSize : Number(defaultConfig.fftSize);
  const fftSize = Number.isFinite(fftSizeRaw) ? Math.max(32, Math.min(32768, Math.round(fftSizeRaw))) : 2048;
  const smoothingRaw =
    typeof defaultConfig.smoothing === "number"
      ? defaultConfig.smoothing
      : Number(defaultConfig.smoothing);
  const smoothing = Number.isFinite(smoothingRaw) ? Math.max(0, Math.min(1, smoothingRaw)) : 0.8;
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const selectedNodeId = useFlowEditorStore((s) => s.selectedNodeId);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  const sourceNodeId = useMemo(() => {
    const wired = edges.find((e) => e.target === nodeId && e.targetHandle === "audio");
    return resolveAudioSinkSourceNodeId({
      sinkNodeId: nodeId,
      cfg: defaultConfig,
      nodes,
      edges,
      selectedNodeId,
      wiredSourceNodeId: wired?.source ?? null,
    });
  }, [defaultConfig, edges, nodeId, nodes, selectedNodeId]);

  const sourceKind = useMemo((): "mic" | "osc" | "file" | "unknown" => {
    if (sourceNodeId == null) return "unknown";
    const n = nodes.find((x) => x.id === sourceNodeId);
    if (n?.type !== "studio") return "unknown";
    if (n.data.nodeId === "mic-input") return "mic";
    if (n.data.nodeId === "audio-oscillator") return "osc";
    if (n.data.nodeId === "audio-file-player") return "file";
    return "unknown";
  }, [nodes, sourceNodeId]);

  useEffect(() => {
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!enabled) return;
      if (ts - (lastRef.current || 0) < 1000 / fps) return;
      lastRef.current = ts;

      const c = canvasRef.current;
      if (c == null) return;
      const ctx = c.getContext("2d");
      if (ctx == null) return;

      const w = c.width;
      const h = c.height;
      ctx.clearRect(0, 0, w, h);

      if (sourceNodeId == null) {
        ctx.fillStyle = "rgba(161,161,170,0.65)";
        ctx.font = "10px sans-serif";
        ctx.fillText("Wire Audio or enable Monitor mode", 8, 14);
        return;
      }

      const buffers =
        sourceKind === "mic"
          ? (studioAudioRuntime.setMicAnalyserSettings(sourceNodeId, { fftSize, smoothing }),
            studioAudioRuntime.readMicBuffers(sourceNodeId))
          : sourceKind === "osc"
            ? (studioAudioRuntime.setOscillatorAnalyserSettings(sourceNodeId, { fftSize, smoothing }),
              studioAudioRuntime.readOscillatorBuffers(sourceNodeId))
            : sourceKind === "file"
              ? (studioAudioRuntime.setFilePlayerAnalyserSettings(sourceNodeId, { fftSize, smoothing }),
                studioAudioRuntime.readFilePlayerBuffers(sourceNodeId))
          : (studioAudioRuntime.setMasterAnalyserSettings({ fftSize, smoothing }),
            studioAudioRuntime.readMasterBuffers());
      if (buffers == null) {
        ctx.fillStyle = "rgba(161,161,170,0.65)";
        ctx.font = "10px sans-serif";
        ctx.fillText(
          sourceKind === "mic"
            ? "Mic inactive"
            : sourceKind === "osc"
              ? "Osc inactive"
              : sourceKind === "file"
                ? "File inactive"
                : "Audio inactive",
          8,
          14,
        );
        return;
      }

      const stroke = "rgba(34,211,238,0.85)";
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = stroke;
      ctx.beginPath();

      if (mode === "spectrum" || mode === "both") {
        const data = buffers.freq;
        const n = data.length;
        const barW = Math.max(1, Math.floor(w / Math.max(1, Math.min(n, 64))));
        for (let i = 0; i < 64; i += 1) {
          const idx = Math.floor((i / 64) * n);
          const v = data[idx] / 255;
          const bh = Math.max(1, Math.round(v * (h - 6)));
          const x = i * barW;
          ctx.fillStyle = "rgba(34,211,238,0.45)";
          ctx.fillRect(x, h - bh, Math.max(1, barW - 1), bh);
        }
      } else {
        const data = buffers.time;
        for (let i = 0; i < data.length; i += 1) {
          const x = (i / (data.length - 1)) * w;
          const v = (data[i] - 128) / 128;
          const y = h / 2 - v * (h * 0.42);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, fps, mode, sourceNodeId]);

  const modeOptions: TRNSelectOption[] = [
    { value: "waveform", label: "Waveform" },
    { value: "spectrum", label: "Spectrum" },
    { value: "both", label: "Both" },
  ];
  const fftOptions: TRNSelectOption[] = [
    { value: "256", label: "256" },
    { value: "512", label: "512" },
    { value: "1024", label: "1024" },
    { value: "2048", label: "2048" },
    { value: "4096", label: "4096" },
    { value: "8192", label: "8192" },
  ];

  return (
    <ReadingPanel className="nodrag nopan space-y-2 px-3 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-300">Audio Scope</div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
          {enabled ? mode : "disabled"}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TRNSelect
          ariaLabel="Scope mode"
          value={mode}
          options={modeOptions}
          onValueChange={(next) => update(nodeId, "mode", next)}
          size="sm"
          sectionTitle="Scope mode"
        />
      </div>
      <p className="text-[10px] leading-snug text-zinc-500">
        Wire <span className="font-medium text-zinc-400">Audio</span> from a source, or enable{" "}
        <span className="font-medium text-zinc-400">Monitor mode</span> in the Inspector.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <TRNSelect
          ariaLabel="Scope FFT size"
          value={String(fftSize)}
          options={fftOptions}
          onValueChange={(next) => update(nodeId, "fftSize", Number(next))}
          size="sm"
          sectionTitle="FFT size"
        />
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Smoothing</div>
          <TRNScrubNumberInput
            aria-label="Scope smoothing"
            value={smoothing}
            min={0}
            max={1}
            step={0.01}
            pointerScrubEnabled
            inputClassName="w-full rounded-md border border-zinc-700/70 bg-zinc-950/30 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            onChange={(next) => update(nodeId, "smoothing", Math.max(0, Math.min(1, next)))}
          />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={260}
        height={88}
        className="nodrag block w-full rounded-md border border-zinc-800/80 bg-zinc-950/30"
      />
    </ReadingPanel>
  );
}

export function AudioFilePlayerNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", false);
  const url = readString(defaultConfig, "url", "");
  const gate = readBool(defaultConfig, "gate", false);
  const loop = readBool(defaultConfig, "loop", false);
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const [ui, setUi] = useState(() => studioAudioRuntime.getFilePlayerUiState(nodeId));

  useEffect(() => {
    const t = window.setInterval(() => {
      setUi(studioAudioRuntime.getFilePlayerUiState(nodeId));
    }, 250);
    return () => window.clearInterval(t);
  }, [nodeId]);

  const statusLabel =
    ui.status === "ready"
      ? "Ready"
      : ui.status === "loading"
        ? "Loading…"
        : ui.status === "error"
          ? "Error"
          : enabled
            ? "Idle"
            : "Disabled";

  return (
    <ReadingPanel className="nodrag nopan space-y-2 px-3 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-300">Audio File</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{statusLabel}</div>
      </div>
      <InspectorTextField
        ariaLabel="Audio file URL"
        value={url}
        placeholder="https://…/file.wav"
        onChange={(next) => update(nodeId, "url", next)}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={twMerge(
            "nodrag rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            enabled
              ? "border-emerald-500/35 bg-emerald-950/20 text-emerald-100 hover:bg-emerald-950/30"
              : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
          )}
          onClick={() => update(nodeId, "enabled", !enabled)}
        >
          {enabled ? "Enabled" : "Enable"}
        </button>
        <button
          type="button"
          className={twMerge(
            "nodrag rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            gate
              ? "border-cyan-500/35 bg-cyan-950/20 text-cyan-100 hover:bg-cyan-950/30"
              : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
          )}
          onClick={() => update(nodeId, "gate", !gate)}
        >
          {gate ? "Stop" : "Play"}
        </button>
      </div>
      <button
        type="button"
        className={twMerge(
          "nodrag w-full rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          loop
            ? "border-violet-500/35 bg-violet-950/20 text-violet-100 hover:bg-violet-950/30"
            : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
        )}
        onClick={() => update(nodeId, "loop", !loop)}
      >
        {loop ? "Loop: on" : "Loop: off"}
      </button>
      {ui.errorMessage != null && ui.errorMessage.trim().length > 0 ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{ui.errorMessage}</div>
      ) : null}
      <div className="text-[10px] leading-snug text-zinc-500">
        Requires <span className="font-medium text-zinc-400">Audio Output</span> enabled for playback.
      </div>
    </ReadingPanel>
  );
}

export function AudioOscillatorNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const edges = useFlowEditorStore((s) => s.edges);
  const waveform = readString(defaultConfig, "waveform", "sine");
  const gate = readBool(defaultConfig, "gate", false);
  const sweepEnabled = readBool(defaultConfig, "sweepEnabled", false);
  const sweepStartHz = Number(defaultConfig.sweepStartHz ?? 220);
  const sweepEndHz = Number(defaultConfig.sweepEndHz ?? 880);
  const sweepPeriodS = Number(defaultConfig.sweepPeriodS ?? 4);
  const freqHz = Number(defaultConfig.freqHz ?? 440);
  const gain = Number(defaultConfig.gain ?? 0);

  const waveformOptions: TRNSelectOption[] = [
    { value: "sine", label: "Sine" },
    { value: "square", label: "Square" },
    { value: "sawtooth", label: "Saw" },
    { value: "triangle", label: "Triangle" },
  ];

  const clampNum = (n: number, fallback: number) => (Number.isFinite(n) ? n : fallback);
  const f = Math.max(0, clampNum(freqHz, 440));
  const g = Math.max(0, Math.min(1, clampNum(gain, 0)));
  const ss = Math.max(0, clampNum(sweepStartHz, 220));
  const se = Math.max(0, clampNum(sweepEndHz, 880));
  const sp = Math.max(0.25, clampNum(sweepPeriodS, 4));

  const isFreqWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "freqHz"),
    [edges, nodeId],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gain"),
    [edges, nodeId],
  );
  const isGateWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gate"),
    [edges, nodeId],
  );

  return (
    <ReadingPanel className="nodrag nopan space-y-2 px-3 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-300">Oscillator</div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
          {gate ? "GATE ON" : "GATE OFF"}
        </div>
      </div>
      <TRNSelect
        ariaLabel="Oscillator waveform"
        value={waveform}
        options={waveformOptions}
        onValueChange={(next) => update(nodeId, "waveform", next)}
        size="sm"
        sectionTitle="Waveform"
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Freq (Hz)</div>
          <TRNScrubNumberInput
            aria-label="Oscillator frequency"
            value={f}
            min={0}
            step={1}
            pointerScrubEnabled
            disabled={isFreqWired}
            inputClassName="w-full rounded-md border border-zinc-700/70 bg-zinc-950/30 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            onChange={(next) => update(nodeId, "freqHz", next)}
          />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Gain</div>
          <TRNScrubNumberInput
            aria-label="Oscillator gain"
            value={g}
            min={0}
            max={1}
            step={0.01}
            pointerScrubEnabled
            disabled={isGainWired}
            inputClassName="w-full rounded-md border border-zinc-700/70 bg-zinc-950/30 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            onChange={(next) => update(nodeId, "gain", next)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          className={twMerge(
            "nodrag rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            sweepEnabled
              ? "border-violet-500/35 bg-violet-950/20 text-violet-100 hover:bg-violet-950/30"
              : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
            isFreqWired ? "opacity-60" : "",
          )}
          disabled={isFreqWired}
          onClick={() => update(nodeId, "sweepEnabled", !sweepEnabled)}
        >
          {sweepEnabled ? "Sweep: on" : "Sweep: off"}
        </button>
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Period (s)</div>
          <TRNScrubNumberInput
            aria-label="Oscillator sweep period seconds"
            value={sp}
            min={0.25}
            step={0.25}
            pointerScrubEnabled
            disabled={isFreqWired}
            inputClassName="w-full rounded-md border border-zinc-700/70 bg-zinc-950/30 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-violet-500/45 focus:ring-1 focus:ring-violet-500/25"
            onChange={(next) => update(nodeId, "sweepPeriodS", Math.max(0.25, next))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Start (Hz)</div>
          <TRNScrubNumberInput
            aria-label="Oscillator sweep start frequency"
            value={ss}
            min={0}
            step={1}
            pointerScrubEnabled
            disabled={isFreqWired}
            inputClassName="w-full rounded-md border border-zinc-700/70 bg-zinc-950/30 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-violet-500/45 focus:ring-1 focus:ring-violet-500/25"
            onChange={(next) => update(nodeId, "sweepStartHz", Math.max(0, next))}
          />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">End (Hz)</div>
          <TRNScrubNumberInput
            aria-label="Oscillator sweep end frequency"
            value={se}
            min={0}
            step={1}
            pointerScrubEnabled
            disabled={isFreqWired}
            inputClassName="w-full rounded-md border border-zinc-700/70 bg-zinc-950/30 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-violet-500/45 focus:ring-1 focus:ring-violet-500/25"
            onChange={(next) => update(nodeId, "sweepEndHz", Math.max(0, next))}
          />
        </div>
      </div>
      {isFreqWired || isGainWired || isGateWired ? (
        <div className="text-[10px] leading-snug text-zinc-500">
          {isFreqWired ? (
            <>
              <span className="font-medium text-zinc-400">Freq</span> is wired (sweep disabled)
            </>
          ) : null}
          {isFreqWired && (isGainWired || isGateWired) ? <span> · </span> : null}
          {isGainWired ? (
            <>
              <span className="font-medium text-zinc-400">Gain</span> is wired
            </>
          ) : null}
          {isGainWired && isGateWired ? <span> · </span> : null}
          {isGateWired ? (
            <>
              <span className="font-medium text-zinc-400">Gate</span> is wired
            </>
          ) : null}
          <span> — card controls are overridden.</span>
        </div>
      ) : null}
      <button
        type="button"
        className={twMerge(
          "nodrag w-full rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          gate
            ? "border-cyan-500/35 bg-cyan-950/20 text-cyan-100 hover:bg-cyan-950/30"
            : "border-zinc-700/70 bg-zinc-950/20 text-zinc-200 hover:bg-zinc-900/40",
          isGateWired ? "opacity-60" : "",
        )}
        disabled={isGateWired}
        onClick={() => update(nodeId, "gate", !gate)}
      >
        {gate ? "Stop (gate off)" : "Play (gate on)"}
      </button>
      <div className="text-[10px] leading-snug text-zinc-500">
        Sweep applies only when the <span className="font-medium text-zinc-400">Freq</span> input pin is unwired. Enable{" "}
        <span className="font-medium text-zinc-400">Audio Output</span> to hear it.
      </div>
    </ReadingPanel>
  );
}

