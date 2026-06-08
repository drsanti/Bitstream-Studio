/**
 * Slide registry — ordered list of all slides with metadata.
 * Each slide module is lazy-loaded for code-splitting.
 */
import { lazy } from 'react'
import type { FC } from 'react'

export interface SlideDefinition {
  id:       string
  index:    number       // 1-based for display
  title:    string
  subtitle: string
  icon:     string       // Lucide icon name
  notes:    () => Promise<{ default: string }>
  Component: FC
}

export const slides: SlideDefinition[] = [
  {
    id:       '01-intro',
    index:    1,
    title:    'BMI270 IMU',
    subtitle: 'Inertial Measurement Unit Overview',
    icon:     'Cpu',
    notes:    () => import('./01-intro/notes.md?raw'),
    Component: lazy(() => import('./01-intro/IntroSlide')),
  },
  {
    id:       '02-orientation',
    index:    2,
    title:    'Coordinate System',
    subtitle: 'Axes, Orientation & Live 3D Model',
    icon:     'RotateCcw',
    notes:    () => import('./02-orientation/notes.md?raw'),
    Component: lazy(() => import('./02-orientation/OrientationSlide')),
  },
  {
    id:       '03-accelerometer',
    index:    3,
    title:    'Accelerometer',
    subtitle: 'Specific Force Measurement & Live Waveform',
    icon:     'Activity',
    notes:    () => import('./03-accelerometer/notes.md?raw'),
    Component: lazy(() => import('./03-accelerometer/AccelerometerSlide')),
  },
  {
    id:       '04-mems',
    index:    4,
    title:    'MEMS Sensing',
    subtitle: 'How a Capacitive Proof-Mass Works',
    icon:     'Microscope',
    notes:    () => import('./04-mems/notes.md?raw'),
    Component: lazy(() => import('./04-mems/MEMSSlide')),
  },
  {
    id:       '05-gyroscope',
    index:    5,
    title:    'Gyroscope',
    subtitle: 'Coriolis Effect & Live Angular Rate',
    icon:     'Gauge',
    notes:    () => import('./05-gyroscope/notes.md?raw'),
    Component: lazy(() => import('./05-gyroscope/GyroscopeSlide')),
  },
  {
    id:       '06-activity',
    index:    6,
    title:    'Activity Recognition',
    subtitle: 'Threshold Classifier from Live Data',
    icon:     'Zap',
    notes:    () => import('./06-activity/notes.md?raw'),
    Component: lazy(() => import('./06-activity/ActivitySlide')),
  },
  {
    id:       '07-config',
    index:    7,
    title:    'Sensor Configuration',
    subtitle: 'Range & ODR — Write to Firmware',
    icon:     'Settings2',
    notes:    () => import('./07-config/notes.md?raw'),
    Component: lazy(() => import('./07-config/ConfigSlide')),
  },
  {
    id:       '08-code',
    index:    8,
    title:    'Code & Protocol',
    subtitle: 'Data Flow: Firmware → Bridge → Host',
    icon:     'Code2',
    notes:    () => import('./08-code/notes.md?raw'),
    Component: lazy(() => import('./08-code/CodeSlide')),
  },
]
