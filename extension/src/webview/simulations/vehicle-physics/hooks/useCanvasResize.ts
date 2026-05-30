/**
 * Canvas Resize Hook
 * Manages canvas container resize logic with ResizeObserver
 */

import { useRef, useState, useEffect, useCallback } from 'react';

export interface UseCanvasResizeReturn {
  /** Ref for the canvas container element */
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Current canvas size (maintains 1:1 aspect ratio) */
  canvasSize: { width: number; height: number };
}

/**
 * Hook to manage canvas container resize with automatic size calculation
 * @param initialSize - Initial canvas size (default: 280x280)
 * @returns Container ref and canvas size state
 */
export function useCanvasResize(
  initialSize: { width: number; height: number } = { width: 280, height: 280 }
): UseCanvasResizeReturn {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(initialSize);

  // Handle canvas auto-resize based on container width
  const handleResize = useCallback(() => {
    if (!canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    if (rect.width > 0) {
      // Calculate canvas size: use container width minus padding (32px total: 16px on each side)
      const padding = 32;
      const availableWidth = rect.width - padding;
      // Maintain 1:1 aspect ratio, ensure minimum size of 100px
      const size = Math.max(100, availableWidth);
      setCanvasSize({ width: size, height: size });
    }
  }, []);

  // Set up ResizeObserver for auto-resize
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    // Initial size calculation
    handleResize();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          handleResize();
        }
      }
    });

    resizeObserver.observe(canvasContainerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  return {
    canvasContainerRef,
    canvasSize,
  };
}
