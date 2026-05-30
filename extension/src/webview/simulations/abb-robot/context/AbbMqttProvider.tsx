/*******************************************************************************
 * File Name : AbbMqttProvider.tsx
 *
 * Description : Single MQTT hook for ABB app; attaches client to ArmController.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import {
  useSimulationMqtt,
  type UseSimulationMqttResult,
} from "../../shared/mqtt/useSimulationMqtt.js";
import { useAbbRobot } from "./AbbRobotContext.js";

const AbbMqttContext = createContext<UseSimulationMqttResult | null>(null);

export type AbbMqttProviderProps = {
  children: ReactNode;
};

/**
 * Shares one MQTT client across ABB panels and wires it to ArmController.
 */
export function AbbMqttProvider({ children }: AbbMqttProviderProps)
{
  const mqtt = useSimulationMqtt();
  const { controller } = useAbbRobot();

  useEffect(() =>
  {
    if (!mqtt.isConnected || mqtt.client == null || controller == null)
    {
      return;
    }
    controller.attachMqttClient(mqtt.client);
    return () =>
    {
      controller.detachMqttClient();
    };
  }, [controller, mqtt.client, mqtt.isConnected]);

  return (
    <AbbMqttContext.Provider value={mqtt}>{children}</AbbMqttContext.Provider>
  );
}

/** MQTT API for ABB simulation panels. */
export function useAbbMqtt(): UseSimulationMqttResult
{
  const ctx = useContext(AbbMqttContext);
  if (ctx == null)
  {
    throw new Error("useAbbMqtt must be used within AbbMqttProvider");
  }
  return ctx;
}
