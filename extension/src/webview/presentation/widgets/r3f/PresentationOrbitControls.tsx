import { OrbitControls, type OrbitControlsProps } from "@react-three/drei";
import { usePresentationPresenterStore } from "../../store/usePresentationPresenterStore";

/** Full orbit navigation for all presentation 3D scenes (rotate, pan, zoom). Paused while laser pointer is on. */
export function PresentationOrbitControls(props?: OrbitControlsProps) {
  const laserEnabled = usePresentationPresenterStore((s) => s.laserEnabled);
  const orbitEnabled = (props?.enabled ?? true) && !laserEnabled;

  return (
    <OrbitControls
      makeDefault
      enableRotate
      enablePan
      enableZoom
      minDistance={1.2}
      maxDistance={14}
      {...props}
      enabled={orbitEnabled}
    />
  );
}
