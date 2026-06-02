import { Mic, Plug, Waves, Radio } from "lucide-react";
import { useMemo } from "react";
import { TRNButton } from "../../../../../../../ui/TRN";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorSelectRow } from "../../InspectorDenseControls";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorTextField } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { readMonitorModeEnabled } from "../../../../../../core/audio/resolve-audio-monitor-source";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";

function readFiniteNumber(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function audioSourceOptions(nodes: ReturnType<typeof useFlowEditorStore.getState>["nodes"]): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [
    { value: "", label: "Auto" },
    { value: "__none__", label: "None" },
  ];
  const mic = nodes.filter((n) => n.type === "studio" && n.data.nodeId === "mic-input");
  const osc = nodes.filter((n) => n.type === "studio" && n.data.nodeId === "audio-oscillator");
  const file = nodes.filter((n) => n.type === "studio" && n.data.nodeId === "audio-file-player");
  for (const n of mic) {
    options.push({ value: n.id, label: `Mic · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  for (const n of osc) {
    options.push({ value: n.id, label: `Osc · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  for (const n of file) {
    options.push({ value: n.id, label: `File · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  return options;
}

function monitorSourceSelectValue(
  sourceMode: unknown,
  sourceNodeId: unknown,
): string {
  const mode = typeof sourceMode === "string" ? sourceMode : "auto";
  if (mode === "none") {
    return "__none__";
  }
  if (mode === "node") {
    const id = typeof sourceNodeId === "string" ? sourceNodeId.trim() : "";
    return id.length > 0 ? id : "";
  }
  return "";
}

function applyMonitorSourceChange(
  onUpdateConfigField: NodeInspectorSettingsSectionProps["onUpdateConfigField"],
  sourceMode: unknown,
  sourceNodeId: unknown,
  next: string,
): void {
  const v = next.trim();
  if (v === "__none__") {
    onUpdateConfigField("sourceMode", "none");
    onUpdateConfigField("sourceNodeId", "");
    return;
  }
  if (v.length === 0) {
    onUpdateConfigField("sourceMode", "auto");
    onUpdateConfigField("sourceNodeId", "");
    return;
  }
  onUpdateConfigField("sourceMode", "node");
  onUpdateConfigField("sourceNodeId", v);
}

function MonitorModeInspectorFields(props: {
  cfg: Record<string, unknown>;
  onUpdateConfigField: NodeInspectorSettingsSectionProps["onUpdateConfigField"];
  wiredAudioBus: boolean;
}) {
  const { cfg, onUpdateConfigField, wiredAudioBus } = props;
  const sourceMode = cfg.sourceMode;
  const sourceNodeId = cfg.sourceNodeId;
  const monitorEnabled = readMonitorModeEnabled(cfg);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const sourceOptions = useMemo(() => audioSourceOptions(nodes), [nodes]);

  return (
    <InspectorCollapsibleSection
      title="Monitor mode"
      icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Optional preview routing when no Audio input pin is wired. Wire Audio for explicit graph routing."
      defaultExpanded
    >
      {wiredAudioBus ? (
        <div className="text-[11px] leading-snug text-zinc-500">
          <span className="font-medium text-zinc-400">Audio input is wired</span> — monitor selection is ignored.
        </div>
      ) : (
        <InspectorCompactToggleRow
          label="Enable monitor mode"
          hint="Route audio without an Audio wire (Auto picks a nearby source). Off by default in v0.2."
          checked={monitorEnabled}
          onCheckedChange={(next) => {
            onUpdateConfigField("monitorModeEnabled", next);
            if (next && monitorSourceSelectValue(sourceMode, sourceNodeId) === "__none__") {
              onUpdateConfigField("sourceMode", "auto");
              onUpdateConfigField("sourceNodeId", "");
            }
            if (!next) {
              onUpdateConfigField("sourceMode", "none");
              onUpdateConfigField("sourceNodeId", "");
            }
          }}
        />
      )}
      <InspectorSelectRow
        label="Source"
        description="Auto prefers selected/nearest mic, osc, or file on the canvas."
        ariaLabel="Monitor source"
        value={monitorSourceSelectValue(sourceMode, sourceNodeId)}
        options={sourceOptions}
        disabled={wiredAudioBus || !monitorEnabled}
        onChange={(next) => applyMonitorSourceChange(onUpdateConfigField, sourceMode, sourceNodeId, next)}
      />
    </InspectorCollapsibleSection>
  );
}

export function MicInputSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const enabled = cfg.enabled === true;
  const deviceId = typeof cfg.deviceId === "string" ? cfg.deviceId : "default";
  const fftSize = readFiniteNumber(cfg.fftSize, 2048);
  const smoothing = readFiniteNumber(cfg.smoothing, 0.8);
  const gateEnabled = cfg.gateEnabled === true;
  const gateThreshold = readFiniteNumber(cfg.gateThreshold, 0.02);
  const peakHoldMs = readFiniteNumber(cfg.peakHoldMs, 150);

  return (
    <div className="flex flex-col gap-2">
      <InspectorCollapsibleSection
        title="Microphone"
        icon={<Mic className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Permission-gated audio input. Emits scalar audio features on output pins."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Enabled"
          hint="When enabled, the webview requests microphone permission and begins analysis."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorSelectRow
          label="Device"
          description="Device id string. Use default unless you need a specific input."
          ariaLabel="Microphone device id"
          value={deviceId}
          options={[
            { value: "default", label: "Default" },
          ]}
          onChange={(next) => onUpdateConfigField("deviceId", next)}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Analysis"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Analyser settings (FFT size and smoothing) affect RMS/peak and spectrum-derived features."
        defaultExpanded
      >
        <InspectorNumericScrubRow
          label="FFT size"
          description="Power-of-two recommended (256..8192). Higher = more frequency resolution."
          ariaLabel="Microphone FFT size"
          value={fftSize}
          step={128}
          onCommit={(next) => onUpdateConfigField("fftSize", Math.round(next))}
        />
        <InspectorNumericScrubRow
          label="Smoothing"
          description="0..1 smoothingTimeConstant on the analyser (higher = steadier)."
          ariaLabel="Microphone analyser smoothing"
          value={smoothing}
          step={0.01}
          onCommit={(next) => onUpdateConfigField("smoothing", next)}
        />
        <InspectorCompactToggleRow
          label="Gate below threshold"
          hint="When enabled, RMS and peak outputs clamp to 0 below the threshold."
          checked={gateEnabled}
          onCheckedChange={(next) => onUpdateConfigField("gateEnabled", next)}
        />
        <InspectorNumericScrubRow
          label="Gate threshold"
          description="0..1 amplitude threshold for gating."
          ariaLabel="Microphone gate threshold"
          value={gateThreshold}
          step={0.001}
          onCommit={(next) => onUpdateConfigField("gateThreshold", next)}
        />
        <InspectorNumericScrubRow
          label="Peak hold (ms)"
          description="Holds the peak output for a short window."
          ariaLabel="Microphone peak hold milliseconds"
          value={peakHoldMs}
          step={10}
          onCommit={(next) => onUpdateConfigField("peakHoldMs", Math.round(next))}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function AudioOutputSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const muteAllAudio = useFlowEditorStore((s) => s.muteAllAudio);
  const edges = useFlowEditorStore((s) => s.edges);

  const enabled = cfg.enabled === true;
  const limiterEnabled = cfg.limiterEnabled !== false;
  const maxGain = readFiniteNumber(cfg.maxGain, 0.25);
  const isGateWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gate"),
    [edges, selectedNode.id],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gain"),
    [edges, selectedNode.id],
  );

  return (
    <div className="flex flex-col gap-2">
      <InspectorCollapsibleSection
        title="Audio Output"
        icon={<Plug className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Master output chain (gain + limiter) and monitoring source selection."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Enable audio engine"
          hint="Enables the Web Audio output chain. You still control playback with the Gate input pin."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorCompactToggleRow
          label="Limiter enabled"
          hint="Conservative safety compressor on the master output."
          checked={limiterEnabled}
          onCheckedChange={(next) => onUpdateConfigField("limiterEnabled", next)}
        />
        <InspectorNumericScrubRow
          label="Max gain"
          description="Safety cap for output gain (0..1)."
          ariaLabel="Audio output max gain"
          value={maxGain}
          step={0.01}
          onCommit={(next) => onUpdateConfigField("maxGain", next)}
        />
        <InspectorNumericScrubRow
          label="Default gain"
          description="Used when the Gain input pin is unwired."
          ariaLabel="Audio output default gain"
          value={readFiniteNumber(cfg.gain, 0)}
          step={0.01}
          disabled={isGainWired}
          onCommit={(next) => onUpdateConfigField("gain", next)}
        />
        <InspectorCompactToggleRow
          label="Default gate"
          hint="Used when the Gate input pin is unwired."
          checked={cfg.gate === true}
          disabled={isGateWired}
          onCheckedChange={(next) => onUpdateConfigField("gate", next)}
        />
        <MonitorModeInspectorFields
          cfg={cfg}
          onUpdateConfigField={onUpdateConfigField}
          wiredAudioBus={edges.some(
            (e) => e.target === selectedNode.id && e.targetHandle === "audio",
          )}
        />
        {isGateWired || isGainWired ? (
          <div className="mt-1 text-[11px] leading-snug text-zinc-500">
            <span className="font-medium text-zinc-400">Wired inputs:</span>{" "}
            {isGateWired ? <span>Gate</span> : null}
            {isGateWired && isGainWired ? <span> · </span> : null}
            {isGainWired ? <span>Gain</span> : null}
            <span> (Inspector defaults are overridden.)</span>
          </div>
        ) : null}
        <TRNButton
          size="compact"
          className="mt-1 w-full border-rose-900/45 text-rose-100/90"
          hint="Turns off Gate on all audio nodes and mutes monitor paths immediately."
          onClick={() => muteAllAudio()}
        >
          Mute all audio
        </TRNButton>
      </InspectorCollapsibleSection>
    </div>
  );
}

export function AudioScopeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const edges = useFlowEditorStore((s) => s.edges);

  const enabled = cfg.enabled !== false;
  const mode = typeof cfg.mode === "string" ? cfg.mode : "waveform";
  const fps = readFiniteNumber(cfg.fps, 30);
  const fftSize = readFiniteNumber(cfg.fftSize, 2048);
  const smoothing = readFiniteNumber(cfg.smoothing, 0.8);
  return (
    <div className="flex flex-col gap-2">
      <InspectorCollapsibleSection
        title="Audio Scope"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="On-card waveform/spectrum visualization (canvas)."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Enabled"
          hint="When disabled, the scope does not draw."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorSelectRow
          label="Mode"
          ariaLabel="Audio scope mode"
          value={mode}
          options={[
            { value: "waveform", label: "Waveform" },
            { value: "spectrum", label: "Spectrum" },
            { value: "both", label: "Both" },
          ]}
          onChange={(next) => onUpdateConfigField("mode", next)}
        />
        <InspectorNumericScrubRow
          label="FPS"
          description="Scope draw rate (5..60)."
          ariaLabel="Audio scope FPS"
          value={fps}
          step={1}
          onCommit={(next) => onUpdateConfigField("fps", Math.round(next))}
        />
        <InspectorSelectRow
          label="FFT size"
          description="Power-of-two recommended (256..8192). Higher = more frequency resolution."
          ariaLabel="Audio scope FFT size"
          value={String(Math.round(fftSize))}
          options={[
            { value: "256", label: "256" },
            { value: "512", label: "512" },
            { value: "1024", label: "1024" },
            { value: "2048", label: "2048" },
            { value: "4096", label: "4096" },
            { value: "8192", label: "8192" },
          ]}
          onChange={(next) => onUpdateConfigField("fftSize", Number(next))}
        />
        <InspectorNumericScrubRow
          label="Smoothing"
          description="Analyser smoothing time constant (0..1)."
          ariaLabel="Audio scope smoothing"
          value={Math.max(0, Math.min(1, smoothing))}
          step={0.01}
          onCommit={(next) => onUpdateConfigField("smoothing", Math.max(0, Math.min(1, next)))}
        />
        <MonitorModeInspectorFields
          cfg={cfg}
          onUpdateConfigField={onUpdateConfigField}
          wiredAudioBus={edges.some(
            (e) => e.target === selectedNode.id && e.targetHandle === "audio",
          )}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function AudioFilePlayerSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;

  const enabled = cfg.enabled === true;
  const url = typeof cfg.url === "string" ? cfg.url : "";
  const loop = cfg.loop === true;
  const gain = readFiniteNumber(cfg.gain, 0.5);

  return (
    <div className="flex flex-col gap-2">
      <InspectorCollapsibleSection
        title="Audio file player"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Fetches and decodes an audio file from a URL. Playback is controlled by the Gate input pin or the node card Play/Stop button."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Enabled"
          hint="When enabled, the node can load and play the audio file."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorCompactToggleRow
          label="Loop"
          hint="When enabled, the decoded buffer loops continuously."
          checked={loop}
          onCheckedChange={(next) => onUpdateConfigField("loop", next)}
        />
        <InspectorNumericScrubRow
          label="Default gain"
          description="Used when Gain input pin is unwired."
          ariaLabel="Audio file default gain"
          value={gain}
          step={0.01}
          onCommit={(next) => onUpdateConfigField("gain", next)}
        />
        <div className="pt-1">
          <div className="mb-1 text-[10px] font-medium text-zinc-500">URL</div>
          <InspectorTextField
            ariaLabel="Audio file URL"
            value={url}
            placeholder="https://…/file.wav"
            onChange={(next) => onUpdateConfigField("url", next)}
          />
        </div>
      </InspectorCollapsibleSection>
    </div>
  );
}

export function AudioOscillatorSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const edges = useFlowEditorStore((s) => s.edges);

  const waveform = typeof cfg.waveform === "string" ? cfg.waveform : "sine";
  const detuneCents = readFiniteNumber(cfg.detuneCents, 0);
  const freqHz = readFiniteNumber(cfg.freqHz, 440);
  const sweepEnabled = cfg.sweepEnabled === true;
  const sweepStartHz = readFiniteNumber(cfg.sweepStartHz, 220);
  const sweepEndHz = readFiniteNumber(cfg.sweepEndHz, 880);
  const sweepPeriodS = readFiniteNumber(cfg.sweepPeriodS, 4);
  const gain = readFiniteNumber(cfg.gain, 0);
  const gate = cfg.gate === true;
  const isFreqWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "freqHz"),
    [edges, selectedNode.id],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gain"),
    [edges, selectedNode.id],
  );
  const isGateWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gate"),
    [edges, selectedNode.id],
  );

  return (
    <div className="flex flex-col gap-2">
      <InspectorCollapsibleSection
        title="Oscillator"
        icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Test tone generator. Output audio is routed through the master output chain when Audio Output is enabled."
        defaultExpanded
      >
        <InspectorSelectRow
          label="Waveform"
          ariaLabel="Oscillator waveform"
          value={waveform}
          options={[
            { value: "sine", label: "Sine" },
            { value: "square", label: "Square" },
            { value: "sawtooth", label: "Sawtooth" },
            { value: "triangle", label: "Triangle" },
          ]}
          onChange={(next) => onUpdateConfigField("waveform", next)}
        />
        <InspectorNumericScrubRow
          label="Frequency (Hz)"
          description="Used when the Freq input pin is unwired (or when Sweep is disabled)."
          ariaLabel="Oscillator frequency"
          value={freqHz}
          step={1}
          disabled={isFreqWired}
          onCommit={(next) => onUpdateConfigField("freqHz", Math.max(0, next))}
        />
        <InspectorCompactToggleRow
          label="Sweep"
          hint="When enabled and the Freq input pin is unwired, the oscillator sweeps between Start and End at the chosen period."
          checked={sweepEnabled}
          disabled={isFreqWired}
          onCheckedChange={(next) => onUpdateConfigField("sweepEnabled", next)}
        />
        <div className="grid grid-cols-2 gap-2">
          <InspectorNumericScrubRow
            label="Sweep start (Hz)"
            ariaLabel="Oscillator sweep start frequency"
            value={sweepStartHz}
            step={1}
            disabled={isFreqWired}
            onCommit={(next) => onUpdateConfigField("sweepStartHz", Math.max(0, next))}
          />
          <InspectorNumericScrubRow
            label="Sweep end (Hz)"
            ariaLabel="Oscillator sweep end frequency"
            value={sweepEndHz}
            step={1}
            disabled={isFreqWired}
            onCommit={(next) => onUpdateConfigField("sweepEndHz", Math.max(0, next))}
          />
        </div>
        <InspectorNumericScrubRow
          label="Sweep period (s)"
          description="Seconds for a full up+down cycle."
          ariaLabel="Oscillator sweep period seconds"
          value={sweepPeriodS}
          step={0.25}
          disabled={isFreqWired}
          onCommit={(next) => onUpdateConfigField("sweepPeriodS", Math.max(0.25, next))}
        />
        <InspectorNumericScrubRow
          label="Gain"
          ariaLabel="Oscillator gain"
          value={gain}
          step={0.01}
          disabled={isGainWired}
          onCommit={(next) => onUpdateConfigField("gain", next)}
        />
        <InspectorNumericScrubRow
          label="Detune (cents)"
          ariaLabel="Oscillator detune cents"
          value={detuneCents}
          step={1}
          onCommit={(next) => onUpdateConfigField("detuneCents", next)}
        />
        <InspectorCompactToggleRow
          label="Gate"
          hint="Fallback when the Gate input pin is unwired."
          checked={gate}
          disabled={isGateWired}
          onCheckedChange={(next) => onUpdateConfigField("gate", next)}
        />
        {isFreqWired || isGainWired || isGateWired ? (
          <div className="mt-1 text-[11px] leading-snug text-zinc-500">
            <span className="font-medium text-zinc-400">Wired inputs:</span>{" "}
            {isFreqWired ? <span>Freq</span> : null}
            {isFreqWired && (isGainWired || isGateWired) ? <span> · </span> : null}
            {isGainWired ? <span>Gain</span> : null}
            {isGainWired && isGateWired ? <span> · </span> : null}
            {isGateWired ? <span>Gate</span> : null}
            <span> (Inspector defaults are overridden.)</span>
          </div>
        ) : null}
      </InspectorCollapsibleSection>
    </div>
  );
}

