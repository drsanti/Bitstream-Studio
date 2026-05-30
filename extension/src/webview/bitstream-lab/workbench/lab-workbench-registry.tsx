/*******************************************************************************
 * File Name : lab-workbench-registry.tsx
 *
 * Description : WorkbenchRegistry entries for all Bitstream Lab panes.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  Activity,
  LineChart,
  List,
  Radio,
  Repeat,
  ScrollText,
  Send,
  Usb,
} from "lucide-react";
import type { WorkbenchRegistry } from "../../ui/workbench";
import { ActivityLogPanel } from "../components/panels/ActivityLogPanel";
import { BrokerObservabilityPanel } from "../components/panels/BrokerObservabilityPanel";
import { Bs2SmokePanel } from "../components/panels/Bs2SmokePanel";
import { SerialPanel } from "../components/panels/SerialPanel";
import { TopicTapPanel } from "../components/panels/TopicTapPanel";
import { LabPanelStub } from "../components/shared/LabPanelStub";

function BridgeStubPanel() {
  return <LabPanelStub title="Bridge" phase="Phase 7 — UART/decode rates (BRIDGE_OBSERVABILITY.md)." />;
}

function LoopbackStubPanel() {
  return <LabPanelStub title="Loopback" phase="Phase 4 — sim control." />;
}

function PublishStubPanel() {
  return <LabPanelStub title="Publish console" phase="Phase 4 — manual publish." />;
}

function ProtocolStubPanel() {
  return <LabPanelStub title="Protocol analytics" phase="Phase 6 — frames, rates, quality." />;
}

export const LAB_WORKBENCH_REGISTRY: WorkbenchRegistry = {
  tap: {
    icon: <List className="size-3.5" aria-hidden />,
    label: "Topic Tap",
    component: TopicTapPanel,
  },
  activity: {
    icon: <ScrollText className="size-3.5" aria-hidden />,
    label: "Activity",
    component: ActivityLogPanel,
  },
  broker: {
    icon: <Radio className="size-3.5" aria-hidden />,
    label: "Broker",
    component: BrokerObservabilityPanel,
  },
  bridge: {
    icon: <Usb className="size-3.5" aria-hidden />,
    label: "Bridge",
    component: BridgeStubPanel,
  },
  serial: {
    icon: <Usb className="size-3.5" aria-hidden />,
    label: "Serial",
    component: SerialPanel,
  },
  bs2: {
    icon: <Activity className="size-3.5" aria-hidden />,
    label: "BS2",
    component: Bs2SmokePanel,
  },
  loopback: {
    icon: <Repeat className="size-3.5" aria-hidden />,
    label: "Loopback",
    component: LoopbackStubPanel,
  },
  publish: {
    icon: <Send className="size-3.5" aria-hidden />,
    label: "Publish",
    component: PublishStubPanel,
  },
  protocol: {
    icon: <LineChart className="size-3.5" aria-hidden />,
    label: "Protocol",
    component: ProtocolStubPanel,
  },
};
