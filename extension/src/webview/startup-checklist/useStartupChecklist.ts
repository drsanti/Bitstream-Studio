import { useCallback, useMemo, useState } from "react";
import {
  assetPackMissingResult,
  assetPackStepResult,
  ternionFreeAssetPackCopy,
} from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { UseAssetBootstrapResult } from "../asset-bootstrap/useAssetBootstrap.js";
import type { ConnectionStepStatus, ConnectionStepView } from "../bitstream-app/connection/useConnectionSteps.js";
import { useConnectionSteps } from "../bitstream-app/connection/useConnectionSteps.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { shouldBlockShellUntilAssetsReady } from "../webviewHostCapabilities.js";
import {
  connectionStepToStartupId,
  getStartupStepMeta,
  linkStartupStepOrder,
  STARTUP_ENVIRONMENT_STEPS,
  type StartupStepId,
} from "./startup-step-meta.js";
import { startupLinkStepResult } from "./startup-link-step-copy.js";

export type StartupChecklistStepView = {
  id: StartupStepId;
  status: ConnectionStepStatus;
  result: string;
  resultTooltip?: string;
  progressPercent: number | null;
  connectionStepId?: ConnectionStepView["id"];
  error?: string;
};

function assetPhaseToStatus(phase: UseAssetBootstrapResult["phase"]): ConnectionStepStatus {
  switch (phase) {
    case "ready":
      return "ok";
    case "checking":
      return "active";
    case "syncing":
      return "active";
    case "blocked":
    case "error":
      return "fail";
    default:
      return "pending";
  }
}

function networkStatusFromHost(
  host: UseAssetBootstrapResult["hostCheck"],
  assetPhase: UseAssetBootstrapResult["phase"],
): ConnectionStepStatus {
  if (assetPhase === "checking" || assetPhase === "syncing") {
    return "locked";
  }
  if (host == null) {
    return "pending";
  }
  if (host.internetReachable || host.allPresentOnDisk) {
    return "ok";
  }
  return "fail";
}

