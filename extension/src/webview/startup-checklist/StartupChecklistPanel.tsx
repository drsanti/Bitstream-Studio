import { useMemo } from "react";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { UseAssetBootstrapResult } from "../asset-bootstrap/useAssetBootstrap.js";
import { useConnectionPanelStore } from "../bitstream-app/connection/connectionPanel.store.js";
import {
  getConnectionStepContinueLabel,
  runConnectionStep,
} from "../bitstream-app/connection/runConnectionStep.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { StartupChecklistAssetsStepBody } from "./StartupChecklistAssetsStepBody.js";
import { StartupChecklistHandshakeStepBody } from "./StartupChecklistHandshakeStepBody.js";
import { StartupChecklistModeStepBody } from "./StartupChecklistModeStepBody.js";
import { StartupChecklistSerialPortsBody } from "./StartupChecklistSerialPortsBody.js";
import { StartupChecklistSimulatorStepBody } from "./StartupChecklistSimulatorStepBody.js";
import { StartupStepCard } from "./StartupStepCard.js";
import {
  startupStepMetaForView,
  type StartupChecklistStepView,
} from "./useStartupChecklist.js";
import type { useStartupChecklist } from "./useStartupChecklist.js";

export function StartupChecklistPanel(props: {
  bootstrap: UseAssetBootstrapResult;
  checklist: ReturnType<typeof useStartupChecklist>;
  onDismiss?: () => void;
  onFocusSerialPorts: () => void;
}) {
  const { bootstrap, checklist, onDismiss, onFocusSerialPorts } = props;
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);

  const {
    steps,
    readyCount,
    totalCount,
    activeStepId,
    expandedId,
    toggleExpanded,
    environmentReady,
  } = checklist;

  const globalPct = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const activeConnectionStep = useMemo(() => {
    if (activeStepId == null) {
      return null;
    }
    const step = steps.find((s) => s.id === activeStepId);
    return step?.connectionStepId ?? null;
  }, [activeStepId, steps]);

  const missingPaths =
    bootstrap.readiness?.status === "blocked"
      ? bootstrap.hostCheck?.freePackMissingSample ??
        bootstrap.readiness.missingPaths
      : [];

  const isAssetsSyncing = bootstrap.phase === "syncing";

  const canDownload =
    bootstrap.phase === "blocked" && (bootstrap.hostCheck?.internetReachable ?? false);

  const assetsActionsDisabled =
    bootstrap.phase === "syncing" || bootstrap.phase === "checking";

  const footerPrimary = useMemo(() => {
    if (assetsActionsDisabled) {
      return null;
    }
    if (!environmentReady) {
      if (bootstrap.phase === "blocked" && bootstrap.hostCheck?.internetReachable) {
        return { label: ternionFreeAssetPackCopy.downloadFooter, onClick: bootstrap.startRequiredSync };
      }
      if (bootstrap.phase === "blocked" || bootstrap.phase === "error") {
        return { label: "Retry check", onClick: bootstrap.recheck };
      }
      return null;
    }
    if (activeStepId === "handshake" && steps.find((s) => s.id === "handshake")?.status === "fail") {
      return {
        label: "Retry handshake",
        onClick: () => void runConnectionStep("handshake"),
      };
    }
    if (activeConnectionStep != null) {
      return {
        label: `Continue: ${getConnectionStepContinueLabel(activeConnectionStep, backend)}`,
        onClick: () => void runConnectionStep(activeConnectionStep),
      };
    }
    return null;
  }, [activeConnectionStep, activeStepId, assetsActionsDisabled, backend, bootstrap, environmentReady, steps]);

  return (
    <div
      className="pointer-events-auto mx-auto flex max-h-[min(90vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-md"
      role="dialog"
      aria-labelledby="startup-checklist-title"
      aria-modal="true"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="startup-checklist-title" className="text-base font-semibold text-zinc-50">
              Setup
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {ternionFreeAssetPackCopy.setupHeaderSubtitle}
            </p>
          </div>
          {environmentReady && onDismiss != null ? (
            <TRNButton size="compact" onClick={onDismiss}>
              Later
            </TRNButton>
          ) : null}
        </div>
        <p className="mt-3 text-xs font-medium text-zinc-300">
          {readyCount} / {totalCount} ready
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-sky-500/80 transition-[width] duration-500"
            style={{ width: `${globalPct}%` }}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 scrollbar-hide">
        {steps.map((step, index) => (
          <StartupChecklistStepRow
            key={step.id}
            step={step}
            stepIndex={index + 1}
            stepTotal={totalCount}
            expanded={expandedId === step.id}
            onToggle={() => toggleExpanded(step.id)}
            canDownload={canDownload}
            assetsActionsDisabled={assetsActionsDisabled}
            isAssetsSyncing={isAssetsSyncing}
            syncProgress={bootstrap.syncProgress}
            missingPaths={step.id === "assets" ? missingPaths : []}
            onDownload={bootstrap.startRequiredSync}
            onRecheck={bootstrap.recheck}
            onFocusSerialPorts={onFocusSerialPorts}
          />
        ))}
      </div>

      <footer className="shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
        {footerPrimary != null ? (
          <TRNButton size="compact" selected onClick={footerPrimary.onClick}>
            {footerPrimary.label}
          </TRNButton>
        ) : null}
        {environmentReady ? (
          <TRNButton
            size="compact"
            onClick={() => useConnectionPanelStore.getState().openPanel(activeConnectionStep ?? undefined)}
          >
            Connection details
          </TRNButton>
        ) : null}
      </footer>
    </div>
  );
}

