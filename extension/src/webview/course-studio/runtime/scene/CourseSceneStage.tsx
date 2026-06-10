import { ContactShadows, Grid } from "@react-three/drei";
import { RotationPreviewSceneEnvironment } from "../../../bitstream-app/components/3d-rotation/shared/RotationPreviewSceneEnvironment";
import { ROTATION_PREVIEW_AMBIENT_INTENSITY } from "../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants";
import {
  resolveSceneEnvironmentSettings,
  type SceneEnvironmentSettingsV1,
} from "../../schemas/scene.v1";
import { CourseSceneSolidBackground } from "./CourseSceneSolidBackground";

const GROUND_GRID_Y = -0.52;

/** Scene-document stage: cubemap IBL, optional grid, contact shadows. */
export function CourseSceneStage({
  settings,
}: {
  settings?: SceneEnvironmentSettingsV1;
}) {
  const env = resolveSceneEnvironmentSettings(settings);
  const useCubemapBackdrop = env.showBackground;

  return (
    <>
      {!useCubemapBackdrop ? (
        <color attach="background" args={[env.backgroundColor]} />
      ) : null}
      <RotationPreviewSceneEnvironment
        showBackgroundTexture={useCubemapBackdrop}
        useCubemapIbl={env.useIbl}
        environmentPresetIndex={env.environmentPresetIndex}
      />
      <CourseSceneSolidBackground colorHex={env.backgroundColor} active={!useCubemapBackdrop} />
      <ambientLight intensity={ROTATION_PREVIEW_AMBIENT_INTENSITY} />
      <directionalLight position={[5, 8, 4]} intensity={1.15} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} />
      {env.showGrid ? (
        <Grid
          args={[24, 24]}
          cellColor="#3f3f46"
          cellSize={0.25}
          cellThickness={0.65}
          fadeDistance={22}
          fadeStrength={1}
          infiniteGrid
          position={[0, GROUND_GRID_Y, 0]}
          renderOrder={-1}
          sectionColor="#71717a"
          sectionSize={1}
          sectionThickness={1}
        />
      ) : null}
      {env.contactShadows ? (
        <ContactShadows
          position={[0, -0.51, 0]}
          opacity={0.42}
          scale={14}
          blur={2.2}
          far={5}
        />
      ) : null}
    </>
  );
}
