import { Html } from "@react-three/drei";
import { Component, type ReactNode } from "react";
import { ternionFreeAssetPackCopy } from "../../../../asset-bootstrap/ternionFreeAssetPackCopy.js";

/**
 * Catches `useGLTF` / R3F load failures inside a {@link Canvas} so the shell keeps running.
 */
export class GlbLoadErrorBoundary extends Component<
  {
    children: ReactNode;
    resetKey: string;
    shortLabel?: string;
    onError?: (error: Error) => void;
  },
  { hasError: boolean; message: string | null }
> {
  override state = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): { hasError: boolean; message: string } {
    return { hasError: true, message: error.message };
  }

  override componentDidUpdate(prevProps: { resetKey: string }): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: null });
    }
  }

  override componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      const label = this.props.shortLabel ?? "3D preview";
      return (
        <Html center>
          <div className="max-w-[min(92vw,320px)] rounded-lg border border-amber-500/30 bg-zinc-950/95 px-3 py-2 text-center shadow-lg backdrop-blur-sm">
            <p className="text-xs font-medium text-amber-100">{label} unavailable</p>
            <p className="mt-1 text-[10px] leading-snug text-zinc-400">
              {ternionFreeAssetPackCopy.glbPreviewUnavailableHint}
            </p>
            {this.state.message ? (
              <p className="mt-2 max-h-16 overflow-auto break-all font-mono text-[9px] text-zinc-500">
                {this.state.message}
              </p>
            ) : null}
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}
