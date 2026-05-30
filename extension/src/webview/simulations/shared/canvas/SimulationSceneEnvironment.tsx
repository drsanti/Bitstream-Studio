/*******************************************************************************
 * File Name : SimulationSceneEnvironment.tsx
 *
 * Description : Lights, grid, orbit controls for simulation scenes.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Grid, OrbitControls } from "@react-three/drei";
import { SIMULATION_SCENE_BACKGROUND } from "./simulationCanvasConstants.js";

/**
 * Default lighting and ground grid for simulation viewports.
 */
export function SimulationSceneEnvironment()
{
  return (
    <>
      <color attach="background" args={[SIMULATION_SCENE_BACKGROUND]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} castShadow={false} />
      <directionalLight position={[-3, 4, -2]} intensity={0.35} />
      <Grid
        position={[0, 0, 0]}
        args={[12, 12]}
        cellSize={0.5}
        cellThickness={0.6}
        sectionSize={2}
        sectionThickness={1}
        fadeDistance={18}
        fadeStrength={1}
        infiniteGrid
      />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  );
}
