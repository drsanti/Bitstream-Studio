import { resolveMotorRippleHz } from "./audio-machine-speed";
import type { SweepCurve, SweepDirection } from "./oscillator-sweep";
import { interpolateSweepHz } from "./oscillator-sweep";
import { clampAnalyserFftSize } from "./clamp-analyser-fft-size";

export type StudioAudioStartResult =
  | { ok: true }
  | { ok: false; reason: "no-window" | "unsupported" | "permission-denied" | "error"; message: string };

type MicState = {
  enabled: boolean;
  status: "idle" | "requesting" | "active" | "denied" | "error";
  errorMessage?: string;
  deviceId: string;
  stream?: MediaStream;
  source?: MediaStreamAudioSourceNode;
  monitorGain?: GainNode;
  analyser?: AnalyserNode;
  timeData?: Uint8Array;
  freqData?: Uint8Array;
  peakHoldUntilMs?: number;
  peakHoldValue?: number;
};

type OscState = {
  waveform: OscillatorType;
  detuneCents: number;
  freqHz: number;
  gain: number;
  gate: boolean;
  osc?: OscillatorNode;
  gainNode?: GainNode;
  monitorGain?: GainNode;
  analyser?: AnalyserNode;
  timeData?: Uint8Array;
  freqData?: Uint8Array;
};

type FilePlayerState = {
  enabled: boolean;
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
  url: string;
  loop: boolean;
  gain: number;
  gate: boolean;
  buffer?: AudioBuffer;
  source?: AudioBufferSourceNode;
  gainNode?: GainNode;
  monitorGain?: GainNode;
  analyser?: AnalyserNode;
  timeData?: Uint8Array;
  freqData?: Uint8Array;
  startedAtCtxTime?: number;
  durationS?: number;
};

type MasterState = {
  enabled: boolean;
  status: "idle" | "suspended" | "running" | "error";
  errorMessage?: string;
  gate: boolean;
  gain: number;
  maxGain: number;
  limiterEnabled: boolean;
};

type SfxTapState = {
  analyser: AnalyserNode;
  monitorGain: GainNode;
  timeData: Uint8Array;
  freqData: Uint8Array;
  playing: boolean;
  playingUntilCtxTime: number;
  level: number;
};

export type SfxTriggerArgs = {
  waveform: string;
  sourceKind: "tone" | "noise";
  startHz: number;
  endHz: number;
  durationS: number;
  curve: SweepCurve;
  direction: SweepDirection;
  gain: number;
  attackMs: number;
  releaseMs: number;
};

export type MachineSoundArgs = {
  enabled: boolean;
  speed: number;
  load: number;
  gain: number;
  whineHz: number;
  harmonicMix: number;
  rippleMix: number;
  noiseMix: number;
};

type MachineState = {
  enabled: boolean;
  speed: number;
  load: number;
  gain: number;
  whineHz: number;
  harmonicMix: number;
  rippleMix: number;
  noiseMix: number;
  whineOsc?: OscillatorNode;
  harmOsc?: OscillatorNode;
  rippleOsc?: OscillatorNode;
  noiseSource?: AudioBufferSourceNode;
  noiseFilter?: BiquadFilterNode;
  whineGain?: GainNode;
  harmGain?: GainNode;
  rippleGain?: GainNode;
  noiseGain?: GainNode;
  sumGain?: GainNode;
  monitorGain?: GainNode;
  analyser?: AnalyserNode;
  timeData?: Uint8Array;
  freqData?: Uint8Array;
};

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

class StudioAudioRuntime {
  private ctx: AudioContext | null = null;
  private micByNodeId = new Map<string, MicState>();
  private oscByNodeId = new Map<string, OscState>();
  private fileByNodeId = new Map<string, FilePlayerState>();
  private master: MasterState = {
    enabled: false,
    status: "idle",
    gate: false,
    gain: 0,
    maxGain: 0.25,
    limiterEnabled: true,
  };

  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private masterTimeData: Uint8Array | null = null;
  private masterFreqData: Uint8Array | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private sfxTapByNodeId = new Map<string, SfxTapState>();
  private machineByNodeId = new Map<string, MachineState>();
  private noiseBuffer: AudioBuffer | null = null;

  getAudioContextStatus(): MasterState["status"] {
    if (this.ctx == null) return "idle";
    if (this.ctx.state === "running") return "running";
    if (this.ctx.state === "suspended") return "suspended";
    return "idle";
  }

  getMicUiState(nodeId: string): Pick<MicState, "enabled" | "status" | "errorMessage"> {
    const st = this.micByNodeId.get(nodeId);
    return {
      enabled: st?.enabled === true,
      status: st?.status ?? "idle",
      errorMessage: st?.errorMessage,
    };
  }

