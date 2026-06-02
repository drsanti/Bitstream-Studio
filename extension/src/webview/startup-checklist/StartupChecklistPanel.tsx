import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { UseAssetBootstrapResult } from "../asset-bootstrap/useAssetBootstrap.js";
import {
  getConnectionStepContinueLabel,
  runConnectionStep,
} from "../bitstream-app/connection/runConnectionStep.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { StartupChecklistDismissButton } from "./StartupChecklistDismissButton.js";
import { StartupChecklistRecheckButton } from "./StartupChecklistRecheckButton.js";
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
import { shouldShowStartupStepActions, shouldShowStartupRecheckButton } from "./startupChecklistCompletion.js";
import type {
  PresentedStartupStep,
  useStartupChecklistPresentation,
} from "./useStartupChecklistPresentation.js";

export function StartupChecklistPanel(props: {
  bootstrap: UseAssetBootstrapResult;
  checklist: ReturnType<typeof useStartupChecklist>;
  presentation: ReturnType<typeof useStartupChecklistPresentation>;
  canClose: boolean;
  onDismiss?: () => void;
  onRecheck: () => void;
  onFocusSerialPorts: () => void;
}) {
  const { bootstrap, checklist, presentation, canClose, onDismiss, onRecheck, onFocusSerialPorts } = props;
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    steps: truthSteps,
    totalCount,
    activeStepId,
    expandedId,
    toggleExpanded,
    environmentReady,
  } = checklist;

  const {
    presentedSteps,
    headerProgressPercent,
    headerStepLabel,
    focusStepId,
    isSequentialActive,
    walkthroughComplete,
  } = presentation;

  const showRecheckButton = shouldShowStartupRecheckButton({
    isSequentialActive,
    walkthroughComplete,
  });

  useEffect(() => {
    const scrollTargetId = isSequentialActive ? focusStepId : (expandedId ?? focusStepId);
    if (scrollTargetId == null || listRef.current == null) {
      return;
    }
    const list = listRef.current;
    const el = list.querySelector(`[data-startup-step="${scrollTargetId}"]`);
    if (!(el instanceof HTMLElement)) {
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scrollFocusedStep = () => {
      const listRect = list.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elTop = elRect.top - listRect.top + list.scrollTop;
      const targetTop = isSequentialActive
        ? elTop - (list.clientHeight - elRect.height) / 2
        : elTop - 12;
      list.scrollTo({
        top: Math.max(0, targetTop),
        behavior: reduced ? "auto" : "smooth",
      });
    };

    const frame = window.requestAnimationFrame(scrollFocusedStep);
    return () => window.cancelAnimationFrame(frame);
  }, [expandedId, focusStepId, isSequentialActive, presentedSteps.length]);

  const activeConnectionStep = useMemo(() => {
    if (activeStepId == null) {
      return null;
    }
    const step = truthSteps.find((s) => s.id === activeStepId);
    return step?.connectionStepId ?? null;
  }, [activeStepId, truthSteps]);

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
        if (!showRecheckButton) {
          return { label: "Retry check", onClick: onRecheck };
        }
        return null;
      }
      return null;
    }
    if (activeStepId === "handshake" && truthSteps.find((s) => s.id === "handshake")?.status === "fail") {
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
  }, [activeConnectionStep, activeStepId, assetsActionsDisabled, backend, bootstrap, environmentReady, onRecheck, showRecheckButton, truthSteps]);

  return (
    <div
      className="pointer-events-auto mx-auto flex max-h-[min(90vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-md"
      role="dialog"
      aria-labelledby="startup-checklist-title"
      aria-modal="true"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="startup-checklist-title" className="text-base font-semibold text-zinc-50">
              {ternionFreeAssetPackCopy.setupHeaderTitle}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {showRecheckButton ? (
              <StartupChecklistRecheckButton
                onClick={onRecheck}
                busy={assetsActionsDisabled}
              />
            ) : null}
            {onDismiss != null ? (
              <StartupChecklistDismissButton
                onClick={onDismiss}
                hint={
                  canClose
                    ? undefined
                    : ternionFreeAssetPackCopy.checklist.setupCloseEarlyHint
                }
              />
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-zinc-300" aria-live="polite">
          {headerStepLabel}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-sky-500/80 transition-[width] duration-500 ease-out"
            style={{ width: `${headerProgressPercent}%` }}
          />
        </div>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3 scrollbar-hide"
        role="list"
        aria-label="Setup steps"
      >
        {presentedSteps.map((step, index) => (
          <StartupChecklistTimelineRow
            key={step.id}
            step={step}
            isLast={index === presentedSteps.length - 1}
          >
            <StartupChecklistStepRow
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
          </StartupChecklistTimelineRow>
        ))}
      </div>

      {footerPrimary != null ? (
        <footer className="shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <TRNButton size="compact" selected onClick={footerPrimary.onClick}>
            {footerPrimary.label}
          </TRNButton>
        </footer>
      ) : null}
    </div>
  );
}

function timelineDotClass(presentation: PresentedStartupStep["presentation"]): string {
  switch (presentation) {
    case "completed":
      return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)] ring-2 ring-emerald-500/35";
    case "current":
      return "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] ring-2 ring-sky-400/50 animate-pulse";
    case "upcoming":
      return "bg-zinc-600 ring-2 ring-zinc-700/80";
    default:
      return "bg-zinc-600 ring-2 ring-zinc-700/80";
  }
}

