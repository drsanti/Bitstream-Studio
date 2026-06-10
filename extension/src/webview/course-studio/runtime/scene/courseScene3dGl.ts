import * as THREE from "three";
import { ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE } from "../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants";

/** Match RotationPreviewViewport / Animation Lab GL defaults for PBR + cubemap IBL. */
export function applyCourseScene3dRendererDefaults(gl: THREE.WebGLRenderer): void {
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE;
  gl.outputColorSpace = THREE.SRGBColorSpace;
}
