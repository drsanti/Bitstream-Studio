/*******************************************************************************
 * File Name : BitstreamLab.tsx
 *
 * Description : Bitstream Lab shell — workbench, link bar, health strip, WS session.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useRef, useState } from "react";
import { StandaloneWorkbench, type StandaloneWorkbenchHandle } from "../ui/workbench";
import "../ui/workbench/workbench.css";
import { BITSTREAM2_TOPICS } from "../../bitstream2/bridge/protocol";
import { LabHealthStrip } from "./components/LabHealthStrip";
import { LabLinkBar } from "./components/LabLinkBar";
import { useLabHealth } from "./hooks/useLabHealth";
import { useLabSerialPort } from "./hooks/useLabSerialPort";
import { useLabSession } from "./hooks/useLabSession";
import { useLabTopicTap } from "./hooks/useLabTopicTap";
import { useLabActivityStore } from "./store/labActivity.store";
import { DEFAULT_LAB_WORKBENCH_LAYOUT } from "./workbench/default-lab-workbench-layout";
import { LAB_WORKBENCH_REGISTRY } from "./workbench/lab-workbench-registry";
import { LabWorkbenchShellProvider, type LabTelemetryMode } from "./workbench/lab-workbench-context";
import { useWsClientStore } from "../ws-client-store";

export type BitstreamLabProps = {
  defaultWsUrl?: string;
  autoConnect?: boolean;
};

/**
 * Self-contained transport debugger (broker → bridge → BS2).
 */
export function BitstreamLab(props: BitstreamLabProps) {
  const workbenchRef = useRef<StandaloneWorkbenchHandle>(null);
  const session = useLabSession({
    autoConnect: props.autoConnect ?? true,
  });

  useEffect(() => {
    if (props.defaultWsUrl != null && props.defaultWsUrl.length > 0)
    {
      session.setWsUrl(props.defaultWsUrl);
    }
  }, [props.defaultWsUrl, session.setWsUrl]);

  const health = useLabHealth(session.isConnected);
  const serial = useLabSerialPort({ wsConnected: session.isConnected });
  const appendActivity = useLabActivityStore((s) => s.append);
  const wsPublish = useWsClientStore((s) => s.publish);
  const [includeSerialData, setIncludeSerialData] = useState(false);
  const [telemetryMode, setTelemetryModeState] = useState<LabTelemetryMode>("uart");
  useLabTopicTap({ isConnected: session.isConnected, includeSerialData });

  const setTelemetryMode = useCallback(
    (mode: LabTelemetryMode) => {
      setTelemetryModeState(mode);

      // Control the mock MCU stream when loopback is available on the bridge.
      // If loopback is off, the bridge will ignore this topic; still publish so
      // loopback-enabled bridges (or later reconnects) pick up the intended mode.
      if (!session.isConnected) {
        return;
      }
      if (!health.loopbackOn && mode === "simulator") {
        appendActivity({
          text: "Simulator mode selected, but external simulator is offline. Start bitstream-simulator extension + bridge.",
          tone: "warning",
        });
      }

      const payload =
        mode === "simulator"
          ? ({ mode: "run" } as const)
          : ({ mode: "idle" } as const);

      void wsPublish(BITSTREAM2_TOPICS.DEV_SIM_CONTROL, payload, 0).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        appendActivity({ text: `Sim control publish failed: ${msg}`, tone: "error" });
      });

      appendActivity({
        text: mode === "simulator" ? "Telemetry mode: Simulator (dev/sim/control run)" : "Telemetry mode: UART (dev/sim/control idle)",
        tone: "info",
      });
    },
    [appendActivity, health.loopbackOn, session.isConnected, wsPublish],
  );

  // If loopback becomes available after the user already selected a mode,
  // publish the effective sim control so the mock MCU matches the UI mode.
  useEffect(() => {
    if (!session.isConnected || !health.loopbackOn) {
      return;
    }
    const payload =
      telemetryMode === "simulator"
        ? ({ mode: "run" } as const)
        : ({ mode: "idle" } as const);
    void wsPublish(BITSTREAM2_TOPICS.DEV_SIM_CONTROL, payload, 0).catch(() => {
      /* activity is optional; avoid spam on reconnect */
    });
  }, [health.loopbackOn, session.isConnected, telemetryMode, wsPublish]);

  const onResetLayout = () => {
    workbenchRef.current?.resetLayout();
  };

  return (
    <div className="t3d-shell-overlay pointer-events-auto flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <LabWorkbenchShellProvider
        value={{
          session,
          health,
          serial,
          telemetryMode,
          setTelemetryMode,
          includeSerialData,
          setIncludeSerialData,
          appendActivity,
          onResetLayout,
        }}
      >
        <LabLinkBar />
        <LabHealthStrip />
        <main className="relative min-h-0 flex-1 px-2 pb-2 pt-1">
          <StandaloneWorkbench
            ref={workbenchRef}
            initialLayout={DEFAULT_LAB_WORKBENCH_LAYOUT}
            registry={LAB_WORKBENCH_REGISTRY}
            persistenceKey="bitstream-lab"
          />
        </main>
      </LabWorkbenchShellProvider>
    </div>
  );
}
