import type { LucideIcon } from "lucide-react";
import {
  Box,
  Cable,
  Cpu,
  Globe,
  Handshake,
  Link2,
  Radio,
  Server,
  Usb,
} from "lucide-react";
import type { ConnectionStepId } from "../bitstream-app/connection/connectionPanel.store.js";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";

export type StartupStepId =
  | "assets"
  | "network"
  | "mode"
  | "bridge"
  | "websocket"
  | "serial-ports"
  | "simulator"
  | "handshake"
  | "link-ready";

export type StartupStepMeta = {
  id: StartupStepId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

export const STARTUP_ENVIRONMENT_STEPS: StartupStepMeta[] = [
  {
    id: "assets",
    title: "Asset library",
    subtitle: ternionFreeAssetPackCopy.librarySubtitle,
    icon: Box,
  },
  {
    id: "network",
    title: "Network",
    subtitle: ternionFreeAssetPackCopy.networkSubtitle,
    icon: Globe,
  },
  {
    id: "mode",
    title: "Data source",
    subtitle: "Bitstream (UART) or Simulator (virtual MCU)",
    icon: Radio,
  },
];

const LINK_STEP_META: Record<
  Exclude<StartupStepId, "assets" | "network" | "mode">,
  StartupStepMeta
> = {
  bridge: {
    id: "bridge",
    title: "Bridge (broker)",
    subtitle: "WebSocket broker and UART bridge",
    icon: Server,
  },
  websocket: {
    id: "websocket",
    title: "WebSocket client",
    subtitle: "Connect webview to the broker",
    icon: Cable,
  },
  "serial-ports": {
    id: "serial-ports",
    title: "Serial port",
    subtitle: "List, select, and open COM @ 921600",
    icon: Usb,
  },
  simulator: {
    id: "simulator",
    title: "External simulator",
    subtitle: "bitstream-simulator VSIX streaming",
    icon: Cpu,
  },
  handshake: {
    id: "handshake",
    title: "BS2 handshake",
    subtitle: "Firmware HELLO and link verification",
    icon: Handshake,
  },
  "link-ready": {
    id: "link-ready",
    title: "Link ready",
    subtitle: "Telemetry and sensor settings unlocked",
    icon: Link2,
  },
};

export function connectionStepToStartupId(
  id: ConnectionStepId,
  backend: "uart" | "simulator",
): StartupStepId | null {
  if (id === "source") {
    return null;
  }
  if (id === "transport") {
    return backend === "simulator" ? "simulator" : "serial-ports";
  }
  if (id === "link") {
    return "link-ready";
  }
  return id as StartupStepId;
}

export function getStartupStepMeta(id: StartupStepId): StartupStepMeta {
  const env = STARTUP_ENVIRONMENT_STEPS.find((s) => s.id === id);
  if (env != null) {
    return env;
  }
  return LINK_STEP_META[id];
}

export function linkStartupStepOrder(backend: "uart" | "simulator"): StartupStepId[] {
  const base: StartupStepId[] = ["bridge", "websocket"];
  if (backend === "simulator") {
    return [...base, "simulator", "link-ready"];
  }
  return [...base, "serial-ports", "handshake", "link-ready"];
}
