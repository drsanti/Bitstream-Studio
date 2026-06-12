import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

let orbitControls: OrbitControlsImpl | null = null;

export function setPhysicsLabOrbitControls(controls: OrbitControlsImpl | null): void {
  orbitControls = controls;
}

export function setPhysicsLabOrbitEnabled(enabled: boolean): void {
  if (orbitControls != null) {
    orbitControls.enabled = enabled;
  }
}
