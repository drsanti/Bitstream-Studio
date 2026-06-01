import type {
  AnimationLabTwinHealth,
  AnimationLabTwinSignalDef,
} from "./digital-twin.types.js";

const HEALTH_RANK: Record<AnimationLabTwinHealth, number> = {
  offline: 0,
  ok: 1,
  caution: 2,
  warning: 3,
  error: 4,
};

export function worstTwinHealth(
  a: AnimationLabTwinHealth,
  b: AnimationLabTwinHealth,
): AnimationLabTwinHealth {
  return HEALTH_RANK[a] >= HEALTH_RANK[b] ? a : b;
}

export function evaluateTwinSignalHealth(
  value: number,
  def: AnimationLabTwinSignalDef,
): AnimationLabTwinHealth {
  const { warn, alarm, direction = "above" } = def;
  if (!Number.isFinite(value)) {
    return "offline";
  }
  if (typeof alarm === "number") {
    const alarmBreached =
      direction === "below" ? value <= alarm : value >= alarm;
    if (alarmBreached) {
      return "error";
    }
  }
  if (typeof warn === "number") {
    const warnBreached = direction === "below" ? value <= warn : value >= warn;
    if (warnBreached) {
      return "warning";
    }
    if (direction === "above" && value >= warn * 0.88) {
      return "caution";
    }
    if (direction === "below" && value <= warn * 1.12) {
      return "caution";
    }
  }
  return "ok";
}

export function twinHealthLabel(health: AnimationLabTwinHealth): string {
  switch (health) {
    case "ok":
      return "OK";
    case "caution":
      return "Caution";
    case "warning":
      return "Warning";
    case "error":
      return "Fault";
    case "offline":
      return "Offline";
    default:
      return health;
  }
}

/** Sidebar rows / legacy chips — tinted pill. */
export function twinHealthClassName(health: AnimationLabTwinHealth): string {
  switch (health) {
    case "ok":
      return "border-emerald-600/50 bg-emerald-950/40 text-emerald-200";
    case "caution":
      return "border-amber-600/50 bg-amber-950/35 text-amber-200";
    case "warning":
      return "border-orange-600/55 bg-orange-950/35 text-orange-200";
    case "error":
      return "border-rose-600/60 bg-rose-950/40 text-rose-200";
    case "offline":
      return "border-zinc-600/50 bg-zinc-900/50 text-zinc-500";
    default:
      return "border-zinc-600/50 text-zinc-400";
  }
}

/** CSS3D tag shell — health accent rail + text tone (see animation-lab-twin-css3d-tag.css). */
export function twinTagHealthShellClass(health: AnimationLabTwinHealth): string {
  switch (health) {
    case "ok":
      return "animation-lab-twin-css3d-tag--health-ok border-emerald-900/35 text-zinc-100";
    case "caution":
      return "animation-lab-twin-css3d-tag--health-caution border-amber-900/40 text-zinc-100";
    case "warning":
      return "animation-lab-twin-css3d-tag--health-warning border-orange-900/40 text-zinc-100";
    case "error":
      return "animation-lab-twin-css3d-tag--health-error border-rose-900/45 text-zinc-100";
    case "offline":
      return "animation-lab-twin-css3d-tag--health-offline border-zinc-700/50 text-zinc-500";
    default:
      return "animation-lab-twin-css3d-tag--health-offline border-zinc-700/50 text-zinc-400";
  }
}

export function twinTagHealthStatusClass(health: AnimationLabTwinHealth): string {
  switch (health) {
    case "ok":
      return "text-emerald-300";
    case "caution":
      return "text-amber-300";
    case "warning":
      return "text-orange-300";
    case "error":
      return "text-rose-300";
    case "offline":
      return "text-zinc-500";
    default:
      return "text-zinc-400";
  }
}

/** Wireframe preset — transparent fill, health-tinted outline only. */
export function twinTagHealthWireframeShellClass(health: AnimationLabTwinHealth): string {
  switch (health) {
    case "ok":
      return "animation-lab-twin-css3d-tag--health-ok border-emerald-400/75 bg-transparent text-emerald-200";
    case "caution":
      return "animation-lab-twin-css3d-tag--health-caution border-amber-400/80 bg-transparent text-amber-200";
    case "warning":
      return "animation-lab-twin-css3d-tag--health-warning border-orange-400/80 bg-transparent text-orange-200";
    case "error":
      return "animation-lab-twin-css3d-tag--health-error border-rose-400/85 bg-transparent text-rose-200";
    case "offline":
      return "animation-lab-twin-css3d-tag--health-offline border-zinc-500/60 bg-transparent text-zinc-500";
    default:
      return "animation-lab-twin-css3d-tag--health-offline border-zinc-500/60 bg-transparent text-zinc-400";
  }
}

export function twinTagHealthIconClass(health: AnimationLabTwinHealth): string {
  switch (health) {
    case "ok":
      return "text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.55)]";
    case "caution":
      return "text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]";
    case "warning":
      return "text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.5)]";
    case "error":
      return "text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.65)]";
    case "offline":
      return "text-zinc-500";
    default:
      return "text-zinc-500";
  }
}

export function twinTagHealthLedClass(health: AnimationLabTwinHealth): string {
  switch (health) {
    case "ok":
      return "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]";
    case "caution":
      return "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]";
    case "warning":
      return "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.85)]";
    case "error":
      return "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.9)]";
    case "offline":
      return "bg-zinc-500 shadow-none";
    default:
      return "bg-zinc-500";
  }
}
