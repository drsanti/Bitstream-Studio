import { useFrame } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import * as THREE from "three";
import type { FusionEulerHundredths } from "./bmi270FusionExtract.js";
import { GlbMissingTesaiotFallback } from "./GlbMissingTesaiotFallback.js";
import type { OrientationPreviewMappingMode } from "./orientationPreviewMapping.js";
import {
  ORIENTATION_PREVIEW_MAPPING_DEFAULT,
} from "./orientationPreviewMapping.js";
import {
  alignMappedFusionQuatToDisplay,
  computeMeshTargetFusionQuat,
  createMeshOrientationScratch,
  type FusionQuat4,
} from "./orientationPreviewMath.js";
import { RotationPreviewBodyGlb } from "./RotationPreviewBodyGlb.js";
import {
  BODY_AXIS_ARROW_HEAD_LENGTH,
  BODY_AXIS_ARROW_HEAD_WIDTH,
  BODY_AXIS_ARROW_LENGTH,
  BODY_AXIS_COLORS,
  QUAT_JUMP_SNAP_RAD,
} from "./rotationPreviewConstants.js";
import { resolveDefaultPreviewMeshGlbUrl } from "./resolveWebviewModelAssetUrl.js";
import { usePreviewMeshMissingUiStore } from "../../../state/previewMeshMissingUi.store.js";

class PsocGlbErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override componentDidUpdate(prevProps: { resetKey: string }): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  override componentDidCatch(): void {
    usePreviewMeshMissingUiStore.getState().notifyGlbLoadFailed();
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

type BodyArrowArgs = [
  THREE.Vector3,
  THREE.Vector3,
  number,
  THREE.ColorRepresentation,
  number,
  number,
];

function fusionQuat4FromThree(q: THREE.Quaternion): FusionQuat4 {
  return { qw: q.w, qx: q.x, qy: q.y, qz: q.z };
}

/**
 * Live fusion orientation → body axes + GLB mesh.
 * Target quaternion updates when wire props change (not every render frame).
 */
export function OrientationMarkerMesh(props: {
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  fusionEulerHundredths: FusionEulerHundredths | null;
  meshOrientationFromEulerFallback: boolean;
  eulerOnly?: boolean;
  /** When false, mesh snaps to each new target (best for live telemetry). */
  slerpEnabled?: boolean;
  glbUrl?: string;
  orientationMappingMode?: OrientationPreviewMappingMode;
}) {
  const {
    qw,
    qx,
    qy,
    qz,
    fusionEulerHundredths,
    meshOrientationFromEulerFallback,
    eulerOnly = false,
    slerpEnabled = false,
    glbUrl,
    orientationMappingMode = ORIENTATION_PREVIEW_MAPPING_DEFAULT,
  } = props;

  const resolvedGlbUrl = glbUrl ?? resolveDefaultPreviewMeshGlbUrl();
  const groupRef = useRef<THREE.Group>(null);
  const targetQuatRef = useRef(new THREE.Quaternion());
  const currentQuatRef = useRef(new THREE.Quaternion());
  const initializedRef = useRef(false);
  const lastFrameAtRef = useRef<number | null>(null);
  const meshScratch = useMemo(() => createMeshOrientationScratch(), []);

  const bodyAxisArrowArgs = useMemo(() => {
    const len = BODY_AXIS_ARROW_LENGTH;
    const hl = BODY_AXIS_ARROW_HEAD_LENGTH;
    const hw = BODY_AXIS_ARROW_HEAD_WIDTH;
    const mk = (
      dir: THREE.Vector3,
      color: (typeof BODY_AXIS_COLORS)[keyof typeof BODY_AXIS_COLORS],
    ): BodyArrowArgs => [dir, new THREE.Vector3(0, 0, 0), len, color, hl, hw];
    return {
      x: mk(new THREE.Vector3(1, 0, 0), BODY_AXIS_COLORS.x),
      y: mk(new THREE.Vector3(0, 1, 0), BODY_AXIS_COLORS.y),
      z: mk(new THREE.Vector3(0, 0, 1), BODY_AXIS_COLORS.z),
    };
  }, []);

  /* --- Block: rebuild mesh target when wire / Euler props change --- */
  useEffect(() => {
    const target = targetQuatRef.current;
    const useWireQuatDirect =
      orientationMappingMode === "wire-direct" &&
      !eulerOnly &&
      !meshOrientationFromEulerFallback;

    if (useWireQuatDirect)
    {
      target.set(qx, qy, qz, qw);
    }
    else
    {
      const mapped = computeMeshTargetFusionQuat(
        {
          qw,
          qx,
          qy,
          qz,
          fusionEulerHundredths,
          meshOrientationFromEulerFallback,
          eulerOnly,
          orientationMappingMode,
        },
        meshScratch,
      );
      const prevDisplay = fusionQuat4FromThree(currentQuatRef.current);
      const aligned = alignMappedFusionQuatToDisplay(mapped, prevDisplay);
      target.set(aligned.qx, aligned.qy, aligned.qz, aligned.qw);
    }

    if (initializedRef.current && currentQuatRef.current.dot(target) < 0)
    {
      target.set(-target.x, -target.y, -target.z, -target.w);
    }

    if (!initializedRef.current)
    {
      currentQuatRef.current.copy(target);
      if (groupRef.current)
      {
        groupRef.current.quaternion.copy(currentQuatRef.current);
      }
      initializedRef.current = true;
      return;
    }

    if (currentQuatRef.current.angleTo(target) > QUAT_JUMP_SNAP_RAD)
    {
      currentQuatRef.current.copy(target);
      if (groupRef.current)
      {
        groupRef.current.quaternion.copy(target);
      }
    }
  }, [
    eulerOnly,
    qw,
    qx,
    qy,
    qz,
    meshOrientationFromEulerFallback,
    fusionEulerHundredths?.heading,
    fusionEulerHundredths?.pitch,
    fusionEulerHundredths?.roll,
    orientationMappingMode,
    meshScratch,
  ]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group)
    {
      return;
    }

    const target = targetQuatRef.current;
    const current = currentQuatRef.current;

    if (!slerpEnabled)
    {
      current.copy(target);
      group.quaternion.copy(target);
      lastFrameAtRef.current = performance.now();
      return;
    }

    const now = performance.now();
    const last = lastFrameAtRef.current;
    lastFrameAtRef.current = now;
    const dt =
      last != null ? Math.max(0, Math.min(0.25, (now - last) / 1000)) : 1 / 60;

    const tau = 0.05;
    const alpha = 1 - Math.exp(-dt / tau);
    current.slerp(target, alpha);
    group.quaternion.copy(current);
  });

  return (
    <group
      ref={groupRef}
      name="orientation-marker-root"
      userData={{ transformRoot: true, inspectLabel: "Orientation Marker" }}
    >
      <arrowHelper args={bodyAxisArrowArgs.x} />
      <arrowHelper args={bodyAxisArrowArgs.y} />
      <arrowHelper args={bodyAxisArrowArgs.z} />
      <Suspense fallback={null}>
        <PsocGlbErrorBoundary
          key={resolvedGlbUrl}
          resetKey={resolvedGlbUrl}
          fallback={
            <Suspense fallback={null}>
              <GlbMissingTesaiotFallback />
            </Suspense>
          }
        >
          <RotationPreviewBodyGlb url={resolvedGlbUrl} />
        </PsocGlbErrorBoundary>
      </Suspense>
    </group>
  );
}
