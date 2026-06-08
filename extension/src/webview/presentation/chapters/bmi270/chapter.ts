import { lazy } from "react";

import type { ChapterDefinition } from "../types";



export const bmi270Chapter: ChapterDefinition = {

  id: "bmi270",

  title: "BMI270",

  subtitle: "6-DoF IMU",

  icon: "Cpu",

  order: 1,

  slides: [

    {

      id: "bmi-title",

      title: "BMI270",

      subtitle: "Chapter entry",

      mode: "theory",

      section: "opening",

      notes: () => import("./slides/bmi-title/notes.md?raw"),

      theory: () => import("./slides/bmi-title/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-title/BmiTitleSlide")),

    },

    {

      id: "bmi-objectives",

      title: "Objectives",

      subtitle: "Learning goals",

      mode: "theory",

      section: "opening",

      notes: () => import("./slides/bmi-objectives/notes.md?raw"),

      theory: () => import("./slides/bmi-objectives/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-objectives/BmiObjectivesSlide")),

    },

    {

      id: "bmi-what-is-imu",

      title: "What is an IMU?",

      subtitle: "6-DoF basics",

      mode: "theory",

      section: "foundations",

      notes: () => import("./slides/bmi-what-is-imu/notes.md?raw"),

      theory: () => import("./slides/bmi-what-is-imu/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-what-is-imu/BmiWhatIsImuSlide")),

    },

    {

      id: "bmi-coordinates",

      title: "Coordinates",

      subtitle: "Right-hand frame",

      mode: "theory",

      section: "foundations",

      notes: () => import("./slides/bmi-coordinates/notes.md?raw"),

      theory: () => import("./slides/bmi-coordinates/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-coordinates/BmiCoordinatesSlide")),

    },

    {

      id: "bmi-accel-theory",

      title: "Accelerometer",

      subtitle: "Specific force",

      mode: "theory",

      section: "foundations",

      notes: () => import("./slides/bmi-accel-theory/notes.md?raw"),

      theory: () => import("./slides/bmi-accel-theory/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-accel-theory/BmiAccelTheorySlide")),

    },

    {

      id: "bmi-gyro-theory",

      title: "Gyroscope",

      subtitle: "Angular rate",

      mode: "theory",

      section: "foundations",

      notes: () => import("./slides/bmi-gyro-theory/notes.md?raw"),

      theory: () => import("./slides/bmi-gyro-theory/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-gyro-theory/BmiGyroTheorySlide")),

    },

    {

      id: "bmi-product-overview",

      title: "Product overview",

      subtitle: "Datasheet snapshot",

      mode: "theory",

      section: "product",

      notes: () => import("./slides/bmi-product-overview/notes.md?raw"),

      theory: () => import("./slides/bmi-product-overview/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-product-overview/BmiProductOverviewSlide")),

    },

    {

      id: "bmi-mems-accel-theory",

      title: "MEMS accel",

      subtitle: "Capacitive sensing",

      mode: "theory",

      section: "mems",

      notes: () => import("./slides/bmi-mems-accel-theory/notes.md?raw"),

      theory: () => import("./slides/bmi-mems-accel-theory/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-mems-accel-theory/BmiMemsAccelTheorySlide")),

    },

    {

      id: "bmi-mems-gyro-theory",

      title: "MEMS gyro",

      subtitle: "Coriolis",

      mode: "theory",

      section: "mems",

      notes: () => import("./slides/bmi-mems-gyro-theory/notes.md?raw"),

      theory: () => import("./slides/bmi-mems-gyro-theory/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-mems-gyro-theory/BmiMemsGyroTheorySlide")),

    },

    {

      id: "bmi-demo-connection",

      title: "Live connection",

      subtitle: "Store snapshot",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bmi-live-status/notes.md?raw"),

      Component: lazy(() => import("./slides/bmi-live-status/BmiLiveStatusSlide")),

    },

    {

      id: "bmi-demo-orientation",

      title: "3D board",

      subtitle: "Accel axes + model",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bmi-demo-orientation/notes.md?raw"),

      Component: lazy(() => import("./slides/bmi-demo-orientation/BmiDemoOrientationSlide")),

    },

    {

      id: "bmi-demo-accel",

      title: "Accel waveforms",

      subtitle: "Scrolling history",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bmi-demo-accel/notes.md?raw"),

      Component: lazy(() => import("./slides/bmi-demo-accel/BmiDemoAccelSlide")),

    },

    {

      id: "bmi-mems-accel-demo",

      title: "MEMS accel demo",

      subtitle: "Proof-mass animation",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bmi-mems-accel-demo/notes.md?raw"),

      Component: lazy(() => import("./slides/bmi-mems-accel-demo/BmiMemsAccelDemoSlide")),

    },

    {

      id: "bmi-demo-gyro",

      title: "Gyro rates",

      subtitle: "Dials + gimbal",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bmi-demo-gyro/notes.md?raw"),

      Component: lazy(() => import("./slides/bmi-demo-gyro/BmiDemoGyroSlide")),

    },

    {

      id: "bmi-demo-activity",

      title: "Activity classifier",

      subtitle: "Flat · tilt · shake · spin",

      mode: "demo",

      section: "demos",

      notes: () => import("./slides/bmi-demo-activity/notes.md?raw"),

      Component: lazy(() => import("./slides/bmi-demo-activity/BmiDemoActivitySlide")),

    },

    {

      id: "bmi-demo-config",

      title: "Configuration lab",

      subtitle: "Range · ODR · resolution",

      mode: "lab",

      section: "demos",

      notes: () => import("./slides/bmi-demo-config/notes.md?raw"),

      Component: lazy(() => import("./slides/bmi-demo-config/BmiDemoConfigSlide")),

    },

    {

      id: "bmi-wire-mask",

      title: "Wire mask",

      subtitle: "EVT_SENSOR fields",

      mode: "theory",

      section: "integration",

      notes: () => import("./slides/bmi-wire-mask/notes.md?raw"),

      theory: () => import("./slides/bmi-wire-mask/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-wire-mask/BmiWireMaskSlide")),

    },

    {

      id: "bmi-studio-node",

      title: "Sensor Studio node",

      subtitle: "Flow ports & taps",

      mode: "theory",

      section: "integration",

      notes: () => import("./slides/bmi-studio-node/notes.md?raw"),

      theory: () => import("./slides/bmi-studio-node/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-studio-node/BmiStudioNodeSlide")),

    },

    {

      id: "bmi-summary",

      title: "Summary",

      subtitle: "Next chapter",

      mode: "theory",

      section: "close",

      notes: () => import("./slides/bmi-summary/notes.md?raw"),

      theory: () => import("./slides/bmi-summary/theory.md?raw"),

      Component: lazy(() => import("./slides/bmi-summary/BmiSummarySlide")),

    },

  ],

};

