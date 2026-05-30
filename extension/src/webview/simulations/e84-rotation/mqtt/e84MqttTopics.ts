/*******************************************************************************
 * File Name : e84MqttTopics.ts
 *
 * Description : MQTT topic helpers for E84 telemetry publish.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/**
 * Topic used by T3D E84 sim: device/{deviceId}/telemetry
 */
export function buildE84TelemetryTopic(deviceId: string): string
{
  const trimmed = deviceId.trim();
  if (trimmed.length === 0)
  {
    return "";
  }
  return `device/${trimmed}/telemetry`;
}

export type E84TelemetryPayload = {
  x: number;
  y: number;
  z: number;
  timestamp: number;
};
