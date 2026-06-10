import { usePresentationPresenterStore } from "../../store/usePresentationPresenterStore";

const LASER_HINT = "Laser on — orbit paused · press L to resume";
const ORBIT_HINT = "Drag to orbit · scroll to zoom";

export function PresentationSceneControlsHint({
  orbitHint = ORBIT_HINT,
  className = "presentation-scene-controls-hint absolute bottom-3 right-3 rounded border border-[var(--surface-border)] bg-[var(--surface-panel)] px-2 py-0.5 font-sans text-[10px] font-medium leading-none tracking-wide text-[var(--text-muted)] opacity-95",
}: {
  orbitHint?: string;
  className?: string;
}) {
  const laserEnabled = usePresentationPresenterStore((s) => s.laserEnabled);

  return <div className={className}>{laserEnabled ? LASER_HINT : orbitHint}</div>;
}