  getMasterUiState(): Pick<MasterState, "enabled" | "status" | "errorMessage"> {
    return {
      enabled: this.master.enabled,
      status: this.master.status,
      errorMessage: this.master.errorMessage,
    };
  }

  async ensureAudioContextRunning(): Promise<StudioAudioStartResult> {
    if (!hasWindow()) {
      return { ok: false, reason: "no-window", message: "Audio is only available in a browser/webview." };
    }
    const AnyWindow = window as any;
    const AC = (AnyWindow.AudioContext ?? AnyWindow.webkitAudioContext) as
      | (new () => AudioContext)
      | undefined;
    if (AC == null) {
      return { ok: false, reason: "unsupported", message: "Web Audio API is not supported in this environment." };
    }
    try {
      if (this.ctx == null) {
        this.ctx = new AC();
      }
      if (this.ctx.state !== "running") {
        await this.ctx.resume();
      }
      this.master.status = this.ctx.state === "running" ? "running" : "suspended";
      this.master.errorMessage = undefined;
      this.ensureMasterChain();
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.master.status = "error";
      this.master.errorMessage = message;
      return { ok: false, reason: "error", message };
    }
  }

  enableMaster(enabled: boolean): void {
    this.master.enabled = enabled;
  }

  setMasterControls(args: { gate: boolean; gain: number; maxGain: number; limiterEnabled: boolean }): void {
    this.master.gate = args.gate;
    this.master.gain = clamp01(args.gain);
    this.master.maxGain = clamp01(args.maxGain);
    this.master.limiterEnabled = args.limiterEnabled;
    this.applyMasterGain();
  }

  /** Immediate silence: master gate off, all monitor paths muted, generators stopped. */
  panicMuteAll(): void {
    this.master.gate = false;
    this.master.gain = 0;
    this.applyMasterGain();

    for (const nodeId of this.micByNodeId.keys()) {
      this.setMicMonitorGain(nodeId, 0);
    }
    for (const [nodeId, st] of this.oscByNodeId) {
      st.gate = false;
      this.setOscillatorMonitorGain(nodeId, 0);
      void this.applyOscillatorGraph(nodeId);
    }
    for (const [nodeId, st] of this.fileByNodeId) {
      st.gate = false;
      this.setFilePlayerMonitorGain(nodeId, 0);
      this.stopFilePlayer(st);
    }
    for (const [nodeId, st] of this.sfxTapByNodeId) {
      st.playing = false;
      st.level = 0;
      this.setSfxMonitorGain(nodeId, 0);
    }
    for (const nodeId of this.machineByNodeId.keys()) {
      this.stopMachine(nodeId);
      this.setMachineMonitorGain(nodeId, 0);
    }
  }

  enableMic(nodeId: string, enabled: boolean): void {
    const prev = this.micByNodeId.get(nodeId);
    const next: MicState = prev ?? {
      enabled: false,
      status: "idle",
      deviceId: "default",
    };
    next.enabled = enabled;
    if (!enabled && next.status === "active") {
      this.stopMic(nodeId);
      next.status = "idle";
    }
    this.micByNodeId.set(nodeId, next);
  }

