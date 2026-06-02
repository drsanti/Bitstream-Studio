import { useCallback, useMemo, useState } from "react";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { UseAssetBootstrapResult } from "../asset-bootstrap/useAssetBootstrap.js";
import type { ConnectionStepStatus, ConnectionStepView } from "../bitstream-app/connection/useConnectionSteps.js";
import { useConnectionSteps } from "../bitstream-app/connection/useConnectionSteps.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { isVsCodeExtensionWebview } from "../isVsCodeExtensionWebview.js";
import {
  connectionStepToStartupId,
  getStartupStepMeta,
  linkStartupStepOrder,
  STARTUP_ENVIRONMENT_STEPS,
  type StartupStepId,
} from "./startup-step-meta.js";

export type StartupChecklistStepView = {
  id: StartupStepId;
  status: ConnectionStepStatus;
  result: string;
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
  const isExtension = isVsCodeExtensionWebview();
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const { steps: connectionSteps, linkReady } = useConnectionSteps(panelActive && isExtension);

  const [expandedId, setExpandedId] = useState<StartupStepId | null>("assets");

  const environmentReady = !isExtension || bootstrap.phase === "ready";

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
    const assetStatus = isExtension ? assetPhaseToStatus(bootstrap.phase) : "ok";
    const assetResult = (() => {
      if (!isExtension) {
        return "Dev browser — asset gate skipped";
      }
      if (bootstrap.phase === "ready") {
        const local = bootstrap.hostCheck?.freePackLocalFileCount;
        const remote = bootstrap.hostCheck?.freePackRemoteFileCount;
        if (typeof local === "number" && typeof remote === "number" && remote > 0) {
          return ternionFreeAssetPackCopy.onDiskProgress(local, remote);
        }
        return bootstrap.readiness?.reason === "online-only"
          ? ternionFreeAssetPackCopy.networkReachable
          : ternionFreeAssetPackCopy.onDiskReady;
      }
      if (bootstrap.phase === "syncing") {
        return ternionFreeAssetPackCopy.downloading;
      }
      if (bootstrap.phase === "checking") {
        return ternionFreeAssetPackCopy.verifying;
      }
      if (bootstrap.readiness?.status === "blocked") {
        const local = bootstrap.hostCheck?.freePackLocalFileCount ?? 0;
        const remote = bootstrap.hostCheck?.freePackRemoteFileCount ?? 0;
        if (remote > 0) {
          const missing = Math.max(0, remote - local);
          return ternionFreeAssetPackCopy.missingCount(
            missing,
            bootstrap.readiness.reason === "offline",
          );
        }
        const n = bootstrap.readiness.missingPaths.length;
        return ternionFreeAssetPackCopy.missingCount(
          n,
          bootstrap.readiness.reason === "offline",
        );
      }
      return bootstrap.statusLine ?? "Check failed";
    })();

    const netStatus = isExtension
      ? networkStatusFromHost(bootstrap.hostCheck, bootstrap.phase)
      : "ok";
    const netResult = (() => {
      if (!isExtension) {
        return "—";
      }
      if (bootstrap.hostCheck == null) {
        return "Waiting for host check";
      }
      return bootstrap.hostCheck.internetReachable
        ? ternionFreeAssetPackCopy.networkReachable
        : ternionFreeAssetPackCopy.networkOffline;
    })();

    const modeStatus: ConnectionStepStatus = environmentReady ? "ok" : "locked";
    const modeResult =
      backend === "simulator" ? "Simulator (virtual MCU)" : "Bitstream (UART firmware)";

    const envSteps: StartupChecklistStepView[] = [
      {
        id: "assets",
        status: assetStatus,
        result: assetResult,
        progressPercent:
          bootstrap.phase === "syncing" ? bootstrap.syncPercent : null,
      },
      {
        id: "network",
        status: netStatus,
        result: netResult,
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
      return {
        id,
        status: conn.status,
        result: conn.summary,
        progressPercent: null,
        connectionStepId: conn.id,
        error: conn.error,
      };
    });

    return [...envSteps, ...linkSteps];
  }, [
    backend,
    bootstrap.hostCheck,
    bootstrap.hostCheck?.freePackLocalFileCount,
    bootstrap.hostCheck?.freePackRemoteFileCount,
    bootstrap.phase,
    bootstrap.readiness,
    bootstrap.statusLine,
    bootstrap.syncPercent,
    connectionByStartupId,
    environmentReady,
    isExtension,
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
