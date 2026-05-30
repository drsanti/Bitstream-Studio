/*******************************************************************************
 * File Name : abbRobot.store.ts
 *
 * Description : UI state for ABB robot control mode.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";

export type AbbControlMode = "direct" | "mqtt";

type AbbRobotStoreState = {
  controlMode: AbbControlMode;
  setControlMode: (mode: AbbControlMode) => void;
};

export const useAbbRobotStore = create<AbbRobotStoreState>((set) => ({
  controlMode: "direct",
  setControlMode: (mode) => set({ controlMode: mode }),
}));
