import { Html, useGLTF } from "@react-three/drei";
import React, { useState } from "react";
import { isVsCodeExtensionWebview } from "../../../isVsCodeExtensionWebview";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import {
  PROJECT4_ROBOT_FREE_MIRROR_PLACEHOLDER,
  PROJECT4_ROBOT_ONLINE_PLACEHOLDER,
} from "../../lib/project4-robot-asset-constants";
import { syncProject4RobotFreePackFromGithub } from "../../lib/project4-sync-free-robot-model";
import { useProject4SettingsStore } from "../../settings/project4-settings.store";

function TwinRobotLoadFailureOverlay(props: {
  errorMessage: string;
  failedResolvedUrl: string;
  onReloadRequested: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [syncHint, setSyncHint] = useState<string | null>(null);
  const ext = isVsCodeExtensionWebview();

  const patchAndReload = (robotModelUrl: string) => {
    try {
      useGLTF.clear(props.failedResolvedUrl);
    } catch {
      /* drei clears best-effort */
    }
    useProject4SettingsStore.getState().patchProject4Settings({ robotModelUrl });
    props.onReloadRequested();
  };

  const downloadRobotViaFreePack = async () => {
    setBusy(true);
    setSyncHint(null);
    try {
      await syncProject4RobotFreePackFromGithub();
      patchAndReload(PROJECT4_ROBOT_FREE_MIRROR_PLACEHOLDER);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[Project4] Free-pack robot sync failed:", msg);
      setSyncHint(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Html
      fullscreen
      wrapperClass="pointer-events-none"
      className="pointer-events-none flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10"
    >
      <div className="pointer-events-auto flex w-full max-w-[min(92vw,420px)] flex-col gap-2 rounded-lg border border-amber-400/30 bg-zinc-950/92 px-3 py-3 text-left text-[11px] leading-snug text-zinc-200 shadow-xl backdrop-blur-md">
        <div className="font-semibold text-amber-100/95">Robot GLB failed to load</div>
        <div className="max-h-28 overflow-auto break-all font-mono text-[10px] text-zinc-400">
          {props.errorMessage}
        </div>
        <p className="text-zinc-400">
          Packaged extensions often omit large models from the VSIX. Load from GitHub (online), or sync just this file
          into extension storage (same Free Assets flow as the main app).
        </p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          <TRNButton
            selected
            size="compact"
            disabled={busy}
            className="text-[11px]"
            onClick={() => patchAndReload(PROJECT4_ROBOT_ONLINE_PLACEHOLDER)}
          >
            Use GitHub (online URL)
          </TRNButton>
          <TRNButton
            size="compact"
            disabled={busy || !ext}
            className="text-[11px]"
            onClick={() => void downloadRobotViaFreePack()}
          >
            {busy ? "Downloading…" : "Download robot GLB (Free pack)"}
          </TRNButton>
        </div>
        {!ext ? (
          <p className="text-[10px] text-zinc-500">
            Free-pack download runs in the VS Code webview only. In browser dev, use the Free Assets bridge / loader or
            the online URL button above.
          </p>
        ) : null}
        {syncHint ? (
          <p className="text-[10px] text-rose-300/90">{syncHint}</p>
        ) : null}
      </div>
    </Html>
  );
}

type BoundaryProps = {
  children: React.ReactNode;
  failedResolvedUrl: string;
  onReloadRequested: () => void;
};

type BoundaryState = { message: string | null };

/** Catches {@link useGLTF} / loader failures inside the R3F tree and offers recovery actions. */
export class Project4TwinRobotLoadErrorBoundary extends React.Component<
  BoundaryProps,
  BoundaryState
> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { message: null };
  }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return {
      message: error instanceof Error ? error.message : String(error),
    };
  }

  override componentDidUpdate(prevProps: BoundaryProps): void {
    if (
      prevProps.failedResolvedUrl !== this.props.failedResolvedUrl &&
      this.state.message != null
    ) {
      this.setState({ message: null });
    }
  }

  override render(): React.ReactNode {
    if (this.state.message != null) {
      return (
        <TwinRobotLoadFailureOverlay
          errorMessage={this.state.message}
          failedResolvedUrl={this.props.failedResolvedUrl}
          onReloadRequested={this.props.onReloadRequested}
        />
      );
    }
    return this.props.children;
  }
}
