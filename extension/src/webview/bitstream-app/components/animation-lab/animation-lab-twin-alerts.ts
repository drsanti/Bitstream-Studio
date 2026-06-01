import {
  twinHealthLabelLocalized,
  type AnimationLabTwinLocale,
} from "./animation-lab-twin-i18n.js";
import type {
  AnimationLabTwinAlert,
  AnimationLabTwinComponentLive,
  AnimationLabTwinHealth,
  AnimationLabTwinSignalLive,
} from "./digital-twin.types.js";

const ALERT_HEALTH_RANK: Record<AnimationLabTwinHealth, number> = {
  offline: 0,
  ok: 0,
  caution: 1,
  warning: 2,
  error: 3,
};

const ALERTING_HEALTH: ReadonlySet<AnimationLabTwinHealth> = new Set([
  "caution",
  "warning",
  "error",
]);

export const ANIMATION_LAB_TWIN_ALERTS_MAX = 40;

function alertRowId(componentId: string, signalKey: string): string {
  return `${componentId}::${signalKey}`;
}

function formatAlertMessage(
  signal: AnimationLabTwinSignalLive,
  locale: AnimationLabTwinLocale,
): string {
  const valueText =
    signal.unit.length > 0
      ? `${signal.value.toFixed(Math.abs(signal.value) >= 10 ? 1 : 2)} ${signal.unit}`
      : signal.value.toFixed(2);
  return `${signal.label} ${valueText} — ${twinHealthLabelLocalized(signal.health, locale)}`;
}

function findActiveAlert(
  alerts: readonly AnimationLabTwinAlert[],
  componentId: string,
  signalKey: string,
): AnimationLabTwinAlert | null {
  const id = alertRowId(componentId, signalKey);
  for (let i = alerts.length - 1; i >= 0; i -= 1) {
    const row = alerts[i];
    if (row.id === id && row.clearedAtMs == null) {
      return row;
    }
  }
  return null;
}

function trimAlerts(alerts: AnimationLabTwinAlert[], max: number): AnimationLabTwinAlert[] {
  if (alerts.length <= max) {
    return alerts;
  }
  const cleared = alerts.filter((a) => a.clearedAtMs != null);
  const active = alerts.filter((a) => a.clearedAtMs == null);
  const keepCleared = cleared.slice(-Math.max(0, max - active.length));
  return [...keepCleared, ...active].slice(-max);
}

export function updateTwinMaintenanceAlerts(args: {
  prevAlerts: readonly AnimationLabTwinAlert[];
  prevHealth: ReadonlyMap<string, AnimationLabTwinHealth>;
  components: readonly AnimationLabTwinComponentLive[];
  assetId: string;
  nowMs: number;
  locale?: AnimationLabTwinLocale;
  maxAlerts?: number;
}): {
  alerts: AnimationLabTwinAlert[];
  health: Map<string, AnimationLabTwinHealth>;
} {
  const maxAlerts = args.maxAlerts ?? ANIMATION_LAB_TWIN_ALERTS_MAX;
  const locale = args.locale ?? "en";
  let alerts = [...args.prevAlerts];
  const health = new Map<string, AnimationLabTwinHealth>(args.prevHealth);

  for (const component of args.components) {
    for (const signal of component.signals) {
      const key = alertRowId(component.id, signal.key);
      const prev = health.get(key) ?? "ok";
      const current = signal.health;
      health.set(key, current);

      const active = findActiveAlert(alerts, component.id, signal.key);

      if (ALERTING_HEALTH.has(current)) {
        if (active == null) {
          alerts.push({
            id: key,
            atMs: args.nowMs,
            assetId: args.assetId,
            componentId: component.id,
            componentLabel: component.label,
            signalKey: signal.key,
            signalLabel: signal.label,
            health: current,
            value: signal.value,
            unit: signal.unit,
            message: formatAlertMessage(signal, locale),
          });
        } else {
          const rankUp = ALERT_HEALTH_RANK[current] > ALERT_HEALTH_RANK[active.health];
          alerts = alerts.map((row) =>
            row.id === key && row.clearedAtMs == null
              ? {
                  ...row,
                  atMs: rankUp ? args.nowMs : row.atMs,
                  health: current,
                  value: signal.value,
                  unit: signal.unit,
                  message: formatAlertMessage(signal, locale),
                }
              : row,
          );
        }
        continue;
      }

      if (ALERTING_HEALTH.has(prev) && current === "ok" && active != null) {
        alerts = alerts.map((row) =>
          row.id === key && row.clearedAtMs == null ? { ...row, clearedAtMs: args.nowMs } : row,
        );
      }
    }
  }

  return { alerts: trimAlerts(alerts, maxAlerts), health };
}

export function countActiveTwinAlerts(alerts: readonly AnimationLabTwinAlert[]): number {
  return alerts.filter((a) => a.clearedAtMs == null).length;
}
