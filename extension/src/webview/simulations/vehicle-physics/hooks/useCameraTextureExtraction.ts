/**
 * Camera Texture Extraction Hook
 * Manages extraction of camera texture from WebGLRenderTarget to canvas element
 */

import { useRef, useCallback } from 'react';
import { VehicleCamera } from '../vehicle/VehicleCamera';

export interface UseCameraTextureExtractionReturn {
  /** Canvas ref for texture extraction and display */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Function to extract texture (call after camera.render()) */
  extractTexture: () => void;
}

/**
 * Hook to extract camera texture to canvas element
 * @param vehicleCamera - VehicleCamera instance ref
 * @returns Canvas ref and extraction function
 */
export const useCameraTextureExtraction = (
  vehicleCamera: React.RefObject<VehicleCamera | null>
): UseCameraTextureExtractionReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const extractTexture = useCallback(() => {
    if (!vehicleCamera.current || !canvasRef.current) return;

    try {
      // Extract to canvas - this directly updates the canvas pixels
      vehicleCamera.current.extractTextureToCanvas(canvasRef.current);
    } catch (error) {
      console.error('Error extracting camera texture:', error);
    }
  }, [vehicleCamera]);

  return {
    canvasRef,
    extractTexture,
  };
};
