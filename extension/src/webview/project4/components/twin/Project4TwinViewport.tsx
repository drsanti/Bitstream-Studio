import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, {
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import type { UseProject4TelemetryResult } from "../../hooks/useProject4Telemetry";
import { collectProject4Rig, type Project4RigRefs } from "../../lib/project4-rig";
import { mapTelemetryDegToTwinYawDeg } from "../../lib/project4-scanner-twin-map";
import { applyProject4TwinRobotShadowSetup } from "../../lib/project4-twin-robot-shadow-setup";
import { resolveProject4RobotModelUrl } from "../../lib/resolve-robot-model-url";
import { useProject4SettingsStore } from "../../settings/project4-settings.store";
import { Project4TwinDynamicLights } from "./Project4TwinDynamicLights";
import { Project4TwinGraphicsRuntime } from "./Project4TwinGraphicsRuntime";
import { Project4TwinRobotLoadErrorBoundary } from "./Project4TwinRobotLoadErrorBoundary";
import { Project4TwinSceneEnvironment } from "./Project4TwinSceneEnvironment";

function TwinViewportSizeSync(props: { viewportRef: RefObject<HTMLElement | null> }) {
  const setSize = useThree((s) => s.setSize);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = props.viewportRef.current;
    if (el == null) {
      return;
    }

    const apply = () => {
      const w = Math.max(1, Math.round(el.clientWidth));
      const h = Math.max(1, Math.round(el.clientHeight));
      const prev = lastRef.current;
      if (prev != null && prev.w === w && prev.h === h) {
        return;
      }
      lastRef.current = { w, h };
      setSize(w, h);
    };

    apply();

    const schedule = () => {
      if (rafRef.current != null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        apply();
      });
    };

    const ro = new ResizeObserver(() => schedule());
    ro.observe(el);
    window.addEventListener("resize", schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [props.viewportRef, setSize]);

  return null;
}

type Project4RobotRootProps = {
  modelUrl: string;
  wheelRadiusM: number;
  telemetryRef: RefObject<UseProject4TelemetryResult>;
  scannerFrontTwinMinDeg: number;
  scannerFrontTwinMaxDeg: number;
  scannerRearTwinMinDeg: number;
  scannerRearTwinMaxDeg: number;
  scannerTelemetrySweepMinDeg: number;
  scannerTelemetrySweepMaxDeg: number;
};

/** Local axle for tire roll — Blender export keeps rim+tire under `Wheel_*` pivots (PROJECT_INFO.md). */
const WHEEL_ROLL_AXIS = new THREE.Vector3(1, 0, 0);

function Project4RobotRoot(props: Project4RobotRootProps) {
  const resolved = resolveProject4RobotModelUrl(props.modelUrl);
  const gltf = useGLTF(resolved);
  const rigRef = useRef<Project4RigRefs | null>(null);
  /** GLB rest pose on load = telemetry “0°”; remap drives ±offset around this yaw. */
  const scannerRestYawRef = useRef<{ f: number | null; r: number | null }>({
    f: null,
    r: null,
  });

  useLayoutEffect(() => {
    applyProject4TwinRobotShadowSetup(gltf.scene);
    const rig = collectProject4Rig(gltf.scene);
    rigRef.current = rig;
    scannerRestYawRef.current = {
      f: rig.ultrasonicF != null ? rig.ultrasonicF.rotation.y : null,
      r: rig.ultrasonicR != null ? rig.ultrasonicR.rotation.y : null,
    };
    return () => {
      rigRef.current = null;
      scannerRestYawRef.current = { f: null, r: null };
    };
  }, [gltf.scene]);

  const driveRef = useRef({ radius: props.wheelRadiusM });
  driveRef.current.radius = props.wheelRadiusM;

  useFrame((_, delta) => {
    const rig = rigRef.current;
    const tel = props.telemetryRef.current;
    const snapshot = tel?.snapshot;
    const r = driveRef.current.radius;
    if (rig == null || !(r > 0)) {
      return;
    }

    const restF = scannerRestYawRef.current.f;
    const restR = scannerRestYawRef.current.r;

    const applyScanners = (offsetFdeg: number, offsetRdeg: number) => {
      if (rig.ultrasonicF != null && restF != null) {
        rig.ultrasonicF.rotation.y = restF + THREE.MathUtils.degToRad(offsetFdeg);
      }
      if (rig.ultrasonicR != null && restR != null) {
        rig.ultrasonicR.rotation.y = restR + THREE.MathUtils.degToRad(offsetRdeg);
      }
    };

    if (snapshot == null) {
      /** No `/data` yet — keep mesh at authored rest (0° twin offset). */
      applyScanners(0, 0);
      return;
    }

    const applyWheelRoll = (node: THREE.Object3D | undefined, linearMs: number) => {
      if (node == null) {
        return;
      }
      const omega = linearMs / r;
      /** Prefer quaternion integration — stable when pivots carry non-zero Euler (e.g. π flips on export). */
      node.rotateOnAxis(WHEEL_ROLL_AXIS, omega * delta);
    };

    applyWheelRoll(rig.wheelFL, snapshot.vFL);
    applyWheelRoll(rig.wheelFR, snapshot.vFR);
    applyWheelRoll(rig.wheelRL, snapshot.vRL);
    applyWheelRoll(rig.wheelRR, snapshot.vRR);

    const yawFdeg = mapTelemetryDegToTwinYawDeg(
      snapshot.aFront,
      props.scannerFrontTwinMinDeg,
      props.scannerFrontTwinMaxDeg,
      props.scannerTelemetrySweepMinDeg,
      props.scannerTelemetrySweepMaxDeg,
    );
    const yawRdeg = mapTelemetryDegToTwinYawDeg(
      snapshot.aRear,
      props.scannerRearTwinMinDeg,
      props.scannerRearTwinMaxDeg,
      props.scannerTelemetrySweepMinDeg,
      props.scannerTelemetrySweepMaxDeg,
    );
    applyScanners(yawFdeg, yawRdeg);
  });

  return <primitive object={gltf.scene} />;
}

