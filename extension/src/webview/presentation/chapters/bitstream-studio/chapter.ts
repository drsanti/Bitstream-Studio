import { lazy } from "react";

import type { ChapterDefinition } from "../types";



export const bitstreamStudioChapter: ChapterDefinition = {

  id: "bitstream-studio",

  title: "Bitstream Studio",

  subtitle: "Platform overview",

  icon: "Layers",

  order: 0,

  slides: [

    {

      id: "bss-title",

      title: "Bitstream Studio",

      subtitle: "Training deck entry",

      mode: "theory",

      section: "opening",

      notes: () => import("./slides/bss-title/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-title/BssTitleSlide")),

    },

    {

      id: "bss-objectives",

      title: "Learning objectives",

      subtitle: "Platform chapter goals",

      mode: "theory",

      section: "opening",

      notes: () => import("./slides/bss-objectives/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-objectives/BssObjectivesSlide")),

    },

    {

      id: "bss-problem",

      title: "The problem",

      subtitle: "Why Bitstream Studio exists",

      mode: "theory",

      section: "overview",

      notes: () => import("./slides/bss-problem/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-problem/BssProblemSlide")),

    },

    {

      id: "bss-architecture",

      title: "System architecture",

      subtitle: "Sensor to webview data path",

      mode: "theory",

      section: "overview",

      notes: () => import("./slides/bss-architecture/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-architecture/BssArchitectureSlide")),

    },

    {

      id: "bss-workspaces",

      title: "Three workspaces",

      subtitle: "Telemetry · Studio · Presentation",

      mode: "theory",

      section: "overview",

      notes: () => import("./slides/bss-workspaces/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-workspaces/BssWorkspacesSlide")),

    },

    {

      id: "bss-extension",

      title: "VS Code extension",

      subtitle: "Dev URL vs installed VSIX",

      mode: "theory",

      section: "overview",

      notes: () => import("./slides/bss-extension/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-extension/BssExtensionSlide")),

    },

    {

      id: "bss-telemetry-intro",

      title: "Sensor Telemetry",

      subtitle: "Operator console",

      mode: "theory",

      section: "telemetry",

      notes: () => import("./slides/bss-telemetry-intro/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-telemetry-intro/BssTelemetryIntroSlide")),

    },

    {

      id: "bss-telemetry-connect",

      title: "Connecting hardware",

      subtitle: "COM · baud · HELLO",

      mode: "theory",

      section: "telemetry",

      notes: () => import("./slides/bss-telemetry-connect/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-telemetry-connect/BssTelemetryConnectSlide")),

    },

    {

      id: "bss-telemetry-modes",

      title: "Bitstream vs Simulator",

      subtitle: "Mutually exclusive telemetry",

      mode: "theory",

      section: "telemetry",

      notes: () => import("./slides/bss-telemetry-modes/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-telemetry-modes/BssTelemetryModesSlide")),

    },

    {

      id: "bss-telemetry-config",

      title: "Sensor configuration",

      subtitle: "SENSOR_CFG v2 draft",

      mode: "theory",

      section: "telemetry",

      notes: () => import("./slides/bss-telemetry-config/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-telemetry-config/BssTelemetryConfigSlide")),

    },

    {

      id: "bss-studio-intro",

      title: "Sensor Studio",

      subtitle: "Flow · Stage · Dashboard",

      mode: "theory",

      section: "studio",

      notes: () => import("./slides/bss-studio-intro/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-studio-intro/BssStudioIntroSlide")),

    },

    {

      id: "bss-studio-nodes",

      title: "Sensor flow nodes",

      subtitle: "Palette · sensorId 0–3",

      mode: "theory",

      section: "studio",

      notes: () => import("./slides/bss-studio-nodes/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-studio-nodes/BssStudioNodesSlide")),

    },

    {

      id: "bss-studio-stage",

      title: "Stage viewport",

      subtitle: "Scene Output · 3D",

      mode: "theory",

      section: "studio",

      notes: () => import("./slides/bss-studio-stage/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-studio-stage/BssStudioStageSlide")),

    },

    {

      id: "bss-studio-dashboard",

      title: "Dashboard widgets",

      subtitle: "HMI layout",

      mode: "theory",

      section: "studio",

      notes: () => import("./slides/bss-studio-dashboard/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-studio-dashboard/BssStudioDashboardSlide")),

    },

    {

      id: "bss-assets",

      title: "Asset Manager",

      subtitle: "Models · presets · vision",

      mode: "theory",

      section: "ecosystem",

      notes: () => import("./slides/bss-assets/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-assets/BssAssetsSlide")),

    },

    {

      id: "bss-simulator-ext",

      title: "Bitstream Simulator",

      subtitle: "External VSIX",

      mode: "theory",

      section: "ecosystem",

      notes: () => import("./slides/bss-simulator-ext/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-simulator-ext/BssSimulatorExtSlide")),

    },

    {

      id: "bss-presentation-app",

      title: "Presentation workspace",

      subtitle: "Training deck in-webview",

      mode: "theory",

      section: "ecosystem",

      notes: () => import("./slides/bss-presentation-app/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-presentation-app/BssPresentationAppSlide")),

    },

    {

      id: "bss-demo-bridge",

      title: "Live broker status",

      subtitle: "Connection + handshake demo",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bss-demo-bridge/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-demo-bridge/BssDemoBridgeSlide")),

    },

    {

      id: "bss-demo-telemetry",

      title: "Multi-sensor stream",

      subtitle: "Last sample per sensorId",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bss-demo-telemetry/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-demo-telemetry/BssDemoTelemetrySlide")),

    },

    {

      id: "bss-summary",

      title: "Summary & next steps",

      subtitle: "Into BMI270 chapter",

      mode: "theory",

      section: "close",

      notes: () => import("./slides/bss-summary/notes.md?raw"),

      Component: lazy(() => import("./slides/bss-summary/BssSummarySlide")),

    },

  ],

};