  async ensureMicActive(nodeId: string, args: { deviceId: string; fftSize: number; smoothing: number }): Promise<void> {
    const fftSize = clampAnalyserFftSize(args.fftSize);
    const smoothing = clamp01(args.smoothing);
    const st = this.micByNodeId.get(nodeId) ?? {
      enabled: false,
      status: "idle",
      deviceId: "default",
    };
    st.deviceId = args.deviceId;
    this.micByNodeId.set(nodeId, st);

    if (!st.enabled) {
      return;
    }
    if (st.status === "active" && st.analyser != null) {
      // Keep analyser settings in sync.
      if (st.analyser.fftSize !== fftSize) {
        st.analyser.fftSize = fftSize;
        st.timeData = new Uint8Array(st.analyser.fftSize);
        st.freqData = new Uint8Array(st.analyser.frequencyBinCount);
      }
      st.analyser.smoothingTimeConstant = smoothing;
      return;
    }

    st.status = "requesting";
    st.errorMessage = undefined;
    this.micByNodeId.set(nodeId, st);

    const ctxRes = await this.ensureAudioContextRunning();
    if (!ctxRes.ok) {
      st.status = "error";
      st.errorMessage = ctxRes.message;
      return;
    }
    const ctx = this.ctx!;

    try {
      const deviceId = st.deviceId;
      const constraints: MediaStreamConstraints = {
        audio:
          deviceId && deviceId !== "default"
            ? { deviceId: { exact: deviceId } }
            : true,
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = 0;
      source.connect(analyser);
      source.connect(monitorGain);
      this.ensureMasterChain();
      if (this.masterGain != null) {
        monitorGain.connect(this.masterGain);
      }
      st.stream = stream;
      st.source = source;
      st.monitorGain = monitorGain;
      st.analyser = analyser;
      st.timeData = new Uint8Array(analyser.fftSize);
      st.freqData = new Uint8Array(analyser.frequencyBinCount);
      st.status = "active";
      st.errorMessage = undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      st.status = message.toLowerCase().includes("denied") ? "denied" : "error";
      st.errorMessage = message;
    }
  }

  stopMic(nodeId: string): void {
    const st = this.micByNodeId.get(nodeId);
    if (st == null) return;
    try {
      st.source?.disconnect();
    } catch {}
    try {
      st.monitorGain?.disconnect();
    } catch {}
    try {
      st.stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    delete st.stream;
    delete st.source;
    delete st.monitorGain;
    delete st.analyser;
    delete st.timeData;
    delete st.freqData;
  }

  setMicMonitorGain(nodeId: string, gain: number): void {
    const st = this.micByNodeId.get(nodeId);
    if (st?.monitorGain == null || this.ctx == null) return;
    const g = clamp01(gain);
    st.monitorGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.02);
  }

  readMicBuffers(nodeId: string): { analyser: AnalyserNode; time: Uint8Array; freq: Uint8Array } | null {
    const st = this.micByNodeId.get(nodeId);
    if (st == null || st.status !== "active" || st.analyser == null || st.timeData == null || st.freqData == null) {
      return null;
    }
    st.analyser.getByteTimeDomainData(st.timeData);
    st.analyser.getByteFrequencyData(st.freqData);
    return { analyser: st.analyser, time: st.timeData, freq: st.freqData };
  }

  updateMicPeakHold(nodeId: string, args: { peak: number; peakHoldMs: number; nowMs: number }): number {
    const st = this.micByNodeId.get(nodeId);
    if (st == null) return args.peak;
    const holdMs = Math.max(0, Math.round(args.peakHoldMs));
    const until = st.peakHoldUntilMs ?? 0;
    const prev = st.peakHoldValue ?? 0;
    if (args.peak >= prev || args.nowMs >= until) {
      st.peakHoldValue = args.peak;
      st.peakHoldUntilMs = args.nowMs + holdMs;
      return args.peak;
    }
    return prev;
  }

  setOscillator(nodeId: string, args: { waveform: string; detuneCents: number; freqHz: number; gain: number; gate: boolean }): void {
    const waveform = (["sine", "square", "sawtooth", "triangle"] as const).includes(args.waveform as any)
      ? (args.waveform as OscillatorType)
      : "sine";
    const st = this.oscByNodeId.get(nodeId) ?? {
      waveform: "sine" as OscillatorType,
      detuneCents: 0,
      freqHz: 440,
      gain: 0,
      gate: false,
    };
    st.waveform = waveform;
    st.detuneCents = Number.isFinite(args.detuneCents) ? args.detuneCents : 0;
    st.freqHz = Number.isFinite(args.freqHz) ? Math.max(0, args.freqHz) : 440;
    st.gain = clamp01(args.gain);
    st.gate = args.gate === true;
    this.oscByNodeId.set(nodeId, st);
    this.applyOscillatorGraph(nodeId);
  }

  setOscillatorMonitorGain(nodeId: string, gain: number): void {
    const st = this.oscByNodeId.get(nodeId);
    if (st?.monitorGain == null || this.ctx == null) return;
    const g = clamp01(gain);
    st.monitorGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.02);
  }

  setFilePlayer(
    nodeId: string,
    args: { enabled: boolean; url: string; loop: boolean; gain: number; gate: boolean },
  ): void {
    const st =
      this.fileByNodeId.get(nodeId) ??
      ({
        enabled: false,
        status: "idle",
        url: "",
        loop: false,
        gain: 0.5,
        gate: false,
      } satisfies FilePlayerState);

    st.enabled = args.enabled === true;
    st.url = args.url.trim();
    st.loop = args.loop === true;
    st.gain = clamp01(args.gain);
    st.gate = args.gate === true;
    this.fileByNodeId.set(nodeId, st);
    void this.applyFilePlayerGraph(nodeId);
  }

