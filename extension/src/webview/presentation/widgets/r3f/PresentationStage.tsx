import { Grid, ContactShadows } from "@react-three/drei";

/** Shared floor, grid, and contact shadows for presentation 3D scenes. */
export function PresentationStage() {
  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[5, 8, 4]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} />
      <Grid
        position={[0, -0.52, 0]}
        infiniteGrid
        cellSize={0.45}
        sectionSize={2.25}
        fadeDistance={22}
        cellColor="#334155"
        sectionColor="#475569"
      />
      <ContactShadows position={[0, -0.51, 0]} opacity={0.42} scale={14} blur={2.2} far={5} />
    </>
  );
}
