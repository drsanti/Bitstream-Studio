import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { clampAnalyserFftSize } from "../../../../core/audio/clamp-analyser-fft-size";
import { resolveAudioSinkSourceNodeId } from "../../../../core/audio/resolve-audio-monitor-source";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  applyAudioSfxPresetToConfig,
  AUDIO_SFX_PRESETS,
  readAudioSfxPresetId,
} from "../../../../core/audio/audio-sfx-config";
import { TRNButton, TRNSelect, TRNToggleSwitch, type TRNSelectOption } from "../../../../../ui/TRN";
import { InspectorSegmentButtonGroup } from "../../components/inspector/InspectorSegmentButtonGroup";
import { FlowCardScrubNumberField } from "../flow-node/FlowCardScrubNumberField";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { coerceAudioScopeDisplayConfig } from "./audio-scope-display-config";
import { AudioScopeCanvas } from "./AudioScopeCanvas";
import {
  FLOW_NODE_BODY_PANEL_CLASS,
  widestTrnSelectOptionLabel,
} from "../flow-node/flow-node-intrinsic-width-utils";
import { FLOW_NODE_TRN_SELECT_CLASS } from "../flow-node/flow-node-trn-select-layout";
import {
  audioOutputCardErrorLine,
  audioOutputWiredInputParts,
  clampAudioOutputGain,
  readAudioOutputMaxGain,
  useAudioOutputRuntimeUi,
} from "./audio-output-chrome";
import {
  AUDIO_SCOPE_MODE_CARD_SEGMENT_OPTIONS,
  audioScopeWiredInputParts,
  resolveAudioScopeEnabled,
} from "./audio-scope-chrome";
import {
  filePlayerCardErrorLine,
  filePlayerWiredInputParts,
  useFilePlayerRuntimeUi,
} from "./audio-file-player-chrome";
import {
  OSCILLATOR_WAVEFORM_OPTIONS,
  oscillatorWiredInputParts,
} from "./audio-oscillator-chrome";
import { machineWiredInputParts } from "./audio-machine-chrome";
import { sfxWiredInputParts } from "./audio-sfx-chrome";
import {
  applyMotorPresetToConfig,
  MOTOR_MACHINE_PRESETS,
  readMotorPresetId,
} from "../../../../core/audio/audio-machine-config";
import {
  micInputCardErrorLine,
  useMicInputRuntimeUi,
} from "./mic-input-chrome";

function readBool(dc: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = dc[key];
  return typeof v === "boolean" ? v : fallback;
}

function readString(dc: Record<string, unknown>, key: string, fallback: string): string {
  const v = dc[key];
  return typeof v === "string" ? v : fallback;
}

function WiredOverrideHint(props: { parts: string[] }) {
  const { parts } = props;
  if (parts.length === 0) {
    return null;
  }
  return (
    <p className="text-[10px] leading-snug text-zinc-500">
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 ? <span> · </span> : null}
          <span className="font-medium text-zinc-400">{part}</span> is wired
        </span>
      ))}
      <span> — card controls are overridden.</span>
    </p>
  );
}

export function MicInputNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", false);
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const runtime = useMicInputRuntimeUi(nodeId);
  const errorLine = micInputCardErrorLine(runtime, enabled);

  return (
    <div
      className={twMerge(
        "nodrag nopan space-y-1.5 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={["Capture"]} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Capture
        </span>
        <TRNToggleSwitch
          checked={enabled}
          ariaLabel="Enable microphone capture"
          onCheckedChange={(next) => update(nodeId, "enabled", next)}
        />
      </div>
      {errorLine != null ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{errorLine}</div>
      ) : null}
    </div>
  );
}

export function AudioOutputNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", false);
  const gate = readBool(defaultConfig, "gate", false);
  const maxGain = readAudioOutputMaxGain(defaultConfig.maxGain);
  const gain = clampAudioOutputGain(defaultConfig.gain, maxGain);
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const edges = useFlowEditorStore((s) => s.edges);
  const runtime = useAudioOutputRuntimeUi();
  const errorLine = audioOutputCardErrorLine(runtime);

  const isGateWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gate"),
    [edges, nodeId],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gain"),
    [edges, nodeId],
  );

  const wiredParts = audioOutputWiredInputParts({ isGateWired, isGainWired });

  return (
    <div
      className={twMerge(
        "nodrag nopan space-y-1.5 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={["Engine", "Gate", "Gain"]} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Engine
        </span>
        <TRNToggleSwitch
          checked={enabled}
          ariaLabel="Enable audio engine"
          onCheckedChange={(next) => update(nodeId, "enabled", next)}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Gate
        </span>
        <TRNToggleSwitch
          checked={gate}
          ariaLabel="Audio output gate"
          disabled={isGateWired}
          onCheckedChange={(next) => update(nodeId, "gate", next)}
        />
      </div>
      {!isGainWired ? (
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Gain</div>
          <FlowCardScrubNumberField
            ariaLabel="Audio output gain"
            className="w-full"
            value={gain}
            min={0}
            max={maxGain}
            step={0.01}
            fractionDigits={2}
            onCommit={(next) => update(nodeId, "gain", clampAudioOutputGain(next, maxGain))}
          />
        </div>
      ) : null}
      <WiredOverrideHint parts={wiredParts} />
      {errorLine != null ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{errorLine}</div>
      ) : null}
    </div>
  );
}