export function useStartupChecklist(options: {
  bootstrap: UseAssetBootstrapResult;
  panelActive: boolean;
}): {
  steps: StartupChecklistStepView[];
  environmentReady: boolean;
  linkReady: boolean;
  readyCount: number;
  totalCount: number;
  activeStepId: StartupStepId | null;
  expandedId: StartupStepId | null;
  setExpandedId: (id: StartupStepId | null) => void;
  toggleExpanded: (id: StartupStepId) => void;
} {
  const { bootstrap, panelActive } = options;
  const blockShellUntilAssets = shouldBlockShellUntilAssetsReady();
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const { steps: connectionSteps, linkReady } = useConnectionSteps(panelActive);

  const [expandedId, setExpandedId] = useState<StartupStepId | null>("assets");

  const environmentReady = !blockShellUntilAssets || bootstrap.phase === "ready";

  const connectionByStartupId = useMemo(() => {
    const map = new Map<StartupStepId, ConnectionStepView>();
    for (const step of connectionSteps) {
      const sid = connectionStepToStartupId(step.id, backend);
      if (sid != null) {
        map.set(sid, step);
      }
    }
    return map;
  }, [connectionSteps, backend]);

  const steps = useMemo((): StartupChecklistStepView[] => {
    const assetStatus = assetPhaseToStatus(bootstrap.phase);

    const assetResultFields = ((): { result: string; resultTooltip?: string } => {
      if (bootstrap.phase === "ready") {
        const local = bootstrap.hostCheck?.freePackLocalFileCount;
        const remote = bootstrap.hostCheck?.freePackRemoteFileCount;
        const onlineOnly = bootstrap.readiness?.reason === "online-only";
        return assetPackStepResult({ local, remote, onlineOnly });
      }
      if (bootstrap.phase === "syncing") {
        return { result: ternionFreeAssetPackCopy.results.packDownloading };
      }
      if (bootstrap.phase === "checking") {
        return { result: ternionFreeAssetPackCopy.results.packVerifying };
      }
      if (bootstrap.readiness?.status === "blocked") {
        const local = bootstrap.hostCheck?.freePackLocalFileCount ?? 0;
        const remote = bootstrap.hostCheck?.freePackRemoteFileCount ?? 0;
        const offline = bootstrap.readiness.reason === "offline";
        if (remote > 0) {
          const missing = Math.max(0, remote - local);
          return assetPackMissingResult({ missing, offline });
        }
        const n = bootstrap.readiness.missingPaths.length;
        return assetPackMissingResult({ missing: n, offline });
      }
      if (bootstrap.phase === "error") {
        return {
          result: ternionFreeAssetPackCopy.results.checkFailed,
          resultTooltip: bootstrap.statusLine ?? undefined,
        };
      }
      return { result: bootstrap.statusLine ?? ternionFreeAssetPackCopy.results.checkFailed };
    })();

    const netStatus = networkStatusFromHost(bootstrap.hostCheck, bootstrap.phase);
    const netResultFields = ((): { result: string; resultTooltip?: string } => {
      if (bootstrap.hostCheck == null) {
        return { result: ternionFreeAssetPackCopy.results.networkWaiting };
      }
      const probe = bootstrap.hostCheck.internetProbeUrl;
      const probeHint =
        probe != null && probe.length > 0
          ? ternionFreeAssetPackCopy.tooltips.networkProbe(probe)
          : undefined;
      if (bootstrap.hostCheck.internetReachable) {
        return {
          result: ternionFreeAssetPackCopy.results.networkOnline,
          resultTooltip: probeHint,
        };
      }
      return {
        result: ternionFreeAssetPackCopy.results.networkOffline,
        resultTooltip: probeHint,
      };
    })();

    const modeStatus: ConnectionStepStatus = environmentReady ? "ok" : "locked";
    const modeResult =
      backend === "simulator"
        ? ternionFreeAssetPackCopy.results.modeSimulator
        : ternionFreeAssetPackCopy.results.modeHardware;

    const envSteps: StartupChecklistStepView[] = [
      {
        id: "assets",
        status: assetStatus,
        result: assetResultFields.result,
        resultTooltip: assetResultFields.resultTooltip,
        progressPercent: bootstrap.phase === "syncing" ? bootstrap.syncPercent : null,
      },
      {
        id: "network",
        status: netStatus,
        result: netResultFields.result,
        resultTooltip: netResultFields.resultTooltip,
        progressPercent: null,
      },
      {
        id: "mode",
        status: modeStatus,
        result: modeResult,
        progressPercent: null,
      },
    ];

    if (!environmentReady) {
      return envSteps;
    }

    const linkIds = linkStartupStepOrder(backend);
    const linkSteps: StartupChecklistStepView[] = linkIds.map((id) => {
      const conn = connectionByStartupId.get(id);
      if (conn == null) {
        return {
          id,
          status: "pending" as ConnectionStepStatus,
          result: "—",
          progressPercent: null,
        };
      }
      const { result, resultTooltip } = startupLinkStepResult(id, conn);
      return {
        id,
        status: conn.status,
        result,
        resultTooltip,
        progressPercent: null,
        connectionStepId: conn.id,
        error: conn.error,
      };
    });

    return [...envSteps, ...linkSteps];
  }, [
    backend,
    bootstrap.hostCheck,
    bootstrap.phase,
    bootstrap.readiness,
    bootstrap.statusLine,
    bootstrap.syncPercent,
    connectionByStartupId,
    environmentReady,
  ]);

  const totalCount = steps.length;
  const readyCount = steps.filter((s) => s.status === "ok").length;

  const activeStepId = useMemo((): StartupStepId | null => {
    for (const step of steps) {
      if (step.status !== "ok") {
        return step.id;
      }
    }
    return null;
  }, [steps]);

  const toggleExpanded = useCallback((id: StartupStepId) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return {
    steps,
    environmentReady,
    linkReady,
    readyCount,
    totalCount,
    activeStepId,
    expandedId,
    setExpandedId,
    toggleExpanded,
  };
}

export function startupStepMetaForView(step: StartupChecklistStepView) {
  return getStartupStepMeta(step.id);
}

export const STARTUP_STEP_TOTAL_ENV = STARTUP_ENVIRONMENT_STEPS.length;
