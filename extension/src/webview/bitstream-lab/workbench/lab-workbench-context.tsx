/*******************************************************************************
 * File Name : lab-workbench-context.tsx
 *
 * Description : React context for Bitstream Lab shell (session, health, tap).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { createContext, useContext, type ReactNode } from "react";
import type { LabSerialPortApi } from "../hooks/useLabSerialPort";
import type { LabSessionApi } from "../hooks/useLabSession";
import type { LabActivityTone, LabHealthSnapshot } from "../types/labTypes";

export type LabTelemetryMode = "uart" | "simulator";

export type LabWorkbenchShellValue = {
  session: LabSessionApi;
  health: LabHealthSnapshot;
  serial: LabSerialPortApi;
  telemetryMode: LabTelemetryMode;
  setTelemetryMode: (mode: LabTelemetryMode) => void;
  includeSerialData: boolean;
  setIncludeSerialData: (on: boolean) => void;
  appendActivity: (partial: { text: string; tone?: LabActivityTone; atMs?: number }) => void;
  onResetLayout: () => void;
};

const LabWorkbenchShellContext = createContext<LabWorkbenchShellValue | null>(null);

export function LabWorkbenchShellProvider(props: {
  value: LabWorkbenchShellValue;
  children: ReactNode;
}): React.ReactElement {
  return (
    <LabWorkbenchShellContext.Provider value={props.value}>
      {props.children}
    </LabWorkbenchShellContext.Provider>
  );
}

export function useLabWorkbenchShell(): LabWorkbenchShellValue {
  const ctx = useContext(LabWorkbenchShellContext);
  if (ctx == null)
  {
    throw new Error("useLabWorkbenchShell must be used within LabWorkbenchShellProvider");
  }
  return ctx;
}
