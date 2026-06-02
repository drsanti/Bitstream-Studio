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

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function clampFftSize(v: number): number {
  const n = Math.round(v);
  // Valid AnalyserNode.fftSize values are powers of two in [32, 32768].
  const min = 32;
  const max = 32768;
  const clamped = Math.max(min, Math.min(max, Number.isFinite(n) ? n : 2048));
  // Round to nearest power of two (prefer stability over strictness).
  let p = 1;
  while (p < clamped) p *= 2;
  const lower = p / 2;
  if (lower >= min && Math.abs(lower - clamped) < Math.abs(p - clamped)) {
    return lower;
  }
  return Math.max(min, Math.min(max, p));
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
      st.analyser.fftSize = args.fftSize;
      st.analyser.smoothingTimeConstant = clamp01(args.smoothing);
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
      analyser.fftSize = args.fftSize;
      analyser.smoothingTimeConstant = clamp01(args.smoothing);
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
    const fftSize = clampFftSize(args.fftSize);
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
    const fftSize = clampFftSize(args.fftSize);
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
    const fftSize = clampFftSize(args.fftSize);
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
    const fftSize = clampFftSize(args.fftSize);
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

