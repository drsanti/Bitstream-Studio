import type { PhysicsLabViewportScreenRect } from "../core/physicsLabBoxSelection.js";
import { physicsLabMarqueeIsDrag } from "../core/physicsLabBoxSelection.js";

type PhysicsLabViewportMarqueeProps = {
  rect: PhysicsLabViewportScreenRect;
};

export function PhysicsLabViewportMarquee({ rect }: PhysicsLabViewportMarqueeProps) {
  if (!physicsLabMarqueeIsDrag(rect)) {
    return null;
  }
  return (
    <div
      className="pointer-events-none absolute z-10 border border-sky-400/80 bg-sky-400/10"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
      aria-hidden
    />
  );
}