export function AudioScopeNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const configEnabled = defaultConfig.enabled !== false;
  const mode = typeof defaultConfig.mode === "string" ? defaultConfig.mode : "waveform";
  const fpsRaw = typeof defaultConfig.fps === "number" ? defaultConfig.fps : 30;
  const fps = Number.isFinite(fpsRaw) ? Math.max(5, Math.min(60, Math.round(fpsRaw))) : 30;
  const fftSizeRaw =
    typeof defaultConfig.fftSize === "number" ? defaultConfig.fftSize : Number(defaultConfig.fftSize);
  const fftSize = Number.isFinite(fftSizeRaw) ? clampAnalyserFftSize(fftSizeRaw) : 2048;
  const smoothingRaw =
    typeof defaultConfig.smoothing === "number"
      ? defaultConfig.smoothing
      : Number(defaultConfig.smoothing);
  const smoothing = Number.isFinite(smoothingRaw) ? Math.max(0, Math.min(1, smoothingRaw)) : 0.8;
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const nodeData = useFlowEditorStore((s) => {
    const n = s.nodes.find((x) => x.id === nodeId);
    return n?.type === "studio" ? n.data : null;
  });

  const isEnabledWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "enabled"),
    [edges, nodeId],
  );
  const enabled = resolveAudioScopeEnabled(
    defaultConfig,
    nodeData?.liveInputBooleanByHandle?.enabled,
    isEnabledWired,
  );
  const wiredParts = audioScopeWiredInputParts({ isEnabledWired });
  const display = useMemo(
    () => coerceAudioScopeDisplayConfig(defaultConfig),
    [defaultConfig],
  );

  const sourceNodeId = useMemo(
    () =>
      resolveAudioSinkSourceNodeId({
        sinkNodeId: nodeId,
        cfg: defaultConfig,
        nodes,
        edges,
      }),
    [defaultConfig, edges, nodeId, nodes],
  );

  const sourceKind = useMemo((): "mic" | "osc" | "file" | "sfx" | "machine" | "unknown" => {
    if (sourceNodeId == null) return "unknown";
    const n = nodes.find((x) => x.id === sourceNodeId);
    if (n?.type !== "studio") return "unknown";
    if (n.data.nodeId === "mic-input") return "mic";
    if (n.data.nodeId === "audio-oscillator") return "osc";
    if (n.data.nodeId === "audio-file-player") return "file";
    if (n.data.nodeId === "audio-sfx") return "sfx";
    if (n.data.nodeId === "audio-machine") return "machine";
    return "unknown";
  }, [nodes, sourceNodeId]);

  return (
    <div className="nodrag nopan flex min-h-0 w-full max-w-full flex-1 flex-col">
      <div
        className={twMerge(
          "relative shrink-0 space-y-1.5 border-t border-zinc-800/55 px-2.5 py-2",
          FLOW_NODE_BODY_PANEL_CLASS,
        )}
        data-flow-node-body-panel
        data-flow-node-intrinsic-extra-px={96}
      >
        <FlowNodeIntrinsicWidthMarker
          labels={[
            "Display",
            ...AUDIO_SCOPE_MODE_CARD_SEGMENT_OPTIONS.map((o) => o.label),
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Display
          </span>
          <TRNToggleSwitch
            checked={configEnabled}
            ariaLabel="Enable audio scope display"
            disabled={isEnabledWired}
            onCheckedChange={(next) => update(nodeId, "enabled", next)}
          />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Mode</div>
          <InspectorSegmentButtonGroup
            ariaLabel="Scope mode"
            layout="row"
            value={mode}
            options={AUDIO_SCOPE_MODE_CARD_SEGMENT_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              hint: o.hint,
            }))}
            onChange={(next) => update(nodeId, "mode", next)}
          />
        </div>
        <WiredOverrideHint parts={wiredParts} />
      </div>
      <ReadingPanel className="nodrag mt-0 flex h-full min-h-[120px] min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent px-2.5 pb-2.5 pt-1.5 shadow-none ring-0">
        <AudioScopeCanvas
          className="relative box-border min-h-[120px] min-w-0 h-full w-full flex-1 basis-0 overflow-hidden self-stretch"
          enabled={enabled}
          mode={mode}
          fps={fps}
          fftSize={fftSize}
          smoothing={smoothing}
          sourceNodeId={sourceNodeId}
          sourceKind={sourceKind}
          display={display}
        />
      </ReadingPanel>
    </div>
  );
}

