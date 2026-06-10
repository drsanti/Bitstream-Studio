import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  createStudioViewportOrthographicCamera,
  type StudioViewportProjectionMode,
  updateStudioViewportOrthographicCameraAspect,
} from "../../../sensor-studio/core/viewport/studio-viewport-projection";
import { snapStudioViewportOrbitToView } from "../../../sensor-studio/core/viewport/studio-viewport-view-snaps";
import type { StudioViewportViewSnapId } from "../../../sensor-studio/core/viewport/studio-viewport-view-snaps";
import { useCourseDiagram3dViewportPrefs } from "../../maintainer/useCourseDiagram3dViewportPrefs";
import { applyDiagram3dViewportProjectionToggle } from "./diagram3dProjectionToggle";
import {
  installDiagram3dBlenderOrbitModifierPolicy,
  installDiagram3dBlenderOrbitPointerGate,
  resolveDiagram3dOrbitDomElement,
} from "./diagram3dBlenderOrbitPointerGate";
import { roundDiagram3dPosition } from "./diagram3dPositionSnap";
import { useDiagram3dViewportControls } from "./diagram3dViewportControlsContext";

export function Diagram3dOrbitControls({
  cameraPosition,
  cameraFov = 45,
  resetNonce = 0,
  captureViewNonce = 0,
  viewSnapNonce = 0,
  viewSnapId = "front",
  onCaptureView,
}: {
  cameraPosition: [number, number, number];
  cameraFov?: number;
  resetNonce?: number;
  captureViewNonce?: number;
  viewSnapNonce?: number;
  viewSnapId?: StudioViewportViewSnapId;
  onCaptureView?: (position: [number, number, number]) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const appliedProjectionRef = useRef<StudioViewportProjectionMode | null>(null);
  const [controlsReady, setControlsReady] = useState(false);
  const viewportControls = useDiagram3dViewportControls();
  const projection = useCourseDiagram3dViewportPrefs((s) => s.projection);
  const { camera, set, size, gl, events } = useThree();
  const orbitDomElement = resolveDiagram3dOrbitDomElement(events.connected, gl.domElement);

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls != null) {
      controls.update();
    }
  }, -2);

  useEffect(() => {
    const cleanups = [
      installDiagram3dBlenderOrbitPointerGate(orbitDomElement),
      installDiagram3dBlenderOrbitModifierPolicy(orbitDomElement, () => controlsRef.current),
    ];
    if (orbitDomElement !== gl.domElement) {
      cleanups.push(installDiagram3dBlenderOrbitPointerGate(gl.domElement));
    }
    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [gl.domElement, orbitDomElement]);

  useEffect(() => {
    return () => {
      viewportControls?.registerOrbitControls(null);
    };
  }, [viewportControls]);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      return;
    }
    perspectiveCameraRef.current = camera;
    camera.fov = cameraFov;
    camera.updateProjectionMatrix();
  }, [camera, cameraFov]);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    if (orthoCameraRef.current == null) {
      orthoCameraRef.current = createStudioViewportOrthographicCamera(aspect);
      if (camera instanceof THREE.PerspectiveCamera) {
        perspectiveCameraRef.current = camera;
      }
      return;
    }
    updateStudioViewportOrthographicCameraAspect(orthoCameraRef.current, aspect);
  }, [camera, size.width, size.height]);

  useEffect(() => {
    const controls = controlsRef.current;
    const ortho = orthoCameraRef.current;
    const persp = perspectiveCameraRef.current;
    if (!controlsReady || controls == null || ortho == null || persp == null) {
      return;
    }

    const aspect = size.width / Math.max(1, size.height);
    updateStudioViewportOrthographicCameraAspect(ortho, aspect);

    if (appliedProjectionRef.current === projection) {
      controls.update();
      return;
    }

    const previousMode = appliedProjectionRef.current;
    applyDiagram3dViewportProjectionToggle({
      mode: projection,
      previousMode,
      controls,
      perspective: persp,
      orthographic: ortho,
    });

    if (projection === "orthographic" && camera !== ortho) {
      set({ camera: ortho });
    } else if (projection === "perspective" && camera !== persp) {
      set({ camera: persp });
    }

    appliedProjectionRef.current = projection;
    controls.update();
  }, [camera, controlsReady, projection, set, size.width, size.height]);

  // Reset only when the document default camera changes or toolbar Reset is pressed —
  // not when toggling perspective / orthographic (that swaps camera objects via `set()`).
  useEffect(() => {
    const controls = controlsRef.current;
    const activeCamera = controls?.object ?? perspectiveCameraRef.current;
    if (activeCamera == null) {
      return;
    }
    activeCamera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    if ("updateProjectionMatrix" in activeCamera) {
      activeCamera.updateProjectionMatrix();
    }
    if (controls != null) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [cameraPosition[0], cameraPosition[1], cameraPosition[2], controlsReady, resetNonce]);

  useEffect(() => {
    if (captureViewNonce === 0 || onCaptureView == null) {
      return;
    }
    const activeCamera = controlsRef.current?.object ?? camera;
    onCaptureView(
      roundDiagram3dPosition([
        activeCamera.position.x,
        activeCamera.position.y,
        activeCamera.position.z,
      ]),
    );
  }, [captureViewNonce, camera, onCaptureView]);

  useEffect(() => {
    if (viewSnapNonce === 0) {
      return;
    }
    const controls = controlsRef.current;
    const activeCamera = controls?.object ?? camera;
    if (controls == null) {
      return;
    }
    snapStudioViewportOrbitToView({
      camera: activeCamera,
      controls,
      snap: viewSnapId,
      mode: "world-locked",
    });
  }, [viewSnapNonce, viewSnapId, camera]);

  return (
    <OrbitControls
      ref={(instance) => {
        controlsRef.current = instance;
        setControlsReady(instance != null);
        viewportControls?.registerOrbitControls(instance);
      }}
      domElement={orbitDomElement}
      makeDefault
      target={[0, 0, 0]}
      enableDamping={false}
      enableRotate={false}
      enablePan={false}
      enableZoom
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      minDistance={0.05}
      maxDistance={500}
      minZoom={0.02}
      maxZoom={200}
    />
  );
}