  setFilePlayerMonitorGain(nodeId: string, gain: number): void {
    const st = this.fileByNodeId.get(nodeId);
    if (st?.monitorGain == null || this.ctx == null) return;
    const g = clamp01(gain);
    st.monitorGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.02);
  }

  getFilePlayerUiState(
    nodeId: string,
  ): Pick<FilePlayerState, "enabled" | "status" | "errorMessage"> {
    const st = this.fileByNodeId.get(nodeId);
    return {
      enabled: st?.enabled === true,
      status: st?.status ?? "idle",
      errorMessage: st?.errorMessage,
    };
  }

  getFilePlayerTransport(nodeId: string): { playing: boolean; timeS: number; durationS: number } {
    const st = this.fileByNodeId.get(nodeId);
    if (st == null || this.ctx == null) {
      return { playing: false, timeS: 0, durationS: 0 };
    }
    const durationS = st.durationS ?? st.buffer?.duration ?? 0;
    const playing = st.gate === true && st.source != null && st.startedAtCtxTime != null;
    const timeS =
      playing && st.startedAtCtxTime != null
        ? Math.max(0, this.ctx.currentTime - st.startedAtCtxTime)
        : 0;
    return { playing, timeS, durationS };
  }

  readOscillatorBuffers(nodeId: string): { analyser: AnalyserNode; time: Uint8Array; freq: Uint8Array } | null {
    const st = this.oscByNodeId.get(nodeId);
    if (st == null || st.analyser == null || st.timeData == null || st.freqData == null) {
      return null;
    }
    st.analyser.getByteTimeDomainData(st.timeData);
    st.analyser.getByteFrequencyData(st.freqData);
    return { analyser: st.analyser, time: st.timeData, freq: st.freqData };
  }

  getSfxTransport(nodeId: string): { playing: boolean; level: number } {
    const st = this.sfxTapByNodeId.get(nodeId);
    if (st == null || this.ctx == null) {
      return { playing: false, level: 0 };
    }
    const playing = st.playing && this.ctx.currentTime < st.playingUntilCtxTime;
    if (!playing) {
      st.playing = false;
      st.level = 0;
    }
    return { playing: st.playing, level: st.level };
  }

  setSfxMonitorGain(nodeId: string, gain: number): void {
    const st = this.sfxTapByNodeId.get(nodeId);
    if (st?.monitorGain == null || this.ctx == null) {
      return;
    }
    st.monitorGain.gain.setTargetAtTime(clamp01(gain), this.ctx.currentTime, 0.02);
  }

  setSfxAnalyserSettings(nodeId: string, args: { fftSize: number; smoothing: number }): void {
    const st = this.sfxTapByNodeId.get(nodeId);
    if (st?.analyser == null) {
      return;
    }
    const fftSize = clampAnalyserFftSize(args.fftSize);
    const smoothing = clamp01(args.smoothing);
    if (st.analyser.fftSize !== fftSize) {
      st.analyser.fftSize = fftSize;
      st.timeData = new Uint8Array(st.analyser.fftSize);
      st.freqData = new Uint8Array(st.analyser.frequencyBinCount);
    }
    st.analyser.smoothingTimeConstant = smoothing;
  }

  readSfxBuffers(nodeId: string): { analyser: AnalyserNode; time: Uint8Array; freq: Uint8Array } | null {
    const st = this.sfxTapByNodeId.get(nodeId);
    if (st == null) {
      return null;
    }
    st.analyser.getByteTimeDomainData(st.timeData);
    st.analyser.getByteFrequencyData(st.freqData);
    let peak = 0;
    for (let i = 0; i < st.timeData.length; i += 1) {
      const v = Math.abs(st.timeData[i]! - 128) / 128;
      if (v > peak) {
        peak = v;
      }
    }
    st.level = peak;
    return { analyser: st.analyser, time: st.timeData, freq: st.freqData };
  }

  async triggerSfx(nodeId: string, args: SfxTriggerArgs): Promise<void> {
    const ctxRes = await this.ensureAudioContextRunning();
    if (!ctxRes.ok || this.ctx == null) {
      return;
    }
    const ctx = this.ctx;
    this.ensureMasterChain();
    if (this.masterGain == null) {
      return;
    }

    let tap = this.sfxTapByNodeId.get(nodeId);
    if (tap == null) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = 1;
      analyser.connect(monitorGain);
      monitorGain.connect(this.masterGain);
      tap = {
        analyser,
        monitorGain,
        timeData: new Uint8Array(analyser.fftSize),
        freqData: new Uint8Array(analyser.frequencyBinCount),
        playing: false,
        playingUntilCtxTime: 0,
        level: 0,
      };
      this.sfxTapByNodeId.set(nodeId, tap);
    }

    const durationS = Math.max(0.05, args.durationS);
    const attackS = Math.max(0.001, args.attackMs / 1000);
    const releaseS = Math.max(0.01, args.releaseMs / 1000);
    const sustainEndS = Math.max(attackS, durationS - releaseS);
    const peakGain = clamp01(args.gain);
    const t0 = ctx.currentTime + 0.01;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(peakGain, t0 + attackS);
    gainNode.gain.setValueAtTime(peakGain, t0 + sustainEndS);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + durationS);

    const scheduleToneSweep = (osc: OscillatorNode) => {
      const { lo, hi } = {
        lo: Math.min(Math.max(1, args.startHz), Math.max(1, args.endHz)),
        hi: Math.max(Math.max(1, args.startHz), Math.max(1, args.endHz)),
      };
      const rampHz = (time: number, t: number) => {
        const hz = interpolateSweepHz(t, lo, hi, args.curve);
        if (args.curve === "log") {
          osc.frequency.exponentialRampToValueAtTime(Math.max(1, hz), time);
        } else {
          osc.frequency.linearRampToValueAtTime(hz, time);
        }
      };
      osc.frequency.setValueAtTime(lo, t0);
      if (args.direction === "up") {
        rampHz(t0 + durationS, 1);
      } else if (args.direction === "down") {
        osc.frequency.setValueAtTime(hi, t0);
        rampHz(t0 + durationS, 0);
      } else {
        const mid = t0 + durationS / 2;
        rampHz(mid, 1);
        if (args.curve === "log") {
          osc.frequency.exponentialRampToValueAtTime(lo, t0 + durationS);
        } else {
          osc.frequency.linearRampToValueAtTime(lo, t0 + durationS);
        }
      }
    };

    if (args.sourceKind === "noise") {
      if (this.noiseBuffer == null) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
      }
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(Math.max(80, args.startHz), t0);
      if (args.curve === "log") {
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(80, args.endHz),
          t0 + durationS,
        );
      } else {
        filter.frequency.linearRampToValueAtTime(Math.max(80, args.endHz), t0 + durationS);
      }
      filter.Q.value = 1.2;
      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(tap.analyser);
      src.start(t0);
      src.stop(t0 + durationS + 0.05);
    } else {
      const waveform = (["sine", "square", "sawtooth", "triangle"] as const).includes(
        args.waveform as OscillatorType,
      )
        ? (args.waveform as OscillatorType)
        : "sine";
      const osc = ctx.createOscillator();
      osc.type = waveform;
      scheduleToneSweep(osc);
      osc.connect(gainNode);
      gainNode.connect(tap.analyser);
      osc.start(t0);
      osc.stop(t0 + durationS + 0.05);
    }

    tap.playing = true;
    tap.playingUntilCtxTime = t0 + durationS;
    tap.level = peakGain;
  }

  setMachineSound(nodeId: string, args: MachineSoundArgs): void {
    const st =
      this.machineByNodeId.get(nodeId) ??
      ({
        enabled: false,
        speed: 0,
        load: 0,
        gain: 0,
        whineHz: 220,
        harmonicMix: 0,
        rippleMix: 0,
        noiseMix: 0,
      } satisfies MachineState);
    st.enabled = args.enabled === true;
    st.speed = clamp01(args.speed);
    st.load = clamp01(args.load);
    st.gain = clamp01(args.gain);
    st.whineHz = Math.max(20, args.whineHz);
    st.harmonicMix = clamp01(args.harmonicMix);
    st.rippleMix = clamp01(args.rippleMix);
    st.noiseMix = clamp01(args.noiseMix);
    this.machineByNodeId.set(nodeId, st);
    void this.applyMachineGraph(nodeId);
  }

  setMachineMonitorGain(nodeId: string, gain: number): void {
    const st = this.machineByNodeId.get(nodeId);
    if (st?.monitorGain == null || this.ctx == null) {
      return;
    }
    st.monitorGain.gain.setTargetAtTime(clamp01(gain), this.ctx.currentTime, 0.02);
  }

  setMachineAnalyserSettings(nodeId: string, args: { fftSize: number; smoothing: number }): void {
    const st = this.machineByNodeId.get(nodeId);
    if (st?.analyser == null) {
      return;
    }
    const fftSize = clampAnalyserFftSize(args.fftSize);
    const smoothing = clamp01(args.smoothing);
    if (st.analyser.fftSize !== fftSize) {
      st.analyser.fftSize = fftSize;
      st.timeData = new Uint8Array(st.analyser.fftSize);
      st.freqData = new Uint8Array(st.analyser.frequencyBinCount);
    }
    st.analyser.smoothingTimeConstant = smoothing;
  }

  readMachineBuffers(nodeId: string): { analyser: AnalyserNode; time: Uint8Array; freq: Uint8Array } | null {
    const st = this.machineByNodeId.get(nodeId);
    if (st?.analyser == null || st.timeData == null || st.freqData == null) {
      return null;
    }
    st.analyser.getByteTimeDomainData(st.timeData);
    st.analyser.getByteFrequencyData(st.freqData);
    return { analyser: st.analyser, time: st.timeData, freq: st.freqData };
  }

  private disconnectOscillator(osc?: OscillatorNode): void {
    if (osc == null) {
      return;
    }
    try {
      osc.stop();
    } catch {}
    try {
      osc.disconnect();
    } catch {}
  }

  private stopMachine(nodeId: string): void {
    const st = this.machineByNodeId.get(nodeId);
    if (st == null) {
      return;
    }
    this.disconnectOscillator(st.whineOsc);
    this.disconnectOscillator(st.harmOsc);
    this.disconnectOscillator(st.rippleOsc);
    if (st.noiseSource != null) {
      try {
        st.noiseSource.stop();
      } catch {}
      try {
        st.noiseSource.disconnect();
      } catch {}
    }
    try {
      st.noiseFilter?.disconnect();
    } catch {}
    try {
      st.whineGain?.disconnect();
    } catch {}
    try {
      st.harmGain?.disconnect();
    } catch {}
    try {
      st.rippleGain?.disconnect();
    } catch {}
    try {
      st.noiseGain?.disconnect();
    } catch {}
    try {
      st.sumGain?.disconnect();
    } catch {}
    delete st.whineOsc;
    delete st.harmOsc;
    delete st.rippleOsc;
    delete st.noiseSource;
    delete st.noiseFilter;
    delete st.whineGain;
    delete st.harmGain;
    delete st.rippleGain;
    delete st.noiseGain;
    delete st.sumGain;
    st.enabled = false;
  }

  private async applyMachineGraph(nodeId: string): Promise<void> {
    const st = this.machineByNodeId.get(nodeId);
    if (st == null) {
      return;
    }
    if (!st.enabled || st.speed <= 0.001 || st.gain <= 0.001) {
      this.stopMachine(nodeId);
      return;
    }
    const ctxRes = await this.ensureAudioContextRunning();
    if (!ctxRes.ok || this.ctx == null) {
      return;
    }
    const ctx = this.ctx;
    this.ensureMasterChain();
    if (this.masterGain == null) {
      return;
    }

    if (st.analyser == null || st.monitorGain == null) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = 1;
      analyser.connect(monitorGain);
      monitorGain.connect(this.masterGain);
      st.analyser = analyser;
      st.monitorGain = monitorGain;
      st.timeData = new Uint8Array(analyser.fftSize);
      st.freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    if (st.sumGain == null) {
      st.sumGain = ctx.createGain();
      st.sumGain.connect(st.analyser);
    }

    const loadBright = 0.65 + st.load * 0.35;
    const masterLevel = st.gain * (0.35 + st.speed * 0.65) * loadBright;
    const t = ctx.currentTime;
    st.sumGain.gain.setTargetAtTime(masterLevel, t, 0.04);

    const ensureWhine = () => {
      if (st.whineOsc != null && st.whineGain != null) {
        return;
      }
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(st.sumGain!);
      osc.start();
      st.whineOsc = osc;
      st.whineGain = gainNode;
    };

    const ensureHarm = () => {
      if (st.harmOsc != null && st.harmGain != null) {
        return;
      }
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(st.sumGain!);
      osc.start();
      st.harmOsc = osc;
      st.harmGain = gainNode;
    };

    const ensureRipple = () => {
      if (st.rippleOsc != null && st.rippleGain != null) {
        return;
      }
      const osc = ctx.createOscillator();
      osc.type = "square";
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(st.sumGain!);
      osc.start();
      st.rippleOsc = osc;
      st.rippleGain = gainNode;
    };

    const ensureNoise = () => {
      if (st.noiseSource != null && st.noiseGain != null && st.noiseFilter != null) {
        return;
      }
      if (this.noiseBuffer == null) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
      }
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 1.4;
      const gainNode = ctx.createGain();
      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(st.sumGain!);
      src.start();
      st.noiseSource = src;
      st.noiseFilter = filter;
      st.noiseGain = gainNode;
    };

    ensureWhine();
    if (st.harmonicMix > 0.01) {
      ensureHarm();
    } else {
      this.disconnectOscillator(st.harmOsc);
      delete st.harmOsc;
      delete st.harmGain;
    }
    const rippleHz = resolveMotorRippleHz(st.whineHz, st.rippleMix);
    if (rippleHz > 0) {
      ensureRipple();
    } else {
      this.disconnectOscillator(st.rippleOsc);
      delete st.rippleOsc;
      delete st.rippleGain;
    }
    if (st.noiseMix > 0.01) {
      ensureNoise();
    } else if (st.noiseSource != null) {
      try {
        st.noiseSource.stop();
      } catch {}
      st.noiseSource.disconnect();
      st.noiseFilter?.disconnect();
      st.noiseGain?.disconnect();
      delete st.noiseSource;
      delete st.noiseFilter;
      delete st.noiseGain;
    }

    st.whineOsc!.frequency.setTargetAtTime(st.whineHz, t, 0.03);
    st.whineGain!.gain.setTargetAtTime(0.55, t, 0.03);

    if (st.harmOsc != null && st.harmGain != null) {
      st.harmOsc.frequency.setTargetAtTime(st.whineHz * 2, t, 0.03);
      st.harmGain.gain.setTargetAtTime(st.harmonicMix * 0.35, t, 0.03);
    }

    if (st.rippleOsc != null && st.rippleGain != null) {
      st.rippleOsc.frequency.setTargetAtTime(rippleHz, t, 0.03);
      st.rippleGain.gain.setTargetAtTime(st.rippleMix * 0.08, t, 0.03);
    }

    if (st.noiseFilter != null && st.noiseGain != null) {
      const center = Math.max(120, Math.min(8000, st.whineHz * (0.8 + st.load * 0.5)));
      st.noiseFilter.frequency.setTargetAtTime(center, t, 0.05);
      st.noiseGain.gain.setTargetAtTime(st.noiseMix * 0.25, t, 0.03);
    }
  }

  readFilePlayerBuffers(nodeId: string): { analyser: AnalyserNode; time: Uint8Array; freq: Uint8Array } | null {
    const st = this.fileByNodeId.get(nodeId);
    if (st == null || st.analyser == null || st.timeData == null || st.freqData == null) {
      return null;
    }
    st.analyser.getByteTimeDomainData(st.timeData);
    st.analyser.getByteFrequencyData(st.freqData);
    return { analyser: st.analyser, time: st.timeData, freq: st.freqData };
  }

  setMicAnalyserSettings(nodeId: string, args: { fftSize: number; smoothing: number }): void {
    const st = this.micByNodeId.get(nodeId);
    if (st?.analyser == null) return;
    const fftSize = clampAnalyserFftSize(args.fftSize);
    const smoothing = clamp01(args.smoothing);
    if (st.analyser.fftSize !== fftSize) {
      st.analyser.fftSize = fftSize;
      st.timeData = new Uint8Array(st.analyser.fftSize);
      st.freqData = new Uint8Array(st.analyser.frequencyBinCount);
    }
    st.analyser.smoothingTimeConstant = smoothing;
  }

  setOscillatorAnalyserSettings(nodeId: string, args: { fftSize: number; smoothing: number }): void {
    const st = this.oscByNodeId.get(nodeId);
    if (st?.analyser == null) return;
    const fftSize = clampAnalyserFftSize(args.fftSize);
    const smoothing = clamp01(args.smoothing);
    if (st.analyser.fftSize !== fftSize) {
      st.analyser.fftSize = fftSize;
      st.timeData = new Uint8Array(st.analyser.fftSize);
      st.freqData = new Uint8Array(st.analyser.frequencyBinCount);
    }
    st.analyser.smoothingTimeConstant = smoothing;
  }

  setFilePlayerAnalyserSettings(nodeId: string, args: { fftSize: number; smoothing: number }): void {
    const st = this.fileByNodeId.get(nodeId);
    if (st?.analyser == null) return;
    const fftSize = clampAnalyserFftSize(args.fftSize);
    const smoothing = clamp01(args.smoothing);
    if (st.analyser.fftSize !== fftSize) {
      st.analyser.fftSize = fftSize;
      st.timeData = new Uint8Array(st.analyser.fftSize);
      st.freqData = new Uint8Array(st.analyser.frequencyBinCount);
    }
    st.analyser.smoothingTimeConstant = smoothing;
  }

  setMasterAnalyserSettings(args: { fftSize: number; smoothing: number }): void {
    if (this.masterAnalyser == null) return;
    const fftSize = clampAnalyserFftSize(args.fftSize);
    const smoothing = clamp01(args.smoothing);
    if (this.masterAnalyser.fftSize !== fftSize) {
      this.masterAnalyser.fftSize = fftSize;
      this.masterTimeData = new Uint8Array(this.masterAnalyser.fftSize);
      this.masterFreqData = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    }
    this.masterAnalyser.smoothingTimeConstant = smoothing;
  }

  private ensureMasterChain(): void {
    if (this.ctx == null) return;
    if (this.masterGain != null) return;
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.8;
    this.masterTimeData = new Uint8Array(this.masterAnalyser.fftSize);
    this.masterFreqData = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterLimiter = ctx.createDynamicsCompressor();
    // Conservative limiter settings (acts like safety compressor).
    this.masterLimiter.threshold.value = -12;
    this.masterLimiter.knee.value = 0;
    this.masterLimiter.ratio.value = 20;
    this.masterLimiter.attack.value = 0.003;
    this.masterLimiter.release.value = 0.1;
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.masterLimiter);
    this.masterLimiter.connect(ctx.destination);
    this.applyMasterGain();
  }

  readMasterBuffers(): { analyser: AnalyserNode; time: Uint8Array; freq: Uint8Array } | null {
    if (this.masterAnalyser == null || this.masterTimeData == null || this.masterFreqData == null) {
      return null;
    }
    this.masterAnalyser.getByteTimeDomainData(this.masterTimeData);
    this.masterAnalyser.getByteFrequencyData(this.masterFreqData);
    return { analyser: this.masterAnalyser, time: this.masterTimeData, freq: this.masterFreqData };
  }

  private applyMasterGain(): void {
    if (this.masterGain == null) return;
    const enabled = this.master.enabled;
    const g = enabled && this.master.gate ? clamp01(this.master.gain) : 0;
    const capped = Math.min(g, clamp01(this.master.maxGain));
    this.masterGain.gain.setTargetAtTime(capped, this.ctx?.currentTime ?? 0, 0.015);
  }

  private async applyOscillatorGraph(nodeId: string): Promise<void> {
    const st = this.oscByNodeId.get(nodeId);
    if (st == null) return;
    if (!st.gate) {
      try {
        st.gainNode?.disconnect();
      } catch {}
      try {
        st.analyser?.disconnect();
      } catch {}
      try {
        st.monitorGain?.disconnect();
      } catch {}
      try {
        st.osc?.stop();
      } catch {}
      delete st.osc;
      delete st.gainNode;
      delete st.monitorGain;
      delete st.analyser;
      delete st.timeData;
      delete st.freqData;
      return;
    }

    const ctxRes = await this.ensureAudioContextRunning();
    if (!ctxRes.ok) {
      return;
    }
    const ctx = this.ctx!;
    this.ensureMasterChain();
    if (this.masterGain == null) return;

    if (st.osc == null || st.gainNode == null || st.monitorGain == null || st.analyser == null) {
      const osc = ctx.createOscillator();
      osc.type = st.waveform;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = 1;
      osc.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(monitorGain);
      monitorGain.connect(this.masterGain);
      osc.start();
      st.osc = osc;
      st.gainNode = gainNode;
      st.analyser = analyser;
      st.monitorGain = monitorGain;
      st.timeData = new Uint8Array(analyser.fftSize);
      st.freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    st.osc.type = st.waveform;
    st.osc.detune.setValueAtTime(st.detuneCents, ctx.currentTime);
    st.osc.frequency.setValueAtTime(st.freqHz, ctx.currentTime);
    st.gainNode.gain.setTargetAtTime(st.gain, ctx.currentTime, 0.01);
  }

  private stopFilePlayer(st: FilePlayerState): void {
    try {
      st.gainNode?.disconnect();
    } catch {}
    try {
      st.analyser?.disconnect();
    } catch {}
    try {
      st.monitorGain?.disconnect();
    } catch {}
    try {
      st.source?.stop();
    } catch {}
    delete st.source;
    delete st.gainNode;
    delete st.monitorGain;
    delete st.analyser;
    delete st.timeData;
    delete st.freqData;
    delete st.startedAtCtxTime;
  }

  private async ensureFileBufferLoaded(st: FilePlayerState): Promise<void> {
    if (this.ctx == null) return;
    const url = st.url;
    if (url.length === 0) {
      st.status = "idle";
      st.errorMessage = undefined;
      st.buffer = undefined;
      st.durationS = 0;
      return;
    }
    if (st.buffer != null && st.status === "ready") {
      return;
    }
    st.status = "loading";
    st.errorMessage = undefined;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} while fetching audio.`);
      }
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr.slice(0));
      st.buffer = buf;
      st.durationS = buf.duration;
      st.status = "ready";
      st.errorMessage = undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      st.status = "error";
      st.errorMessage = message;
      st.buffer = undefined;
      st.durationS = 0;
    }
  }

  private async applyFilePlayerGraph(nodeId: string): Promise<void> {
    const st = this.fileByNodeId.get(nodeId);
    if (st == null) return;
    if (!st.enabled || !st.gate) {
      this.stopFilePlayer(st);
      return;
    }
    const ctxRes = await this.ensureAudioContextRunning();
    if (!ctxRes.ok) {
      st.status = "error";
      st.errorMessage = ctxRes.message;
      return;
    }
    const ctx = this.ctx!;
    this.ensureMasterChain();
    if (this.masterGain == null) return;

    // Ensure buffer exists.
    await this.ensureFileBufferLoaded(st);
    if (st.buffer == null || st.status !== "ready") {
      this.stopFilePlayer(st);
      return;
    }

    // Start playback if not already running.
    if (
      st.source == null ||
      st.gainNode == null ||
      st.analyser == null ||
      st.monitorGain == null ||
      st.startedAtCtxTime == null
    ) {
      const src = ctx.createBufferSource();
      src.buffer = st.buffer;
      src.loop = st.loop;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = 1;
      src.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(monitorGain);
      monitorGain.connect(this.masterGain);
      src.onended = () => {
        // If not looping, clear playing state on end.
        if (st.loop) return;
        this.stopFilePlayer(st);
      };
      src.start();
      st.source = src;
      st.gainNode = gainNode;
      st.analyser = analyser;
      st.monitorGain = monitorGain;
      st.startedAtCtxTime = ctx.currentTime;
      st.timeData = new Uint8Array(analyser.fftSize);
      st.freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    st.source.loop = st.loop;
    st.gainNode.gain.setTargetAtTime(st.gain, ctx.currentTime, 0.01);
  }
}

export const studioAudioRuntime = new StudioAudioRuntime();

