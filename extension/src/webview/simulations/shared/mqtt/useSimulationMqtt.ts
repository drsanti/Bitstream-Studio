/*******************************************************************************
 * File Name : useSimulationMqtt.ts
 *
 * Description : React hook for simulation MQTT connect/disconnect/publish.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { MqttClient } from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";
import { connectSimulationMqtt } from "./connectSimulationMqtt.js";

export type UseSimulationMqttResult = {
  isConnected: boolean;
  activeBrokerUrl: string | null;
  lastError: string | null;
  connect: (brokerUrl?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  publish: (topic: string, payload: string) => void;
  subscribe: (topic: string) => void;
  client: MqttClient | null;
};

/**
 * Manages one MQTT client per hook instance; disconnects on unmount.
 */
export function useSimulationMqtt(): UseSimulationMqttResult
{
  const clientRef = useRef<MqttClient | null>(null);
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeBrokerUrl, setActiveBrokerUrl] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const disconnect = useCallback(async () =>
  {
    const client = clientRef.current;
    clientRef.current = null;
    setClient(null);
    setIsConnected(false);
    setActiveBrokerUrl(null);
    if (client != null)
    {
      await new Promise<void>((resolve) =>
      {
        client.end(false, {}, () => resolve());
      });
    }
  }, []);

  const connect = useCallback(
    async (brokerUrl?: string) =>
    {
      await disconnect();
      try
      {
        const connectedClient = await connectSimulationMqtt({ brokerUrl });
        clientRef.current = connectedClient;
        setClient(connectedClient);
        setActiveBrokerUrl(brokerUrl ?? "connected");
        setIsConnected(true);
        setLastError(null);
      }
      catch (err: unknown)
      {
        const message = err instanceof Error ? err.message : String(err);
        setLastError(message);
        setIsConnected(false);
        throw err;
      }
    },
    [disconnect],
  );

  const publish = useCallback((topic: string, payload: string) =>
  {
    const client = clientRef.current;
    if (client == null || !client.connected)
    {
      return;
    }
    client.publish(topic, payload);
  }, []);

  const subscribe = useCallback((topic: string) =>
  {
    const client = clientRef.current;
    if (client == null || !client.connected)
    {
      return;
    }
    client.subscribe(topic);
  }, []);

  useEffect(() =>
  {
    return () =>
    {
      void disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    activeBrokerUrl,
    lastError,
    connect,
    disconnect,
    publish,
    subscribe,
    client,
  };
}