export type Project4TwinViewportProps = {
  telemetryRef: RefObject<UseProject4TelemetryResult>;
};

export function Project4TwinViewport(props: Project4TwinViewportProps) {
  const modelUrl = useProject4SettingsStore((s) => s.robotModelUrl);
  const wheelRadiusM = useProject4SettingsStore((s) => s.wheelRadiusM);
  const twinCubemapEnvironmentId = useProject4SettingsStore((s) => s.twinCubemapEnvironmentId);
  const scannerFrontAzimuthMinDeg = useProject4SettingsStore((s) => s.scannerFrontAzimuthMinDeg);
  const scannerFrontAzimuthMaxDeg = useProject4SettingsStore((s) => s.scannerFrontAzimuthMaxDeg);
  const scannerRearAzimuthMinDeg = useProject4SettingsStore((s) => s.scannerRearAzimuthMinDeg);
  const scannerRearAzimuthMaxDeg = useProject4SettingsStore((s) => s.scannerRearAzimuthMaxDeg);
  const scannerTelemetrySweepMinDeg = useProject4SettingsStore((s) => s.scannerTelemetrySweepMinDeg);
  const scannerTelemetrySweepMaxDeg = useProject4SettingsStore((s) => s.scannerTelemetrySweepMaxDeg);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const resolvedKey = resolveProject4RobotModelUrl(modelUrl);
  const [robotReloadNonce, setRobotReloadNonce] = useState(0);

  if (!modelUrl.trim()) {
    return (
      <div className="flex h-full min-h-[160px] w-full items-center justify-center border border-dashed border-zinc-700/70 bg-zinc-950 px-6 text-center text-xs leading-relaxed text-zinc-500">
        No model URL configured. Open Settings → Advanced and set{" "}
        <span className="font-mono text-zinc-400">robotModelUrl</span> (default uses{" "}
        <span className="font-mono text-zinc-400">${"{ONLINE_ASSETS_BASE_URI}"}/models/...</span>{" "}
        or <span className="font-mono text-zinc-400">${"{FREE_ASSETS_BASE_URI}"}/models/...</span> after Free-pack sync).
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="relative h-full w-full min-h-0 overflow-hidden bg-zinc-950 touch-none"
      style={{ touchAction: "none" }}
    >
      <Canvas
        className="block! h-full! w-full!"
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [1.35, 0.75, 1.25], fov: 42 }}
        resize={{ scroll: false, debounce: { resize: 0, scroll: 0 } }}
        gl={{ antialias: true, alpha: false }}
      >
        <TwinViewportSizeSync viewportRef={viewportRef} />
        <Project4TwinGraphicsRuntime />
        <Project4TwinSceneEnvironment cubemapSetId={twinCubemapEnvironmentId} />
        <Project4TwinDynamicLights />
        <Suspense key={`${resolvedKey}-${robotReloadNonce}`} fallback={null}>
          <Project4TwinRobotLoadErrorBoundary
            failedResolvedUrl={resolvedKey}
            onReloadRequested={() => setRobotReloadNonce((n) => n + 1)}
          >
            <Project4RobotRoot
              modelUrl={modelUrl}
              wheelRadiusM={wheelRadiusM}
              telemetryRef={props.telemetryRef}
              scannerFrontTwinMinDeg={scannerFrontAzimuthMinDeg}
              scannerFrontTwinMaxDeg={scannerFrontAzimuthMaxDeg}
              scannerRearTwinMinDeg={scannerRearAzimuthMinDeg}
              scannerRearTwinMaxDeg={scannerRearAzimuthMaxDeg}
              scannerTelemetrySweepMinDeg={scannerTelemetrySweepMinDeg}
              scannerTelemetrySweepMaxDeg={scannerTelemetrySweepMaxDeg}
            />
          </Project4TwinRobotLoadErrorBoundary>
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={0.35}
          maxDistance={12}
        />
      </Canvas>
    </div>
  );
}
