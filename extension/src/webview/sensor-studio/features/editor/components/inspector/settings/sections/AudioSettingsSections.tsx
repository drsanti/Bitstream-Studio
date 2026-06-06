import {
  Activity,
  FileAudio,
  Filter,
  Mic,
  Monitor,
  Palette,
  Plug,
  Waves,
  Radio,
} from "lucide-react";
import { useMemo } from "react";
import { TRNButton } from "../../../../../../../ui/TRN";
import { FlowNodeHeaderBadge } from "../../../../nodes/flow-node/FlowNodeHeaderBadge";
import {
  audioOutputCardErrorLine,
  audioOutputWiredInputParts,
  clampAudioOutputGain,
  readAudioOutputMaxGain,
  resolveAudioOutputGate,
  resolveAudioOutputHeaderBadge,
  useAudioOutputRuntimeUi,
} from "../../../../nodes/audio/audio-output-chrome";
import {
  AUDIO_SCOPE_THEME_PRESETS,
  audioScopeThemePresetFields,
  coerceAudioScopeDisplayConfig,
  type AudioScopeThemePreset,
} from "../../../../nodes/audio/audio-scope-display-config";
import {
  AUDIO_SCOPE_MODE_OPTIONS,
  audioScopeWiredInputParts,
  formatAudioScopeModeLabel,
  resolveAudioScopeEnabled,
  resolveAudioScopeHeaderBadge,
} from "../../../../nodes/audio/audio-scope-chrome";
import {
  filePlayerCardErrorLine,
  filePlayerWiredInputParts,
  formatFilePlayerTransportClock,
  resolveFilePlayerGate,
  resolveFilePlayerHeaderBadge,
  useFilePlayerRuntimeUi,
  useFilePlayerTransportUi,
} from "../../../../nodes/audio/audio-file-player-chrome";
import {
  formatOscillatorLiveScalar,
  oscillatorWiredInputParts,
  OSCILLATOR_WAVEFORM_OPTIONS,
  resolveOscillatorGate,
  resolveOscillatorHeaderBadge,
} from "../../../../nodes/audio/audio-oscillator-chrome";
import {
  micInputCardErrorLine,
  resolveMicInputHeaderBadge,
  useMicInputRuntimeUi,
} from "../../../../nodes/audio/mic-input-chrome";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorSegmentButtonGroup } from "../../InspectorSegmentButtonGroup";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorColorRow, InspectorSelectRow } from "../../InspectorDenseControls";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorTextField } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  ANALYSER_FFT_SIZE_OPTIONS,
  clampAnalyserFftSize,
} from "../../../../../../core/audio/clamp-analyser-fft-size";
import {
  applyMotorPresetToConfig,
  MOTOR_MACHINE_PRESETS,
  readMotorPresetId,
} from "../../../../../../core/audio/audio-machine-config";
import {
  AUDIO_SFX_PRESETS,
  applyAudioSfxPresetToConfig,
  readAudioSfxPresetId,
} from "../../../../../../core/audio/audio-sfx-config";
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
  const sfx = nodes.filter((n) => n.type === "studio" && n.data.nodeId === "audio-sfx");
  const machine = nodes.filter((n) => n.type === "studio" && n.data.nodeId === "audio-machine");
  for (const n of mic) {
    options.push({ value: n.id, label: `Mic · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  for (const n of osc) {
    options.push({ value: n.id, label: `Osc · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  for (const n of file) {
    options.push({ value: n.id, label: `File · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  for (const n of sfx) {
    options.push({ value: n.id, label: `SFX · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  for (const n of machine) {
    options.push({ value: n.id, label: `Machine · ${n.data.label?.trim()?.length ? n.data.label : n.id}` });
  }
  return options;
}

function monitorSourceSelectValue(
  sourceMode: unknown,
  sourceNodeId: unknown,
): string {
  const mode = typeof sourceMode === "string" ? sourceMode : "none";
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

  if (wiredAudioBus) {
    return null;
  }

  return (
    <InspectorCollapsibleSection
      title="Monitor mode"
      icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Optional preview routing when no Audio input pin is wired. Wire Audio for explicit graph routing."
      defaultExpanded
    >
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
      <InspectorSelectRow
        label="Source"
        description="Auto prefers selected/nearest mic, osc, or file on the canvas."
        ariaLabel="Monitor source"
        value={monitorSourceSelectValue(sourceMode, sourceNodeId)}
        options={sourceOptions}
        disabled={!monitorEnabled}
        onChange={(next) => applyMonitorSourceChange(onUpdateConfigField, sourceMode, sourceNodeId, next)}
      />
    </InspectorCollapsibleSection>
  );
}

function formatMicLiveScalar(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw.toFixed(3);
  }
  return "—";
}

export function MicInputSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const enabled = cfg.enabled === true;
  const deviceId = typeof cfg.deviceId === "string" ? cfg.deviceId : "default";
  const fftSize = clampAnalyserFftSize(readFiniteNumber(cfg.fftSize, 2048));
  const smoothing = readFiniteNumber(cfg.smoothing, 0.8);
  const gateEnabled = cfg.gateEnabled === true;
  const gateThreshold = readFiniteNumber(cfg.gateThreshold, 0.02);
  const peakHoldMs = readFiniteNumber(cfg.peakHoldMs, 150);

  const runtime = useMicInputRuntimeUi(selectedNode.id);
  const headerBadge = resolveMicInputHeaderBadge(runtime, enabled);
  const errorLine = micInputCardErrorLine(runtime, enabled);
  const liveNums = selectedNode.data.liveNumberByHandle;
  const rmsLive = formatMicLiveScalar(liveNums?.rms);
  const peakLive = formatMicLiveScalar(liveNums?.peak);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Capture"
        icon={<Mic className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Permission-gated microphone input. Scalar features update on output socket rows when capture is active."
        defaultExpanded
      >
        {enabled ? (
          <div className="mb-1 rounded border border-zinc-700/60 bg-zinc-950/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {headerBadge != null ? (
                <FlowNodeHeaderBadge tone={headerBadge.tone} pulseDot={headerBadge.pulseDot}>
                  {headerBadge.label}
                </FlowNodeHeaderBadge>
              ) : (
                <span className="text-[10px] font-medium text-zinc-500">Off</span>
              )}
              <span className="text-[11px] leading-snug text-zinc-300">
                RMS {rmsLive}
                <span className="text-zinc-600"> · </span>
                Peak {peakLive}
              </span>
            </div>
            {errorLine != null ? (
              <p className="mt-1 text-[10px] leading-snug text-rose-200/85">{errorLine}</p>
            ) : null}
          </div>
        ) : null}
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
        title="Analyser"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="FFT size and smoothing affect RMS, peak, and spectrum-derived Cent (Hz)."
        defaultExpanded
      >
        <InspectorSelectRow
          label="FFT size"
          description="Power-of-two only (32..32768). Higher = more frequency resolution."
          ariaLabel="Microphone FFT size"
          value={String(fftSize)}
          options={ANALYSER_FFT_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(next) => onUpdateConfigField("fftSize", clampAnalyserFftSize(Number(next)))}
        />
        <InspectorNumericScrubRow
          label="Smoothing"
          description="0..1 smoothingTimeConstant on the analyser (higher = steadier)."
          ariaLabel="Microphone analyser smoothing"
          value={smoothing}
          step={0.01}
          fractionDigits={2}
          onCommit={(next) => onUpdateConfigField("smoothing", next)}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Noise gate"
        icon={<Filter className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Clamps RMS and peak outputs to zero below the threshold when gating is enabled."
        defaultExpanded
      >
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
  const maxGain = readAudioOutputMaxGain(cfg.maxGain);
  const gain = clampAudioOutputGain(cfg.gain, maxGain);
  const runtime = useAudioOutputRuntimeUi();
  const isGateWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gate"),
    [edges, selectedNode.id],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gain"),
    [edges, selectedNode.id],
  );
  const wiredAudioBus = edges.some(
    (e) => e.target === selectedNode.id && e.targetHandle === "audio",
  );

  const headerBadge = resolveAudioOutputHeaderBadge(runtime, enabled);
  const errorLine = audioOutputCardErrorLine(runtime);
  const wiredParts = audioOutputWiredInputParts({ isGateWired, isGainWired });
  const gate = resolveAudioOutputGate(
    cfg,
    selectedNode.data.liveInputBooleanByHandle?.gate,
    isGateWired,
  );

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Engine"
        icon={<Plug className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Starts the shared Web Audio output chain. May require a user gesture on first enable."
        defaultExpanded
      >
        {enabled ? (
          <div className="mb-1 rounded border border-zinc-700/60 bg-zinc-950/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {headerBadge != null ? (
                <FlowNodeHeaderBadge tone={headerBadge.tone} pulseDot={headerBadge.pulseDot}>
                  {headerBadge.label}
                </FlowNodeHeaderBadge>
              ) : (
                <span className="text-[10px] font-medium text-zinc-500">Off</span>
              )}
              {gate ? (
                <span className="text-[11px] leading-snug text-zinc-300">Gate open</span>
              ) : null}
            </div>
            {errorLine != null ? (
              <p className="mt-1 text-[10px] leading-snug text-rose-200/85">{errorLine}</p>
            ) : null}
          </div>
        ) : null}
        <InspectorCompactToggleRow
          label="Enable audio engine"
          hint="Enables the Web Audio output chain. Playback still requires Gate open."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <TRNButton
          size="compact"
          className="w-full border-rose-900/45 text-rose-100/90"
          hint="Turns off Gate on all audio nodes and mutes monitor paths immediately."
          onClick={() => muteAllAudio()}
        >
          Mute all audio
        </TRNButton>
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Playback"
        icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Gate routes wired or monitored audio to the device output."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Gate"
          hint="Fallback when the Gate input pin is unwired."
          checked={cfg.gate === true}
          disabled={isGateWired}
          onCheckedChange={(next) => onUpdateConfigField("gate", next)}
        />
        {wiredParts.length > 0 ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            {wiredParts.map((part, index) => (
              <span key={part}>
                {index > 0 ? <span> · </span> : null}
                <span className="font-medium text-zinc-400">{part}</span> is wired
              </span>
            ))}
            <span> — inspector defaults are overridden.</span>
          </p>
        ) : null}
        {wiredAudioBus ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            <span className="font-medium text-zinc-400">Audio</span> is wired — output follows the graph.
          </p>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Level"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Gain cap and limiter protect the device output."
        defaultExpanded
      >
        <InspectorNumericScrubRow
          label="Default gain"
          description="Used when the Gain input pin is unwired. Capped by Max gain."
          ariaLabel="Audio output default gain"
          value={gain}
          min={0}
          max={maxGain}
          step={0.01}
          fractionDigits={2}
          disabled={isGainWired}
          onCommit={(next) =>
            onUpdateConfigField("gain", clampAudioOutputGain(next, maxGain))
          }
        />
        <InspectorNumericScrubRow
          label="Max gain"
          description="Safety cap for output gain (0..1)."
          ariaLabel="Audio output max gain"
          value={maxGain}
          min={0}
          max={1}
          step={0.01}
          fractionDigits={2}
          onCommit={(next) => {
            const cappedMax = readAudioOutputMaxGain(next);
            onUpdateConfigField("maxGain", cappedMax);
            const storedGain = readFiniteNumber(cfg.gain, 0);
            if (storedGain > cappedMax) {
              onUpdateConfigField("gain", cappedMax);
            }
          }}
        />
        <InspectorCompactToggleRow
          label="Limiter enabled"
          hint="Conservative safety compressor on the master output."
          checked={limiterEnabled}
          onCheckedChange={(next) => onUpdateConfigField("limiterEnabled", next)}
        />
      </InspectorCollapsibleSection>

      <MonitorModeInspectorFields
        cfg={cfg}
        onUpdateConfigField={onUpdateConfigField}
        wiredAudioBus={wiredAudioBus}
      />
    </div>
  );
}

