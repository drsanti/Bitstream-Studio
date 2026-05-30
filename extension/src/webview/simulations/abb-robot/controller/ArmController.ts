/*******************************************************************************
 * File Name : ArmController.ts
 *
 * Description : ABB arm joint control with optional MQTT actuators/sensors.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { MqttClient } from "mqtt";
import * as THREE from "three";
import { ArmLink } from "./ArmLink.js";

const TOPIC_ACTUATORS = "robot/actuators";
const TOPIC_SENSORS_GET = "robot/sensors/get";
const TOPIC_SENSORS = "robot/sensors";

export type AbbMqttStats = {
  sentCount: number;
  receivedCount: number;
  lastTopic: string | null;
  lastDirection: "sent" | "received" | null;
  lastTimestamp: number | null;
  lastError: string | null;
};

/**
 * Drives Link1–Link6; MQTT is attached explicitly (no singleton).
 */
export class ArmController
{
  readonly links: ArmLink[];
  private mqttClient: MqttClient | null = null;
  private messageHandler: ((topic: string, payload: Buffer) => void) | null = null;
  private disposed = false;
  private lastPublishTime = 0;
  private readonly publishIntervalMs = 200;
  private mqttStats: AbbMqttStats = {
    sentCount: 0,
    receivedCount: 0,
    lastTopic: null,
    lastDirection: null,
    lastTimestamp: null,
    lastError: null,
  };

  constructor(links: ArmLink[])
  {
    this.links = links;
  }

  /** Wire MQTT subscriptions and inbound command handling. */
  attachMqttClient(client: MqttClient): void
  {
    this.detachMqttClient();
    this.mqttClient = client;
    client.subscribe(TOPIC_ACTUATORS);
    client.subscribe(TOPIC_SENSORS_GET);

    this.messageHandler = (topic: string, payload: Buffer) =>
    {
      if (this.disposed)
      {
        return;
      }
      this.mqttStats.receivedCount += 1;
      this.mqttStats.lastTopic = topic;
      this.mqttStats.lastDirection = "received";
      this.mqttStats.lastTimestamp = Date.now();
      this.handleMqttMessage(topic, payload.toString());
    };
    client.on("message", this.messageHandler);
  }

  /** Removes listeners; does not end the shared client. */
  detachMqttClient(): void
  {
    if (this.mqttClient != null && this.messageHandler != null)
    {
      this.mqttClient.off("message", this.messageHandler);
    }
    this.messageHandler = null;
    this.mqttClient = null;
  }

  isConnected(): boolean
  {
    return !this.disposed && (this.mqttClient?.connected ?? false);
  }

  getMqttStats(): AbbMqttStats
  {
    return { ...this.mqttStats };
  }

  /**
   * UI direct move (no MQTT publish).
   */
  moveLinkDirectly(
    linkId: number,
    angle: number,
    duration: number,
    ease: string,
  ): void
  {
    if (!this.validateMove(linkId, angle, duration))
    {
      return;
    }
    this.rotateToAngle(linkId, angle, duration, ease);
  }

  /**
   * Publish robot/actuators and apply locally.
   */
  publishMoveCommand(
    linkId: number,
    angle: number,
    duration: number,
    ease: string,
  ): void
  {
    if (this.disposed || this.mqttClient == null || !this.mqttClient.connected)
    {
      return;
    }
    if (!this.validateMove(linkId, angle, duration))
    {
      return;
    }

    const payload = JSON.stringify({ linkId, angle, duration, ease });
    this.mqttClient.publish(TOPIC_ACTUATORS, payload);
    this.recordSent(TOPIC_ACTUATORS);
    this.rotateToAngle(linkId, angle, duration, ease);
  }

  rotateToAngle(
    linkId: number,
    angle: number,
    duration = 0.5,
    ease = "power2.out",
  ): void
  {
    if (this.disposed)
    {
      return;
    }

    const link = this.links[linkId];
    if (link == null)
    {
      return;
    }

    const publishSensor = (rotation: THREE.Vector3): void =>
    {
      if (this.disposed || this.mqttClient == null || !this.mqttClient.connected)
      {
        return;
      }
      const now = Date.now();
      if (now - this.lastPublishTime < this.publishIntervalMs)
      {
        return;
      }
      this.lastPublishTime = now;
      this.mqttClient.publish(
        TOPIC_SENSORS,
        JSON.stringify({
          linkId,
          angle: rotation.clone().multiplyScalar(180 / Math.PI),
        }),
      );
      this.recordSent(TOPIC_SENSORS);
    };

    link.rotateToAngle(angle, duration, ease, publishSensor, publishSensor);
  }

  async dispose(): Promise<void>
  {
    this.disposed = true;
    this.detachMqttClient();
    for (const link of this.links)
    {
      link.dispose();
    }
  }

  private recordSent(topic: string): void
  {
    this.mqttStats.sentCount += 1;
    this.mqttStats.lastTopic = topic;
    this.mqttStats.lastDirection = "sent";
    this.mqttStats.lastTimestamp = Date.now();
  }

  private validateMove(linkId: number, angle: number, duration: number): boolean
  {
    if (this.disposed)
    {
      return false;
    }
    if (linkId < 0 || linkId >= this.links.length)
    {
      return false;
    }
    if (angle < -180 || angle > 180)
    {
      return false;
    }
    if (duration < 0.2 || duration > 30)
    {
      return false;
    }
    return true;
  }

  private handleMqttMessage(topic: string, raw: string): void
  {
    try
    {
      const data = JSON.parse(raw) as Record<string, unknown>;

      if (topic === TOPIC_ACTUATORS)
      {
        const linkId = Number(data.linkId);
        const angle = Number(data.angle);
        const duration = Number(data.duration);
        const ease = String(data.ease ?? "power2.out");
        this.rotateToAngle(linkId, angle, duration, ease);
        return;
      }

      if (topic === TOPIC_SENSORS_GET)
      {
        const linkId = Number(data.linkId);
        const link = this.links[linkId];
        if (link == null || this.mqttClient == null)
        {
          return;
        }
        this.mqttClient.publish(
          TOPIC_SENSORS,
          JSON.stringify({
            linkId,
            angle: new THREE.Vector3(
              link.object.rotation.x,
              link.object.rotation.y,
              link.object.rotation.z,
            ).multiplyScalar(180 / Math.PI),
          }),
        );
        this.recordSent(TOPIC_SENSORS);
      }
    }
    catch (err: unknown)
    {
      this.mqttStats.lastError =
        err instanceof Error ? err.message : String(err);
    }
  }
}
