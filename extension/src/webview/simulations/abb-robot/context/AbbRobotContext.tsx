/*******************************************************************************
 * File Name : AbbRobotContext.tsx
 *
 * Description : React context for ABB ArmController instance.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { createContext, useContext, type ReactNode, useMemo, useState } from "react";
import type { ArmController } from "../controller/ArmController.js";

export type AbbRobotContextValue = {
  controller: ArmController | null;
  setController: (controller: ArmController | null) => void;
  linksReady: boolean;
  setLinksReady: (ready: boolean) => void;
};

const AbbRobotContext = createContext<AbbRobotContextValue | null>(null);

export type AbbRobotProviderProps = {
  children: ReactNode;
};

/**
 * Provides controller ref set by AbbRobotScene after GLB links resolve.
 */
export function AbbRobotProvider({ children }: AbbRobotProviderProps)
{
  const [controller, setController] = useState<ArmController | null>(null);
  const [linksReady, setLinksReady] = useState(false);

  const value = useMemo(
    () => ({ controller, setController, linksReady, setLinksReady }),
    [controller, linksReady],
  );

  return (
    <AbbRobotContext.Provider value={value}>{children}</AbbRobotContext.Provider>
  );
}

/** Access ABB controller from panels or scene. */
export function useAbbRobot(): AbbRobotContextValue
{
  const ctx = useContext(AbbRobotContext);
  if (ctx == null)
  {
    throw new Error("useAbbRobot must be used within AbbRobotProvider");
  }
  return ctx;
}