function applyAudioScopeThemePreset(
  onUpdateConfigField: NodeInspectorSettingsSectionProps["onUpdateConfigField"],
  preset: Exclude<AudioScopeThemePreset, "custom">,
): void {
  for (const [key, value] of Object.entries(audioScopeThemePresetFields(preset))) {
    onUpdateConfigField(key, value);
  }
}

export function AudioScopeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const edges = useFlowEditorStore((s) => s.edges);
  const display = useMemo(() => coerceAudioScopeDisplayConfig(cfg), [cfg]);

  const mode = typeof cfg.mode === "string" ? cfg.mode : "waveform";
  const fps = readFiniteNumber(cfg.fps, 30);
  const fftSize = clampAnalyserFftSize(readFiniteNumber(cfg.fftSize, 2048));
  const smoothing = readFiniteNumber(cfg.smoothing, 0.8);
  const isEnabledWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "enabled"),
    [edges, selectedNode.id],
  );
  const wiredAudioBus = edges.some(
    (e) => e.target === selectedNode.id && e.targetHandle === "audio",
  );

  const enabled = resolveAudioScopeEnabled(
    cfg,
    selectedNode.data.liveInputBooleanByHandle?.enabled,
    isEnabledWired,
  );
  const headerBadge = resolveAudioScopeHeaderBadge(enabled, mode);
  const wiredParts = audioScopeWiredInputParts({ isEnabledWired });

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Display"
        icon={<Monitor className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="On-card waveform/spectrum canvas. Disable to pause drawing."
        defaultExpanded
      >
        {enabled ? (
          <div className="mb-1 rounded border border-zinc-700/60 bg-zinc-950/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {headerBadge != null ? (
                <FlowNodeHeaderBadge tone={headerBadge.tone} pulseDot={headerBadge.pulseDot}>
                  {headerBadge.label}
                </FlowNodeHeaderBadge>
              ) : (
                <span className="text-[10px] font-medium text-zinc-500">Off</span>
              )}
              <span className="text-[11px] leading-snug text-zinc-300">
                {formatAudioScopeModeLabel(mode)}
              </span>
            </div>
          </div>
        ) : null}
        <InspectorCompactToggleRow
          label="Enabled"
          hint="Fallback when the Enabled input pin is unwired."
          checked={cfg.enabled !== false}
          disabled={isEnabledWired}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Mode</div>
          <InspectorSegmentButtonGroup
            ariaLabel="Audio scope mode"
            layout="row"
            value={mode}
            options={AUDIO_SCOPE_MODE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(next) => onUpdateConfigField("mode", next)}
          />
        </div>
        {wiredParts.length > 0 ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            {wiredParts.map((part, index) => (
              <span key={part}>
                {index > 0 ? <span> · </span> : null}
                <span className="font-medium text-zinc-400">{part}</span> is wired
              </span>
            ))}
            <span> — inspector defaults are overridden.</span>
          </p>
        ) : null}
        {wiredAudioBus ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            <span className="font-medium text-zinc-400">Audio</span> is wired — scope follows the graph.
          </p>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Analyser"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="FFT size and smoothing affect spectrum bars and waveform steadiness."
        defaultExpanded
      >
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
          options={ANALYSER_FFT_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(next) => onUpdateConfigField("fftSize", clampAnalyserFftSize(Number(next)))}
        />
        <InspectorNumericScrubRow
          label="Smoothing"
          description="Analyser smoothing time constant (0..1)."
          ariaLabel="Audio scope smoothing"
          value={Math.max(0, Math.min(1, smoothing))}
          step={0.01}
          fractionDigits={2}
          onCommit={(next) => onUpdateConfigField("smoothing", Math.max(0, Math.min(1, next)))}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Appearance"
        icon={<Palette className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Plot colors, grid, and trace styling (Plotter-style display controls)."
        defaultExpanded
      >
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Theme</div>
          <InspectorSegmentButtonGroup
            ariaLabel="Audio scope color theme"
            layout="grid-2"
            value={display.themePreset === "custom" ? "custom" : display.themePreset}
            options={[
              ...AUDIO_SCOPE_THEME_PRESETS.map((p) => ({
                value: p.id,
                label: p.label,
                hint: p.hint,
              })),
              {
                value: "custom",
                label: "Custom",
                hint: "Manual overrides — pick a preset to reset.",
              },
            ]}
            onChange={(next) => {
              if (next === "custom") {
                return;
              }
              applyAudioScopeThemePreset(
                onUpdateConfigField,
                next as Exclude<AudioScopeThemePreset, "custom">,
              );
            }}
          />
        </div>
        <InspectorColorRow
          label="Plot background"
          description="Canvas fill behind grid and traces."
          ariaLabel="Audio scope plot background"
          value={display.plotBackgroundHex}
          onChange={(next) => {
            onUpdateConfigField("plotBackgroundHex", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorColorRow
          label="Waveform color"
          ariaLabel="Audio scope waveform color"
          value={display.waveformColorHex}
          onChange={(next) => {
            onUpdateConfigField("waveformColorHex", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorNumericScrubRow
          label="Waveform width"
          ariaLabel="Audio scope waveform line width"
          value={display.waveformLineWidthPx}
          step={0.25}
          fractionDigits={2}
          onCommit={(next) => {
            onUpdateConfigField("waveformLineWidthPx", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorNumericScrubRow
          label="Waveform opacity"
          ariaLabel="Audio scope waveform stroke opacity"
          value={display.waveformStrokeOpacity}
          step={0.05}
          fractionDigits={2}
          onCommit={(next) => {
            onUpdateConfigField("waveformStrokeOpacity", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorNumericScrubRow
          label="Waveform gain"
          description="Vertical scale for the time-domain trace."
          ariaLabel="Audio scope waveform gain"
          value={display.waveformGain}
          step={0.1}
          fractionDigits={2}
          onCommit={(next) => {
            onUpdateConfigField("waveformGain", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorColorRow
          label="Spectrum color"
          ariaLabel="Audio scope spectrum bar color"
          value={display.spectrumColorHex}
          onChange={(next) => {
            onUpdateConfigField("spectrumColorHex", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorNumericScrubRow
          label="Spectrum opacity"
          ariaLabel="Audio scope spectrum fill opacity"
          value={display.spectrumFillOpacity}
          step={0.05}
          fractionDigits={2}
          onCommit={(next) => {
            onUpdateConfigField("spectrumFillOpacity", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorNumericScrubRow
          label="Spectrum gain"
          description="Bar height multiplier for FFT magnitudes."
          ariaLabel="Audio scope spectrum gain"
          value={display.spectrumGain}
          step={0.1}
          fractionDigits={2}
          onCommit={(next) => {
            onUpdateConfigField("spectrumGain", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorCompactToggleRow
          label="Show grid"
          hint="Time and level division lines on the plot."
          checked={display.showGrid}
          onCheckedChange={(next) => {
            onUpdateConfigField("showGrid", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorNumericScrubRow
          label="Time divisions"
          description="Vertical grid lines across the plot width."
          ariaLabel="Audio scope time divisions"
          value={display.timeDivisions}
          step={1}
          disabled={!display.showGrid}
          onCommit={(next) => {
            onUpdateConfigField("timeDivisions", Math.round(next));
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorNumericScrubRow
          label="Spectrum bars"
          description="Number of FFT bars (16..128)."
          ariaLabel="Audio scope spectrum bar count"
          value={display.freqBarCount}
          step={8}
          onCommit={(next) => {
            onUpdateConfigField("freqBarCount", Math.round(next));
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorCompactToggleRow
          label="Center line"
          hint="Horizontal zero reference for waveform mode."
          checked={display.showCenterLine}
          onCheckedChange={(next) => {
            onUpdateConfigField("showCenterLine", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
        <InspectorCompactToggleRow
          label="Plot frame"
          hint="Border drawn on the canvas (not the card chrome)."
          checked={display.showFrame}
          onCheckedChange={(next) => {
            onUpdateConfigField("showFrame", next);
            onUpdateConfigField("themePreset", "custom");
          }}
        />
      </InspectorCollapsibleSection>

      <MonitorModeInspectorFields
        cfg={cfg}
        onUpdateConfigField={onUpdateConfigField}
        wiredAudioBus={wiredAudioBus}
      />
    </div>
  );
}

export function AudioFilePlayerSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const edges = useFlowEditorStore((s) => s.edges);

  const enabled = cfg.enabled === true;
  const url = typeof cfg.url === "string" ? cfg.url : "";
  const loop = cfg.loop === true;
  const gain = readFiniteNumber(cfg.gain, 0.5);

  const runtime = useFilePlayerRuntimeUi(selectedNode.id);
  const transport = useFilePlayerTransportUi(selectedNode.id);
  const isGateWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gate"),
    [edges, selectedNode.id],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gain"),
    [edges, selectedNode.id],
  );

  const gate = resolveFilePlayerGate(
    cfg,
    selectedNode.data.liveInputBooleanByHandle?.gate,
    isGateWired,
  );
  const headerBadge = resolveFilePlayerHeaderBadge(
    runtime,
    enabled,
    gate,
    transport.playing,
  );
  const errorLine = filePlayerCardErrorLine(runtime);
  const wiredParts = filePlayerWiredInputParts({ isGateWired, isGainWired });
  const transportClock = formatFilePlayerTransportClock(transport.timeS, transport.durationS);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Source"
        icon={<FileAudio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Fetches and decodes an audio file from a URL when enabled."
        defaultExpanded
      >
        {enabled ? (
          <div className="mb-1 rounded border border-zinc-700/60 bg-zinc-950/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {headerBadge != null ? (
                <FlowNodeHeaderBadge tone={headerBadge.tone} pulseDot={headerBadge.pulseDot}>
                  {headerBadge.label}
                </FlowNodeHeaderBadge>
              ) : (
                <span className="text-[10px] font-medium text-zinc-500">Idle</span>
              )}
              {gate || transport.durationS > 0 ? (
                <span className="text-[11px] leading-snug text-zinc-300">{transportClock}</span>
              ) : null}
            </div>
            {errorLine != null ? (
              <p className="mt-1 text-[10px] leading-snug text-rose-200/85">{errorLine}</p>
            ) : null}
          </div>
        ) : null}
        <InspectorCompactToggleRow
          label="Enabled"
          hint="When enabled, the node can load and decode the audio file."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
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

      <InspectorCollapsibleSection
        title="Playback"
        icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Gate starts and stops transport. Loop repeats the decoded buffer."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Gate"
          hint="Fallback when the Gate input pin is unwired."
          checked={cfg.gate === true}
          disabled={isGateWired}
          onCheckedChange={(next) => onUpdateConfigField("gate", next)}
        />
        <InspectorCompactToggleRow
          label="Loop"
          hint="When enabled, the decoded buffer loops continuously."
          checked={loop}
          onCheckedChange={(next) => onUpdateConfigField("loop", next)}
        />
        {wiredParts.length > 0 ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            {wiredParts.map((part, index) => (
              <span key={part}>
                {index > 0 ? <span> · </span> : null}
                <span className="font-medium text-zinc-400">{part}</span> is wired
              </span>
            ))}
            <span> — inspector defaults are overridden.</span>
          </p>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Level"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Output gain when the Gain input pin is unwired."
        defaultExpanded
      >
        <InspectorNumericScrubRow
          label="Default gain"
          description="Used when Gain input pin is unwired."
          ariaLabel="Audio file default gain"
          value={gain}
          step={0.01}
          fractionDigits={2}
          disabled={isGainWired}
          onCommit={(next) => onUpdateConfigField("gain", next)}
        />
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
  const sweepCurve = cfg.sweepCurve === "log" ? "log" : "linear";
  const sweepDirection =
    cfg.sweepDirection === "up" || cfg.sweepDirection === "down"
      ? cfg.sweepDirection
      : "up-down";
  const sweepMode = cfg.sweepMode === "once" ? "once" : "loop";
  const gain = readFiniteNumber(cfg.gain, 0);
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

  const gate = resolveOscillatorGate(
    cfg,
    selectedNode.data.liveInputBooleanByHandle?.gate,
    isGateWired,
  );
  const headerBadge = resolveOscillatorHeaderBadge(gate);
  const levelLive = formatOscillatorLiveScalar(selectedNode.data.liveNumberByHandle?.level);
  const wiredParts = oscillatorWiredInputParts({ isFreqWired, isGainWired, isGateWired });

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Playback"
        icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Gate opens the tone path. Requires Audio Output enabled to hear playback on device speakers."
        defaultExpanded
      >
        {gate ? (
          <div className="mb-1 rounded border border-zinc-700/60 bg-zinc-950/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {headerBadge != null ? (
                <FlowNodeHeaderBadge tone={headerBadge.tone} pulseDot={headerBadge.pulseDot}>
                  {headerBadge.label}
                </FlowNodeHeaderBadge>
              ) : null}
              <span className="text-[11px] leading-snug text-zinc-300">Level {levelLive}</span>
            </div>
          </div>
        ) : null}
        <InspectorCompactToggleRow
          label="Gate"
          hint="Fallback when the Gate input pin is unwired."
          checked={cfg.gate === true}
          disabled={isGateWired}
          onCheckedChange={(next) => onUpdateConfigField("gate", next)}
        />
        {wiredParts.length > 0 ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            {wiredParts.map((part, index) => (
              <span key={part}>
                {index > 0 ? <span> · </span> : null}
                <span className="font-medium text-zinc-400">{part}</span> is wired
              </span>
            ))}
            <span> — inspector defaults are overridden.</span>
          </p>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Tone"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Waveform and level when input pins are unwired."
        defaultExpanded
      >
        <InspectorSelectRow
          label="Waveform"
          ariaLabel="Oscillator waveform"
          value={waveform}
          options={OSCILLATOR_WAVEFORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(next) => onUpdateConfigField("waveform", next)}
        />
        <InspectorNumericScrubRow
          label="Frequency (Hz)"
          description="Used when the Freq input pin is unwired and Sweep is off."
          ariaLabel="Oscillator frequency"
          value={freqHz}
          step={1}
          disabled={isFreqWired}
          onCommit={(next) => onUpdateConfigField("freqHz", Math.max(0, next))}
        />
        <InspectorNumericScrubRow
          label="Gain"
          ariaLabel="Oscillator gain"
          value={gain}
          step={0.01}
          fractionDigits={2}
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
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Sweep"
        icon={<Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Frequency sweep when the Freq input pin is unwired."
        defaultExpanded={sweepEnabled}
      >
        <InspectorCompactToggleRow
          label="Sweep enabled"
          hint="Sweeps between Start and End at the chosen period when Freq is unwired."
          checked={sweepEnabled}
          disabled={isFreqWired}
          onCheckedChange={(next) => onUpdateConfigField("sweepEnabled", next)}
        />
        <div className="grid grid-cols-2 gap-2">
          <InspectorNumericScrubRow
            label="Start (Hz)"
            ariaLabel="Oscillator sweep start frequency"
            value={sweepStartHz}
            step={1}
            disabled={isFreqWired}
            onCommit={(next) => onUpdateConfigField("sweepStartHz", Math.max(0, next))}
          />
          <InspectorNumericScrubRow
            label="End (Hz)"
            ariaLabel="Oscillator sweep end frequency"
            value={sweepEndHz}
            step={1}
            disabled={isFreqWired}
            onCommit={(next) => onUpdateConfigField("sweepEndHz", Math.max(0, next))}
          />
        </div>
        <InspectorSelectRow
          label="Curve"
          description="Log sounds more musical for wide pitch sweeps."
          ariaLabel="Oscillator sweep curve"
          value={sweepCurve}
          options={[
            { value: "linear", label: "Linear" },
            { value: "log", label: "Log" },
          ]}
          disabled={isFreqWired}
          onChange={(next) => onUpdateConfigField("sweepCurve", next)}
        />
        <InspectorSelectRow
          label="Direction"
          ariaLabel="Oscillator sweep direction"
          value={sweepDirection}
          options={[
            { value: "up-down", label: "Up + down" },
            { value: "up", label: "Up" },
            { value: "down", label: "Down" },
          ]}
          disabled={isFreqWired}
          onChange={(next) => onUpdateConfigField("sweepDirection", next)}
        />
        <InspectorSelectRow
          label="Mode"
          ariaLabel="Oscillator sweep mode"
          value={sweepMode}
          options={[
            { value: "loop", label: "Loop" },
            { value: "once", label: "One-shot (Gate on)" },
          ]}
          disabled={isFreqWired}
          onChange={(next) => onUpdateConfigField("sweepMode", next)}
        />
        <InspectorNumericScrubRow
          label="Period (s)"
          description={
            sweepMode === "once"
              ? "Duration for one-shot sweeps, or one full cycle when looping up+down."
              : "Seconds for a full sweep cycle."
          }
          ariaLabel="Oscillator sweep period seconds"
          value={sweepPeriodS}
          step={0.25}
          disabled={isFreqWired}
          onCommit={(next) => onUpdateConfigField("sweepPeriodS", Math.max(0.25, next))}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function AudioSfxSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, patchSelectedNodeConfigFields } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const presetId = readAudioSfxPresetId(cfg.preset);
  const enabled = cfg.enabled !== false;
  const gain = readFiniteNumber(cfg.gain, 0.12);
  const durationS = readFiniteNumber(cfg.durationS, 1.8);
  const startHz = readFiniteNumber(cfg.startHz, 120);
  const endHz = readFiniteNumber(cfg.endHz, 4800);
  const attackMs = readFiniteNumber(cfg.attackMs, 40);
  const releaseMs = readFiniteNumber(cfg.releaseMs, 180);
  const fireSfx = useFlowEditorStore((s) => s.fireAudioSfxNode);
  const playing = selectedNode.data.liveBooleanByHandle?.playing === true;

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Playback"
        icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="One-shot effects fire on Trigger rising edge or the card Fire button."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Enabled"
          hint="Disabled nodes ignore Trigger and Fire."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <TRNButton
          size="compact"
          className="w-full"
          hint="Preview the current preset once (requires audio engine running via Audio Output)."
          disabled={!enabled}
          onClick={() => fireSfx(selectedNode.id)}
        >
          Fire preview
        </TRNButton>
        {playing ? (
          <p className="text-[11px] leading-snug text-zinc-400">Playing…</p>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Preset"
        icon={<Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Starter patches for risers, drops, sirens, beeps, and noise bursts."
        defaultExpanded
      >
        <InspectorSelectRow
          label="Preset"
          ariaLabel="Audio SFX preset"
          value={presetId}
          options={AUDIO_SFX_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          onChange={(next) => {
            const preset = AUDIO_SFX_PRESETS.find((p) => p.id === next);
            if (preset == null) {
              onUpdateConfigField("preset", next);
              return;
            }
            patchSelectedNodeConfigFields(applyAudioSfxPresetToConfig(preset));
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Shape"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Tune pitch motion and envelope after choosing a preset."
        defaultExpanded
      >
        <div className="grid grid-cols-2 gap-2">
          <InspectorNumericScrubRow
            label="Start (Hz)"
            ariaLabel="Audio SFX start frequency"
            value={startHz}
            step={1}
            onCommit={(next) => onUpdateConfigField("startHz", Math.max(1, next))}
          />
          <InspectorNumericScrubRow
            label="End (Hz)"
            ariaLabel="Audio SFX end frequency"
            value={endHz}
            step={1}
            onCommit={(next) => onUpdateConfigField("endHz", Math.max(1, next))}
          />
        </div>
        <InspectorNumericScrubRow
          label="Duration (s)"
          ariaLabel="Audio SFX duration seconds"
          value={durationS}
          step={0.05}
          fractionDigits={2}
          onCommit={(next) => onUpdateConfigField("durationS", Math.max(0.05, next))}
        />
        <InspectorNumericScrubRow
          label="Gain"
          ariaLabel="Audio SFX gain"
          value={gain}
          step={0.01}
          fractionDigits={2}
          onCommit={(next) => onUpdateConfigField("gain", Math.max(0, Math.min(1, next)))}
        />
        <div className="grid grid-cols-2 gap-2">
          <InspectorNumericScrubRow
            label="Attack (ms)"
            ariaLabel="Audio SFX attack milliseconds"
            value={attackMs}
            step={1}
            onCommit={(next) => onUpdateConfigField("attackMs", Math.max(1, Math.round(next)))}
          />
          <InspectorNumericScrubRow
            label="Release (ms)"
            ariaLabel="Audio SFX release milliseconds"
            value={releaseMs}
            step={1}
            onCommit={(next) => onUpdateConfigField("releaseMs", Math.max(10, Math.round(next)))}
          />
        </div>
      </InspectorCollapsibleSection>
    </div>
  );
}

export function AudioMachineSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, patchSelectedNodeConfigFields } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const edges = useFlowEditorStore((s) => s.edges);
  const enabled = cfg.enabled !== false;
  const presetId = readMotorPresetId(cfg.preset);
  const speed = readFiniteNumber(cfg.speed, 0.35);
  const load = readFiniteNumber(cfg.load, 0.25);
  const gain = readFiniteNumber(cfg.gain, 0.1);
  const whineBaseHz = readFiniteNumber(cfg.whineBaseHz, 80);
  const whineSpanHz = readFiniteNumber(cfg.whineSpanHz, 1200);
  const harmonicMix = readFiniteNumber(cfg.harmonicMix, 0.15);
  const rippleMix = readFiniteNumber(cfg.rippleMix, 0.22);
  const noiseMix = readFiniteNumber(cfg.noiseMix, 0.05);

  const isSpeedWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "speed"),
    [edges, selectedNode.id],
  );
  const isLoadWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "load"),
    [edges, selectedNode.id],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === selectedNode.id && e.targetHandle === "gain"),
    [edges, selectedNode.id],
  );

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Drive"
        icon={<Radio className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Speed and Load scalars modulate whine pitch and brightness. Wire pins for live telemetry."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Enabled"
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorNumericScrubRow
          label="Speed"
          description="0..1 when unwired. Primary RPM proxy."
          ariaLabel="Audio machine speed"
          value={speed}
          step={0.01}
          fractionDigits={2}
          disabled={isSpeedWired}
          onCommit={(next) => onUpdateConfigField("speed", Math.max(0, Math.min(1, next)))}
        />
        <InspectorNumericScrubRow
          label="Load"
          description="0..1 stress / brightness when unwired."
          ariaLabel="Audio machine load"
          value={load}
          step={0.01}
          fractionDigits={2}
          disabled={isLoadWired}
          onCommit={(next) => onUpdateConfigField("load", Math.max(0, Math.min(1, next)))}
        />
        {(isSpeedWired || isLoadWired || isGainWired) ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            Wired pins override inspector defaults.
          </p>
        ) : null}
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Motor preset"
        icon={<Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="v0.2a — Motor family. Engine, drone, and machine families are planned."
        defaultExpanded
      >
        <InspectorSelectRow
          label="Preset"
          ariaLabel="Audio machine motor preset"
          value={presetId}
          options={MOTOR_MACHINE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          onChange={(next) => {
            const preset = MOTOR_MACHINE_PRESETS.find((p) => p.id === next);
            if (preset == null) {
              onUpdateConfigField("preset", next);
              return;
            }
            patchSelectedNodeConfigFields(applyMotorPresetToConfig(preset));
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Motor layers"
        icon={<Waves className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Whine pitch range and layer mix for the motor recipe."
        defaultExpanded={false}
      >
        <div className="grid grid-cols-2 gap-2">
          <InspectorNumericScrubRow
            label="Base (Hz)"
            ariaLabel="Motor whine base Hz"
            value={whineBaseHz}
            step={1}
            onCommit={(next) => onUpdateConfigField("whineBaseHz", Math.max(20, next))}
          />
          <InspectorNumericScrubRow
            label="Span (Hz)"
            ariaLabel="Motor whine span Hz"
            value={whineSpanHz}
            step={10}
            onCommit={(next) => onUpdateConfigField("whineSpanHz", Math.max(0, next))}
          />
        </div>
        <InspectorNumericScrubRow
          label="Gain"
          ariaLabel="Audio machine gain"
          value={gain}
          step={0.01}
          fractionDigits={2}
          disabled={isGainWired}
          onCommit={(next) => onUpdateConfigField("gain", Math.max(0, Math.min(1, next)))}
        />
        <InspectorNumericScrubRow
          label="Harmonic mix"
          ariaLabel="Motor harmonic mix"
          value={harmonicMix}
          step={0.01}
          fractionDigits={2}
          onCommit={(next) => onUpdateConfigField("harmonicMix", Math.max(0, Math.min(1, next)))}
        />
        <InspectorNumericScrubRow
          label="Ripple mix"
          ariaLabel="Motor ripple mix"
          value={rippleMix}
          step={0.01}
          fractionDigits={2}
          onCommit={(next) => onUpdateConfigField("rippleMix", Math.max(0, Math.min(1, next)))}
        />
        <InspectorNumericScrubRow
          label="Noise mix"
          ariaLabel="Motor noise mix"
          value={noiseMix}
          step={0.01}
          fractionDigits={2}
          onCommit={(next) => onUpdateConfigField("noiseMix", Math.max(0, Math.min(1, next)))}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