export function AudioFilePlayerNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", false);
  const gate = readBool(defaultConfig, "gate", false);
  const loop = readBool(defaultConfig, "loop", false);
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const edges = useFlowEditorStore((s) => s.edges);
  const runtime = useFilePlayerRuntimeUi(nodeId);
  const errorLine = filePlayerCardErrorLine(runtime);

  const isGateWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gate"),
    [edges, nodeId],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gain"),
    [edges, nodeId],
  );
  const wiredParts = filePlayerWiredInputParts({ isGateWired, isGainWired });

  return (
    <div
      className={twMerge(
        "nodrag nopan space-y-1.5 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={["Source", "Playback", "Loop"]} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Source
        </span>
        <TRNToggleSwitch
          checked={enabled}
          ariaLabel="Enable audio file source"
          onCheckedChange={(next) => update(nodeId, "enabled", next)}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Playback
        </span>
        <TRNToggleSwitch
          checked={gate}
          ariaLabel="Audio file gate playback"
          disabled={isGateWired}
          onCheckedChange={(next) => update(nodeId, "gate", next)}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Loop
        </span>
        <TRNToggleSwitch
          checked={loop}
          ariaLabel="Audio file loop playback"
          onCheckedChange={(next) => update(nodeId, "loop", next)}
        />
      </div>
      <WiredOverrideHint parts={wiredParts} />
      {errorLine != null ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{errorLine}</div>
      ) : null}
    </div>
  );
}

