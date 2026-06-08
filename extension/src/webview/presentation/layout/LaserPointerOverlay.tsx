import { usePresentationPresenterStore } from "../store/usePresentationPresenterStore";

export function LaserPointerOverlay() {
  const laserEnabled = usePresentationPresenterStore((s) => s.laserEnabled);
  const pointer = usePresentationPresenterStore((s) => s.pointerNorm);

  if (!laserEnabled || pointer == null) {
    return null;
  }

  const left = `${pointer.x * 100}%`;
  const top = `${pointer.y * 100}%`;

  return (
    <div className="presentation-laser-layer" aria-hidden>
      <div
        className="presentation-laser-dot"
        style={{
          left,
          top,
          boxShadow: "0 0 18px 6px color-mix(in srgb, var(--accent-red) 55%, transparent)",
        }}
      />
      <div className="presentation-laser-ring" style={{ left, top }} />
    </div>
  );
}
