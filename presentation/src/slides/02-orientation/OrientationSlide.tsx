/**
 * Slide 02 — Coordinate System & Live 3D Model
 * Left: axis diagram with live values. Right: R3F 3D PCB model.
 */
import { useRef, Suspense } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Text, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useBitstreamSensor, useSensorRef } from '@/sensor/useBitstreamSensor'
import { ValueDisplay } from '@/design/components/ValueDisplay'
import { LiveBar } from '@/design/components/LiveBar'
import { Badge } from '@/design/components/Badge'
import { ErrorBoundary } from '@/design/components/ErrorBoundary'

// ─── 3D Scene ─────────────────────────────────────────────────────────────────
function PCBModel() {
  const groupRef = useRef<THREE.Group>(null)
  const sensorRef = useSensorRef()

  useFrame(() => {
    if (!groupRef.current) return
    const { qw, qx, qy, qz, quatValid, pitch, roll } = sensorRef.current
    if (quatValid) {
      groupRef.current.quaternion.set(qx, qy, qz, qw)
    } else {
      const p = (pitch * Math.PI) / 180
      const r = (roll  * Math.PI) / 180
      groupRef.current.rotation.set(p, groupRef.current.rotation.y + 0.003, r)
    }
  })

  return (
    <group ref={groupRef}>
      {/* PCB board */}
      <Box args={[2.4, 0.08, 1.6]}>
        <meshStandardMaterial color="#1a4a2a" roughness={0.7} metalness={0.2} />
      </Box>
      {/* IMU chip */}
      <Box args={[0.35, 0.12, 0.3]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.6} />
      </Box>
      {/* Axis arrows */}
      <AxisArrow dir={[1,0,0]} color="#F87171" label="X" />
      <AxisArrow dir={[0,0,-1]} color="#34D399" label="Y" />
      <AxisArrow dir={[0,1,0]} color="#60A5FA" label="Z" />
    </group>
  )
}

function AxisArrow({ dir, color, label }: { dir: [number,number,number], color: string, label: string }) {
  const length = 0.9
  const [dx, dy, dz] = dir
  return (
    <group>
      <arrowHelper args={[
        new THREE.Vector3(...dir).normalize(),
        new THREE.Vector3(0, 0.05, 0),
        length,
        color,
        0.18,
        0.08,
      ]} />
      <Text
        position={[dx * (length + 0.2), dy * (length + 0.2) + 0.05, dz * (length + 0.2)]}
        fontSize={0.18}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

// ─── Slide ────────────────────────────────────────────────────────────────────
export default function OrientationSlide() {
  const root = useRef<HTMLDivElement>(null)
  const { frame } = useBitstreamSensor()

  useGSAP(() => {
    gsap.from('.orient-header',   { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' })
    gsap.from('.axis-row',        { x: -20, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power3.out', delay: 0.2 })
    gsap.from('.orient-canvas',   { x: 40, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 })
  }, { scope: root })

  const axes = [
    { label: 'X', value: frame.ax, color: 'var(--axis-x)', unit: 'g', desc: 'Forward / Backward' },
    { label: 'Y', value: frame.ay, color: 'var(--axis-y)', unit: 'g', desc: 'Left / Right' },
    { label: 'Z', value: frame.az, color: 'var(--axis-z)', unit: 'g', desc: 'Up / Down' },
  ]

  return (
    <div ref={root} className="flex w-full h-full gap-0">
      {/* Left panel */}
      <div className="flex flex-col justify-center gap-6 px-10 py-8 w-[45%] flex-shrink-0">
        <div className="orient-header flex flex-col gap-2">
          <Badge variant="cyan">Coordinate System</Badge>
          <h2 className="text-4xl font-extrabold text-[var(--text-primary)]">
            Right-Hand<br />Convention
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            BMI270 follows the right-hand rule. With the chip flat on a table,
            Z points upward and reads <strong style={{color:'var(--axis-z)'}}>+1 g</strong> (reaction force from gravity).
          </p>
        </div>

        {/* Axis rows */}
        <div className="flex flex-col gap-5">
          {axes.map(({ label, value, color, unit, desc }) => (
            <div key={label} className="axis-row flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-bold font-code" style={{ color }}>{label} Axis</span>
                  <span className="text-2xs text-[var(--text-muted)]">{desc}</span>
                </div>
                <ValueDisplay label="" value={value} unit={unit} color={color} decimals={3} className="items-end" />
              </div>
              <LiveBar value={value} min={-2} max={2} color={color} height={6} showValue={false} />
            </div>
          ))}
        </div>

        <p className="text-2xs text-[var(--text-muted)] font-code">
          Flat on table → aZ ≈ +1.0 g · Drag the 3D model to explore →
        </p>
      </div>

      {/* Right: 3D canvas */}
      <div className="orient-canvas flex-1 bg-[var(--scene-bg)] relative">
        <ErrorBoundary slideId="02-orientation-3d" compact>
        <Canvas
          camera={{ position: [3, 2.5, 4], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={1.2} />
            <directionalLight position={[-5, -2, -5]} intensity={0.3} />
            <Environment preset="city" />
            <PCBModel />
            <OrbitControls enablePan={false} minDistance={3} maxDistance={9} autoRotate autoRotateSpeed={0.4} />
          </Suspense>
        </Canvas>
        </ErrorBoundary>
        {/* Overlay hint */}
        <div className="absolute bottom-4 right-4 text-2xs text-[var(--text-muted)] font-code bg-[var(--surface-panel)] bg-opacity-80 px-2 py-1 rounded">
          drag to rotate · auto-rotates with live quaternion
        </div>
      </div>
    </div>
  )
}