function timelineLineClass(
  presentation: PresentedStartupStep["presentation"],
): string {
  return presentation === "completed" ? "bg-emerald-500/45" : "bg-zinc-700/80";
}

function StartupChecklistTimelineRow(props: {
  step: PresentedStartupStep;
  isLast: boolean;
  children: ReactNode;
}) {
  const { step, isLast, children } = props;
  return (
    <div className="flex gap-2 pb-2 last:pb-0" role="listitem">
      <div
        className="flex w-4 shrink-0 flex-col items-center pt-6"
        aria-hidden
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${timelineDotClass(step.presentation)}`} />
        {!isLast ? (
          <span
            className={`mt-1 w-px flex-1 min-h-4 ${timelineLineClass(step.presentation)}`}
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function StartupChecklistStepRow(props: {
  step: StartupChecklistStepView & {
    presentation?: "upcoming" | "current" | "completed";
    displayStatus?: StartupChecklistStepView["status"];
    displayResult?: string;
    isFocus?: boolean;
  };
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
  const truthStatus = step.status;
  const presentation = step.presentation ?? "completed";
  const showActions = shouldShowStartupStepActions(truthStatus);
  const isTourFocus = presentation === "current" && step.isFocus === true;
  const showActionPanel = showActions && (expanded || isTourFocus);

  let body = null;
  if (showActionPanel && step.id === "assets") {
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
  } else if (showActionPanel && step.id === "mode") {
    body = <StartupChecklistModeStepBody />;
  } else if (showActionPanel && step.id === "serial-ports") {
    body = <StartupChecklistSerialPortsBody />;
  } else if (showActionPanel && step.id === "simulator") {
    body = <StartupChecklistSimulatorStepBody />;
  } else if (showActionPanel && step.id === "handshake") {
    body = (
      <StartupChecklistHandshakeStepBody
        rawError={step.error}
        onFocusSerialPorts={onFocusSerialPorts}
      />
    );
  } else if (showActionPanel && step.connectionStepId != null && step.error) {
    body = (
      <p className="text-[10px] leading-relaxed text-rose-100/90">{step.error}</p>
    );
  }

  const displayStatus = step.displayStatus ?? step.status;
  const displayResult = step.displayResult ?? step.result;

  const accent =
    presentation === "completed"
      ? truthStatus === "fail"
        ? "fail"
        : truthStatus === "warn"
          ? "warn"
          : "ok"
      : presentation === "upcoming"
        ? "default"
        : displayStatus === "fail"
          ? "fail"
          : displayStatus === "warn" || truthStatus === "warn"
            ? "warn"
            : displayStatus === "ok"
              ? "ok"
              : displayStatus === "active"
                ? "active"
                : "default";

  return (
    <StartupStepCard
      meta={meta}
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      status={displayStatus}
      result={displayResult}
      resultTooltip={step.resultTooltip}
      progressPercent={step.progressPercent}
      expanded={showActionPanel && body != null}
      onToggle={onToggle}
      accent={accent}
      presentation={presentation}
      isFocus={step.isFocus === true}
    >
      {body}
    </StartupStepCard>
  );
}
