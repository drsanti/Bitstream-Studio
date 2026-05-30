import { useEffect, useRef } from "react";
import { QuickActionDialog, useQuickAction } from "@ternion/t3d/ui";
import { Activity, Box, FlaskConical } from "lucide-react";
import { BitstreamAppMain } from "./bitstream-app/BitstreamAppMain";
import { Bitstream2SimulatorApp } from "./bitstream2-simulator";
import { MyApp } from "./MyApp";
import { WebviewLauncher } from "./webview-launcher";
import { navigateToDevLauncher } from "./state/webviewDevNavigation";
import {
  useWebviewEntryStore,
  type WebviewShellEntry,
} from "./state/webviewEntry.store";

function WebviewEntryBody({ entry }: { entry: WebviewShellEntry }) {
  switch (entry) {
    case "bitstream":
      return <BitstreamAppMain />;
    case "bitstream2Sim":
      return <Bitstream2SimulatorApp />;
    case "digitalTwin":
    default:
      return <MyApp />;
  }
}

/**
 * Top-level shell: launcher, one active app, shared Quick Action palette.
 */
export function WebviewRoot() {
  const entry = useWebviewEntryStore((s) => s.entry);
  const showLauncher = useWebviewEntryStore((s) => s.showLauncher);
  const requestEntrySwitch = useWebviewEntryStore((s) => s.requestEntrySwitch);
  const { registerCommand, unregisterCommand } = useQuickAction();
  const commandsRegisteredRef = useRef(false);

  useEffect(() => {
    if (commandsRegisteredRef.current) {
      return;
    }
    commandsRegisteredRef.current = true;

    const mk = (
      id: string,
      label: string,
      target: WebviewShellEntry,
      icon: typeof Box,
      keywords: string[],
    ) => ({
      id,
      label,
      icon,
      keywords: ["webview", "app", "switch", ...keywords],
      action: () => {
        requestEntrySwitch(target);
      },
    });

    registerCommand(
      mk("webview-open-digital-twin", "Open TERNION Digital Twin", "digitalTwin", Box, [
        "myapp",
        "3d",
        "engine",
      ]),
    );
    registerCommand(
      mk("webview-open-bitstream", "Open TERNION Sensor Studio", "bitstream", Activity, [
        "bitstream",
        "sensor",
        "sensor-telemetry",
        "serial",
      ]),
    );
    registerCommand(
      mk(
        "webview-open-bitstream2-sim",
        "Open BS2 firmware simulator (dev)",
        "bitstream2Sim",
        FlaskConical,
        ["bitstream2", "simulator", "loopback", "bs"],
      ),
    );
    registerCommand({
      id: "webview-show-launcher",
      label: "Show application launcher",
      icon: Box,
      keywords: ["webview", "launcher", "home", "choose", "app"],
      action: () => {
        navigateToDevLauncher();
      },
    });

    return () => {
      commandsRegisteredRef.current = false;
      unregisterCommand("webview-open-digital-twin");
      unregisterCommand("webview-open-bitstream");
      unregisterCommand("webview-open-bitstream2-sim");
      unregisterCommand("webview-show-launcher");
    };
  }, [registerCommand, requestEntrySwitch, unregisterCommand]);

  if (showLauncher) {
    return (
      <>
        <WebviewLauncher />
        <QuickActionDialog />
      </>
    );
  }

  return (
    <>
      <WebviewEntryBody key={entry} entry={entry} />
      <QuickActionDialog />
    </>
  );
}