function StartupChecklistStepRow(props: {
  step: StartupChecklistStepView;
  stepIndex: number;
  stepTotal: number;
  expanded: boolean;
  onToggle: () => void;
  canDownload: boolean;
  assetsActionsDisabled: boolean;
  isAssetsSyncing: boolean;
  syncProgress: UseAssetBootstrapResult["syncProgress"];
  missingPaths: string[];
  onDownload: () => void;
  onRecheck: () => void;
  onFocusSerialPorts: () => void;
}) {
  const {
    step,
    stepIndex,
    stepTotal,
    expanded,
    onToggle,
    canDownload,
    assetsActionsDisabled,
    isAssetsSyncing,
    syncProgress,
    missingPaths,
    onDownload,
    onRecheck,
    onFocusSerialPorts,
  } = props;
  const meta = startupStepMetaForView(step);

  let body = null;
  if (expanded && step.id === "assets") {
    body = (
      <StartupChecklistAssetsStepBody
        canDownload={canDownload}
        actionsDisabled={assetsActionsDisabled}
        isSyncing={isAssetsSyncing}
        syncProgress={syncProgress}
        missingPaths={missingPaths}
        onDownload={onDownload}
        onRecheck={onRecheck}
      />
    );
  } else if (expanded && step.id === "mode") {
    body = <StartupChecklistModeStepBody />;
  } else if (expanded && step.id === "serial-ports") {
    body = <StartupChecklistSerialPortsBody />;
  } else if (expanded && step.id === "simulator") {
    body = <StartupChecklistSimulatorStepBody />;
  } else if (expanded && step.id === "handshake") {
    body = (
      <StartupChecklistHandshakeStepBody
        rawError={step.error}
        onFocusSerialPorts={onFocusSerialPorts}
      />
    );
  } else if (expanded && step.connectionStepId != null && step.error) {
    body = (
      <p className="text-[10px] leading-relaxed text-rose-100/90">{step.error}</p>
    );
  }

  const accent =
    step.status === "fail" ? "fail" : step.status === "ok" ? "ok" : step.status === "active" ? "active" : "default";

  return (
    <StartupStepCard
      meta={meta}
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      status={step.status}
      result={step.result}
      progressPercent={step.progressPercent}
      expanded={expanded}
      onToggle={onToggle}
      accent={accent}
    >
      {body}
    </StartupStepCard>
  );
}
