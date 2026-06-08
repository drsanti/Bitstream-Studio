import type { SensorStudioLivePerformanceStats } from "../../core/runtime/sensor-studio-performance-telemetry";
import type { SensorStudioPerformancePreferences } from "../../persistence/sensor-studio-performance-preferences";

export function shouldShowSensorStudioPerformanceShellChip(
  prefs: SensorStudioPerformancePreferences,
  stats: SensorStudioLivePerformanceStats | null,
): boolean {
  if (prefs.showLivePerformanceStats) {
    return true;
  }
  const capsLimited = prefs.flowSimulationMaxFps > 0 || prefs.stage3dMaxFps > 0;
  if (stats == null) {
    return capsLimited;
  }
  const loopsActive =
    stats.flowSceneLoopActive ||
    stats.stage3dLoopActive ||
    stats.flowTickFps > 0 ||
    stats.render3dActive;
  return capsLimited || loopsActive;
}

export function formatSensorStudioPerformanceShellChipLabel(
  stats: SensorStudioLivePerformanceStats | null,
): string {
  if (stats == null) {
    return "Sim …·3D …";
  }
  if (stats.documentHidden) {
    return "Sim —·3D —";
  }
  const sim =
    stats.flowTickFps > 0 || stats.flowSceneLoopActive ? String(stats.flowTickFps) : "—";
  const render3d =
    stats.render3dActive || stats.stage3dLoopActive ? String(stats.render3dFps) : "—";
  return `Sim ${sim}·3D ${render3d}`;
}
