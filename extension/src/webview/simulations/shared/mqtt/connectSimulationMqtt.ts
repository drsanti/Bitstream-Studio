/*******************************************************************************
 * File Name : connectSimulationMqtt.ts
 *
 * Description : Connect to a WebSocket MQTT broker with URL fallback.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import mqtt, { type MqttClient } from "mqtt";
import { SIMULATION_MQTT_BROKER_CANDIDATES } from "./simulationMqtt.config.js";

export type ConnectSimulationMqttOptions = {
  clientId?: string;
  /** If set, only this URL is tried; otherwise candidates are used. */
  brokerUrl?: string;
};

/**
 * Tries broker URLs until one connects (MQTT v3.1.1 for local brokers).
 */
export function connectSimulationMqtt(
  options: ConnectSimulationMqttOptions = {},
): Promise<MqttClient>
{
  const clientId =
    options.clientId ??
    `bitstream-sim-${Math.random().toString(36).slice(2, 10)}`;
  const urls =
    options.brokerUrl != null && options.brokerUrl.length > 0
      ? [options.brokerUrl]
      : [...SIMULATION_MQTT_BROKER_CANDIDATES];

  return new Promise((resolve, reject) =>
  {
    let index = 0;

    const tryNext = (): void =>
    {
      if (index >= urls.length)
      {
        reject(new Error("Unable to connect to any MQTT broker URL"));
        return;
      }

      const url = urls[index];
      index += 1;

      const client = mqtt.connect(url, {
        protocolVersion: 4,
        clientId,
        reconnectPeriod: 0,
        connectTimeout: 5000,
      });

      const onConnect = (): void =>
      {
        cleanup();
        resolve(client);
      };

      const onError = (err: Error): void =>
      {
        cleanup();
        client.end(true);
        tryNext();
      };

      const cleanup = (): void =>
      {
        client.off("connect", onConnect);
        client.off("error", onError);
      };

      client.on("connect", onConnect);
      client.on("error", onError);
    };

    tryNext();
  });
}
