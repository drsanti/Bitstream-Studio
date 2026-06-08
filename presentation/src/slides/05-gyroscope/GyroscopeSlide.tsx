/**
 * Slide 05 — Gyroscope
 * Three DialArc gauges + R3F gimbal rings driven by live GYR data.
 */
import { useRef, Suspense } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Gauge } from 'lucide-react'
import { useBitstreamSensor, useSensorRef } from '@/sensor/useBitstreamSensor'
import { ErrorBoundary } from '@/design/components/ErrorBoundary'
import { DialArc } from '@/design/components/DialArc'
import { LiveBar } from '@/design/components/LiveBar'
import { Badge } from '@/design/components/Badge'
import { Card } from '@/design/components/Card'

// ─── Gimbal rings ─────────────────────────────────────────────────────────────
function GimbalRing({ radius, tubeRadius, color, axis }: {
  radius: number; tubeRadius: number; color: string; axis: THREE.Vector3
}) {
  return (
    <mesh>
      <torusGeometry args={[radius, tubeRadius, 16, 64]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
    </mesh>
  )
}

function GimbalScene() {
  const groupRef = useRef<THREE.Group>(null)
  const sensorRef = useSensorRef()
  const euler = useRef(new THREE.Euler())

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { gx, gy, gz } = sensorRef.current
    // Integrate angular velocity to get orientation (simplified, no drift correction)
    euler.current.x += gx * delta * (Math.PI / 180)
    euler.current.y += gy * delta * (Math.PI / 180)
    euler.current.z += gz * delta * (Math.PI / 180)
    groupRef.current.rotation.copy(euler.current)
  })

  return (
    <group ref={groupRef}>
      {/* Outer ring — X */}
      <GimbalRing radius={1.6} tubeRadius={0.04} color="#F87171" axis={new THREE.Vector3(1,0,0)} />
      {/* Middle ring — Y */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.2, 0.04, 16, 64]} />
        <meshStandardMaterial color="#34D399" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Inner ring — Z */}
      <mesh rotation={[0, Math.PI/2, 0]}>
        <torusGeometry args={[0.8, 0.04, 16, 64]} />
        <meshStandardMaterial color="#60A5FA" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Center sphere */}
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.8} />
      </mesh>
    </group>
  )
}

// ─── Slide ────────────────────────────────────────────────────────────────────
export default function GyroscopeSlide() {
  const root = useRef<HTMLDivElement>(null)
  const { frame } = useBitstreamSensor()

  useGSAP(() => {
    gsap.from('.gyr-header', { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' })
    gsap.from('.gyr-dial',   { scale: 0.8, opacity: 0, stagger: 0.1, duration: 0.45, ease: 'back.out(1.8)', delay: 0.2 })
    gsap.from('.gyr-canvas', { x: 40, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.15 })
    gsap.from('.gyr-card',   { y: 20, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power3.out', delay: 0.4 })
  }, { scope: root })

  const axes = [
    { label: 'ωX (Roll)',  value: frame.gx, color: 'var(--axis-x)' },
    { label: 'ωY (Pitch)', value: frame.gy, color: 'var(--axis-y)' },
    { label: 'ωZ (Yaw)',   value: frame.gz, color: 'var(--axis-z)' },
  ]

  return (
    <div ref={root} className="flex w-full h-full">
      {/* Left panel */}
      <div className="flex flex-col justify-between px-8 py-8 w-[48%] border-r border-[var(--surface-border)]">
        <div className="gyr-header flex items-center gap-2 mb-4">
          <Gauge size={20} strokeWidth={1.5} style={{ color: 'var(--accent-amber)' }} />
          <Badge variant="amber">Slide 05</Badge>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Gyroscope</h2>
        </div>

        {/* Dial gauges */}
        <div className="flex justify-around flex-1 items-center">
          {axes.map(({ label, value, color }) => (
            <div key={label} className="gyr-dial flex flex-col items-center gap-1">
              <DialArc value={value} min={-500} max={500} color={color} size={130} unit="°/s" />
              <span className="text-xs text-[var(--text-muted)] font-code">{label}</span>
              <LiveBar value={value} min={-500} max={500} color={color} height={5} className="w-28" />
            </div>
          ))}
        </div>

        {/* Spec cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="gyr-card" accent="var(--accent-amber)">
            <div className="text-2xs text-[var(--text-muted)] uppercase">Full Scale</div>
            <div className="font-code text-xs mt-0.5" style={{ color: 'var(--accent-amber)' }}>±2000 °/s</div>
          </Card>
          <Card className="gyr-card" accent="var(--accent-cyan)">
            <div className="text-2xs text-[var(--text-muted)] uppercase">Resolution</div>
            <div className="font-code text-xs mt-0.5" style={{ color: 'var(--accent-cyan)' }}>0.061 °/s/LSB</div>
          </Card>
          <Card className="gyr-card" accent="var(--accent-purple)">
            <div className="text-2xs text-[var(--text-muted)] uppercase">Noise</div>
            <div className="font-code text-xs mt-0.5" style={{ color: 'var(--accent-purple)' }}>0.007 °/s/√Hz</div>
          </Card>
        </div>
      </div>

      {/* Right: 3D gimbal */}
      <div className="gyr-canvas flex-1 bg-[var(--scene-bg)] flex flex-col">
        <ErrorBoundary slideId="05-gyroscope-3d" compact>
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }} style={{ flex: 1 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <GimbalScene />
            <OrbitControls enablePan={false} enableZoom={false} />
          </Suspense>
        </Canvas>
        </ErrorBoundary>
        <div className="px-4 py-3 border-t border-[var(--surface-border)] bg-[var(--surface-panel)]">
          <p className="text-xs text-[var(--text-secondary)]">
            <strong style={{ color: 'var(--axis-x)' }}>Red</strong> = X (Roll) ·{' '}
            <strong style={{ color: 'var(--axis-y)' }}>Green</strong> = Y (Pitch) ·{' '}
            <strong style={{ color: 'var(--axis-z)' }}>Blue</strong> = Z (Yaw) ·{' '}
            <span className="text-[var(--text-muted)]">Rings integrate live ω → angle</span>
          </p>
        </div>
      </div>
    </div>
  )
}