export function AudioOscillatorNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const edges = useFlowEditorStore((s) => s.edges);
  const waveform = readString(defaultConfig, "waveform", "sine");
  const gate = readBool(defaultConfig, "gate", false);
  const freqHz = Number(defaultConfig.freqHz ?? 440);
  const gain = Number(defaultConfig.gain ?? 0);

  const waveformOptions: TRNSelectOption[] = OSCILLATOR_WAVEFORM_OPTIONS.map((o) => ({
    value: o.value,
    label: o.value === "sawtooth" ? "Saw" : o.label,
  }));

  const clampNum = (n: number, fallback: number) => (Number.isFinite(n) ? n : fallback);
  const f = Math.max(0, clampNum(freqHz, 440));
  const g = Math.max(0, Math.min(1, clampNum(gain, 0)));

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

  const wiredParts = oscillatorWiredInputParts({ isFreqWired, isGainWired, isGateWired });
  const showFreqGain = !isFreqWired || !isGainWired;

  return (
    <div
      className={twMerge(
        "nodrag nopan space-y-2 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker
        labels={[
          "Playback",
          "Waveform",
          widestTrnSelectOptionLabel(waveformOptions),
          "Freq (Hz)",
        ]}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Playback
        </span>
        <TRNToggleSwitch
          checked={gate}
          ariaLabel="Oscillator gate playback"
          disabled={isGateWired}
          onCheckedChange={(next) => update(nodeId, "gate", next)}
        />
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-medium text-zinc-500">Waveform</div>
        <TRNSelect
          ariaLabel="Oscillator waveform"
          value={waveform}
          options={waveformOptions}
          onValueChange={(next) => update(nodeId, "waveform", next)}
          size="sm"
          sectionTitle="Waveform"
          className={FLOW_NODE_TRN_SELECT_CLASS}
          buttonClassName="w-full min-w-0 max-w-full"
        />
      </div>
      {showFreqGain ? (
        <div className="grid grid-cols-2 gap-2">
          {!isFreqWired ? (
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-zinc-500">Freq (Hz)</div>
              <FlowCardScrubNumberField
                ariaLabel="Oscillator frequency"
                className="w-full"
                value={f}
                min={0}
                step={1}
                fractionDigits={0}
                onCommit={(next) => update(nodeId, "freqHz", next)}
              />
            </div>
          ) : null}
          {!isGainWired ? (
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-zinc-500">Gain</div>
              <FlowCardScrubNumberField
                ariaLabel="Oscillator gain"
                className="w-full"
                value={g}
                min={0}
                max={1}
                step={0.01}
                fractionDigits={2}
                onCommit={(next) => update(nodeId, "gain", next)}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <WiredOverrideHint parts={wiredParts} />
    </div>
  );
}

export function AudioSfxNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const fireSfx = useFlowEditorStore((s) => s.fireAudioSfxNode);
  const edges = useFlowEditorStore((s) => s.edges);
  const nodeData = useFlowEditorStore((s) => {
    const n = s.nodes.find((x) => x.id === nodeId);
    return n?.type === "studio" ? n.data : null;
  });
  const enabled = defaultConfig.enabled !== false;
  const presetId = readAudioSfxPresetId(defaultConfig.preset);
  const playing = nodeData?.liveBooleanByHandle?.playing === true;

  const presetOptions: TRNSelectOption[] = AUDIO_SFX_PRESETS.map((p) => ({
    value: p.id,
    label: p.label,
  }));

  const isTriggerWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "trigger"),
    [edges, nodeId],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gain"),
    [edges, nodeId],
  );
  const wiredParts = sfxWiredInputParts({ isTriggerWired, isGainWired });

  return (
    <div
      className={twMerge(
        "nodrag nopan space-y-2 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={["Preset", "Fire", ...presetOptions.map((o) => o.label)]} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Enabled
        </span>
        <TRNToggleSwitch
          checked={enabled}
          ariaLabel="Enable audio SFX node"
          onCheckedChange={(next) => update(nodeId, "enabled", next)}
        />
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-medium text-zinc-500">Preset</div>
        <TRNSelect
          ariaLabel="Audio SFX preset"
          value={presetId}
          options={presetOptions}
          onValueChange={(next) => {
            const preset = AUDIO_SFX_PRESETS.find((p) => p.id === next);
            if (preset == null) {
              update(nodeId, "preset", next);
              return;
            }
            for (const [key, value] of Object.entries(applyAudioSfxPresetToConfig(preset))) {
              update(nodeId, key, value);
            }
          }}
          size="sm"
          sectionTitle="Preset"
          className={FLOW_NODE_TRN_SELECT_CLASS}
          buttonClassName="w-full min-w-0 max-w-full"
        />
      </div>
      <TRNButton
        size="compact"
        className="w-full"
        hint="Fire a one-shot preview of the preset."
        disabled={!enabled}
        onClick={() => fireSfx(nodeId)}
      >
        {playing ? "Playing…" : "Fire"}
      </TRNButton>
      <WiredOverrideHint parts={wiredParts} />
    </div>
  );
}

export function AudioMachineNodePanel(props: { nodeId: string; defaultConfig: Record<string, unknown> }) {
  const { nodeId, defaultConfig } = props;
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const edges = useFlowEditorStore((s) => s.edges);
  const enabled = defaultConfig.enabled !== false;
  const presetId = readMotorPresetId(defaultConfig.preset);
  const speedRaw = typeof defaultConfig.speed === "number" ? defaultConfig.speed : Number(defaultConfig.speed);
  const speed = Number.isFinite(speedRaw) ? speedRaw : 0.35;

  const presetOptions: TRNSelectOption[] = MOTOR_MACHINE_PRESETS.map((p) => ({
    value: p.id,
    label: p.label,
  }));

  const isSpeedWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "speed"),
    [edges, nodeId],
  );
  const isLoadWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "load"),
    [edges, nodeId],
  );
  const isGainWired = useMemo(
    () => edges.some((e) => e.target === nodeId && e.targetHandle === "gain"),
    [edges, nodeId],
  );
  const wiredParts = machineWiredInputParts({ isSpeedWired, isLoadWired, isGainWired });

  return (
    <div
      className={twMerge(
        "nodrag nopan space-y-2 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={["Preset", "Speed", ...presetOptions.map((o) => o.label)]} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Enabled
        </span>
        <TRNToggleSwitch
          checked={enabled}
          ariaLabel="Enable audio machine node"
          onCheckedChange={(next) => update(nodeId, "enabled", next)}
        />
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-medium text-zinc-500">Preset</div>
        <TRNSelect
          ariaLabel="Audio machine motor preset"
          value={presetId}
          options={presetOptions}
          onValueChange={(next) => {
            const preset = MOTOR_MACHINE_PRESETS.find((p) => p.id === next);
            if (preset == null) {
              update(nodeId, "preset", next);
              return;
            }
            for (const [key, value] of Object.entries(applyMotorPresetToConfig(preset))) {
              update(nodeId, key, value);
            }
          }}
          size="sm"
          sectionTitle="Preset"
          className={FLOW_NODE_TRN_SELECT_CLASS}
          buttonClassName="w-full min-w-0 max-w-full"
        />
      </div>
      {!isSpeedWired ? (
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-zinc-500">Speed</div>
          <FlowCardScrubNumberField
            ariaLabel="Audio machine speed"
            className="w-full"
            value={speed}
            min={0}
            max={1}
            step={0.01}
            fractionDigits={2}
            onCommit={(next) => update(nodeId, "speed", next)}
          />
        </div>
      ) : null}
      <WiredOverrideHint parts={wiredParts} />
    </div>
  );
}
