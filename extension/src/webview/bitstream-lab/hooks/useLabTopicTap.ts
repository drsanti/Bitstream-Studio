/*******************************************************************************
 * File Name : useLabTopicTap.ts
 *
 * Description : Subscribes lab topics and feeds the topic tap ring buffer.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState } from "react";
import { BITSTREAM2_TOPICS } from "../../../bitstream2/bridge/protocol";
import type { T3DWsQos } from "../../../websocket/T3DWebSocketServer";
import {
  isLabHighVolumePublishTopic,
  LAB_DEFAULT_TOPIC_SUBSCRIPTIONS,
  LAB_OPTIONAL_HIGH_VOLUME_TOPICS,
} from "../lib/labTopics";
import { SERIALPORT_TOPICS } from "../../../serialport-bridge/protocol";
import { T3D_WS_BROKER_MONITOR_TOPIC, isBrokerMonitorEnvelope } from "../../../websocket/broker-monitor-events";
import {
  estimateJsonBytes,
  formatBinaryPreview,
  formatPayloadPreview,
} from "../lib/formatPayload";
import { useLabTopicTapStore } from "../store/labTopicTap.store";
import { useWsClientStore } from "../../ws-client-store";

const LISTENER_ID = "bitstream-lab-tap";

const EVT_SENSOR_THROTTLE_MS = 250;
const STATUS_THROTTLE_MS = 250;
const BROKER_MONITOR_THROTTLE_MS = 200;
const SERIAL_DATA_THROTTLE_MS = 250;

export type UseLabTopicTapOptions = {
  isConnected: boolean;
  includeSerialData: boolean;
};

/**
 * Registers WS listeners and subscriptions for Topic Tap capture.
 */
export function useLabTopicTap(options: UseLabTopicTapOptions): {
  includeSerialData: boolean;
  setIncludeSerialData: (on: boolean) => void;
} {
  const { isConnected } = options;
  const [includeSerialData, setIncludeSerialData] = useState(false);
  const append = useLabTopicTapStore((s) => s.append);
  const throttleEvtSensor = useLabTopicTapStore((s) => s.throttleEvtSensor);
  const lastEvtSensorAtRef = useRef(0);
  const lastStatusAtRef = useRef(0);
  const lastBrokerMonitorAtRef = useRef(0);
  const lastSerialDataAtRef = useRef(0);

  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const unsubscribeTopic = useWsClientStore((s) => s.unsubscribeTopic);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);
  const addBinaryListener = useWsClientStore((s) => s.addBinaryListener);
  const removeBinaryListener = useWsClientStore((s) => s.removeBinaryListener);

  useEffect(() => {
    if (!isConnected)
    {
      return;
    }

    const subs = [...LAB_DEFAULT_TOPIC_SUBSCRIPTIONS];
    if (includeSerialData)
    {
      subs.push(...LAB_OPTIONAL_HIGH_VOLUME_TOPICS);
    }

    for (const s of subs)
    {
      void subscribeTopic(s.topic, s.qos, s.channel);
    }

    const onJson = (topic: string, payload: unknown, qos: T3DWsQos) => {
      const now = Date.now();

      if (topic === T3D_WS_BROKER_MONITOR_TOPIC)
      {
        if (isBrokerMonitorEnvelope(payload) && payload.kind === "message-published")
        {
          if (!includeSerialData && isLabHighVolumePublishTopic(payload.topic))
          {
            return;
          }
        }
        if (now - lastBrokerMonitorAtRef.current < BROKER_MONITOR_THROTTLE_MS)
        {
          return;
        }
        lastBrokerMonitorAtRef.current = now;
      }

      if (topic === SERIALPORT_TOPICS.STATUS)
      {
        if (now - lastStatusAtRef.current < STATUS_THROTTLE_MS)
        {
          return;
        }
        lastStatusAtRef.current = now;
      }

      if (topic === BITSTREAM2_TOPICS.EVT_SENSOR && throttleEvtSensor)
      {
        if (now - lastEvtSensorAtRef.current < EVT_SENSOR_THROTTLE_MS)
        {
          return;
        }
        lastEvtSensorAtRef.current = now;
      }

      append({
        atMs: Date.now(),
        topic,
        channel: "json",
        qos,
        payloadPreview: formatPayloadPreview(payload),
        payloadBytes: estimateJsonBytes(topic, payload),
        payloadJson: payload,
      });
    };

    const onBinary = (topic: string, data: Uint8Array, qos: T3DWsQos) => {
      if (topic === SERIALPORT_TOPICS.DATA)
      {
        const now = Date.now();
        if (now - lastSerialDataAtRef.current < SERIAL_DATA_THROTTLE_MS)
        {
          return;
        }
        lastSerialDataAtRef.current = now;
      }

      append({
        atMs: Date.now(),
        topic,
        channel: "binary",
        qos,
        payloadPreview: formatBinaryPreview(data),
        payloadBytes: data.byteLength,
      });
    };

    addMessageListener(LISTENER_ID, onJson);
    addBinaryListener(LISTENER_ID, onBinary);

    return () => {
      removeMessageListener(LISTENER_ID);
      removeBinaryListener(LISTENER_ID);
      for (const s of subs)
      {
        void unsubscribeTopic(s.topic, s.channel);
      }
    };
  }, [
    isConnected,
    includeSerialData,
    throttleEvtSensor,
    append,
    subscribeTopic,
    unsubscribeTopic,
    addMessageListener,
    removeMessageListener,
    addBinaryListener,
    removeBinaryListener,
  ]);

  return { includeSerialData, setIncludeSerialData };
}
