/*******************************************************************************
 * File Name : labTopics.ts
 *
 * Description : Default broker topic subscriptions for Bitstream Lab.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BITSTREAM2_TOPICS } from "../../../bitstream2/bridge/protocol";
import { T3D_WS_BROKER_MONITOR_TOPIC } from "../../../websocket/broker-monitor-events";
import { SERIALPORT_TOPICS } from "../../../serialport-bridge/protocol";

export type LabTopicSubscription = {
  topic: string;
  qos: 0 | 1 | 2;
  channel: "json" | "binary";
};

/** Core topics for transport debugging (tap + health). */
export const LAB_DEFAULT_TOPIC_SUBSCRIPTIONS: readonly LabTopicSubscription[] = [
  { topic: BITSTREAM2_TOPICS.HELLO, qos: 0, channel: "json" },
  { topic: BITSTREAM2_TOPICS.METRICS, qos: 0, channel: "json" },
  { topic: BITSTREAM2_TOPICS.EVT_SENSOR, qos: 0, channel: "json" },
  { topic: BITSTREAM2_TOPICS.RES, qos: 0, channel: "json" },
  { topic: BITSTREAM2_TOPICS.DEV_STATUS, qos: 0, channel: "json" },
  { topic: BITSTREAM2_TOPICS.DEV_SIM_STATE, qos: 0, channel: "json" },
  { topic: SERIALPORT_TOPICS.STATUS, qos: 0, channel: "json" },
  { topic: T3D_WS_BROKER_MONITOR_TOPIC, qos: 0, channel: "json" },
] as const;

/** High-volume; opt-in from Topic Tap UI. */
export const LAB_OPTIONAL_HIGH_VOLUME_TOPICS: readonly LabTopicSubscription[] = [
  { topic: SERIALPORT_TOPICS.DATA, qos: 0, channel: "binary" },
  { topic: SERIALPORT_TOPICS.RUNTIME_SNAPSHOT, qos: 0, channel: "json" },
  { topic: SERIALPORT_TOPICS.RUNTIME_OPERATION, qos: 0, channel: "json" },
  { topic: SERIALPORT_TOPICS.FIRMWARE_LIVENESS, qos: 0, channel: "json" },
] as const;

/** Topics mirrored on `t3d/broker/monitor` as `message-published` when high-volume opt-in is off. */
export function isLabHighVolumePublishTopic(topic: string): boolean {
  if (topic === SERIALPORT_TOPICS.DATA || topic === SERIALPORT_TOPICS.RUNTIME_SNAPSHOT)
  {
    return true;
  }
  if (
    topic === SERIALPORT_TOPICS.RUNTIME_OPERATION ||
    topic === SERIALPORT_TOPICS.FIRMWARE_LIVENESS
  )
  {
    return true;
  }
  return topic.startsWith("bitstream2/evt");
}

export function topicMatchesFilter(topic: string, filter: string): boolean {
  const f = filter.trim().toLowerCase();
  if (f.length === 0)
  {
    return true;
  }
  return topic.toLowerCase().includes(f);
}
