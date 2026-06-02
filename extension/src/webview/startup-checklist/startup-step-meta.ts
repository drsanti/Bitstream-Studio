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
  /** Shown on hover over the step title (TRNTooltip). */
  titleTooltip: string;
  icon: LucideIcon;
};

export const STARTUP_ENVIRONMENT_STEPS: StartupStepMeta[] = [
  {
    id: "assets",
    title: "Asset library",
    subtitle: ternionFreeAssetPackCopy.librarySubtitle,
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepAssets,
    icon: Box,
  },
  {
    id: "network",
    title: "Network",
    subtitle: ternionFreeAssetPackCopy.networkSubtitle,
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepNetwork,
    icon: Globe,
  },
  {
    id: "mode",
    title: "Data source",
    subtitle: "Simulator or hardware connection",
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepMode,
    icon: Radio,
  },
];

const LINK_STEP_META: Record<
  Exclude<StartupStepId, "assets" | "network" | "mode">,
  StartupStepMeta
> = {
  bridge: {
    id: "bridge",
    title: "Connection service",
    subtitle: "Background link for device data",
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepBridge,
    icon: Server,
  },
  websocket: {
    id: "websocket",
    title: "App link",
    subtitle: "Connect this window to the service",
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepWebsocket,
    icon: Cable,
  },
  "serial-ports": {
    id: "serial-ports",
    title: "Board connection",
    subtitle: "Choose and open your device port",
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepSerialPorts,
    icon: Usb,
  },
  simulator: {
    id: "simulator",
    title: "Simulator",
    subtitle: "Virtual device for testing",
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepSimulator,
    icon: Cpu,
  },
  handshake: {
    id: "handshake",
    title: "Device check",
    subtitle: "Confirm firmware responds",
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepHandshake,
    icon: Handshake,
  },
  "link-ready": {
    id: "link-ready",
    title: "Ready",
    subtitle: "Live data and settings",
    titleTooltip: ternionFreeAssetPackCopy.tooltips.stepLinkReady,
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
