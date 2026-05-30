/*******************************************************************************
 * File Name : simulationMqtt.config.ts
 *
 * Description : Default WebSocket MQTT broker URLs for simulation apps.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/** Local broker candidates (extension `npm run mqtt:broker:start`). */
export const SIMULATION_MQTT_BROKER_CANDIDATES: readonly string[] = [
  "ws://127.0.0.1:8883/mqtt",
  "ws://127.0.0.1:8883",
  "ws://localhost:8883/mqtt",
  "ws://localhost:8883",
] as const;
