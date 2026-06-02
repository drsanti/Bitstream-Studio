import { useEffect, useMemo, useRef, useState } from "react";
import {
  setupHeaderStepFocus,
  setupHeaderStepSummary,
  ternionFreeAssetPackCopy,
} from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { ConnectionStepStatus } from "../bitstream-app/connection/useConnectionSteps.js";
import {
  STARTUP_STEP_MAX_OPERATION_MS,
  STARTUP_STEP_MIN_VISIBLE_MS,
  STARTUP_STEP_PADDING_AFTER_MS,
  STARTUP_STEP_POLL_MS,
} from "./startupChecklistPresentation.constants.js";
import { isStepOperationInProgress } from "./startupChecklistCompletion.js";
import { startupStepMetaForView, type StartupChecklistStepView } from "./useStartupChecklist.js";

export type StartupPresentationMode = "instant" | "sequential";

/** upcoming = visible but not started; current = focused; completed = done in walkthrough */
export type StepPresentationPhase = "upcoming" | "current" | "completed";

export type PresentedStartupStep = StartupChecklistStepView & {
  presentation: StepPresentationPhase;
  displayStatus: ConnectionStepStatus;
  displayResult: string;
  isFocus: boolean;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function resolveStartupPresentationMode(options: {
  userOpenedPanel: boolean;
  /** Auto overlay (not Ctrl+/ or chip) — walk through cards step by step. */
  autoOverlay?: boolean;
}): StartupPresentationMode {
  if (options.userOpenedPanel) {
    return "instant";
  }
  if (prefersReducedMotion()) {
    return "instant";
  }
  if (options.autoOverlay) {
    return "sequential";
  }
  return "instant";
}

function displayStatusForCurrent(
  truth: ConnectionStepStatus,
  orchestratorPhase: "enter" | "dwell" | "complete",
): ConnectionStepStatus {
  if (truth === "fail" || truth === "warn") {
    return truth;
  }
  if (truth === "ok" && orchestratorPhase === "complete") {
    return "ok";
  }
  if (truth === "ok") {
    return orchestratorPhase === "dwell" ? "active" : "ok";
  }
  if (truth === "active" || truth === "pending" || truth === "locked") {
    return "active";
  }
  return truth;
}

/** focus = on a card (min 250 ms + wait for check); between = 250 ms padding before next card */
type OrchestratorPhase = "focus" | "between";

function stepIdsKey(steps: StartupChecklistStepView[]): string {
  return steps.map((s) => s.id).join("|");
}

export function useStartupChecklistPresentation(
  steps: StartupChecklistStepView[],
  mode: StartupPresentationMode,
  /** Bump from parent (e.g. header Recheck) to restart the tour at step 1. */
  tourResetGeneration = 0,
): {
  presentedSteps: PresentedStartupStep[];
  focusIndex: number;
  focusStepId: PresentedStartupStep["id"] | null;
  headerProgressPercent: number;
  headerStepLabel: string;
  readyCount: number;
  isSequentialActive: boolean;
  walkthroughComplete: boolean;
} {
  const [focusIndex, setFocusIndex] = useState(0);
  const [orchestratorPhase, setOrchestratorPhase] = useState<OrchestratorPhase>("focus");
  const [tourFinished, setTourFinished] = useState(false);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const dwellStartedAtRef = useRef<number>(Date.now());
  const stepIdsKeyRef = useRef(stepIdsKey(steps));
  const timerRef = useRef<number | null>(null);

  const clearTourTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTourToStart = () => {
    clearTourTimer();
    setFocusIndex(0);
    setOrchestratorPhase("focus");
    setTourFinished(false);
    dwellStartedAtRef.current = Date.now();
  };

  /** Header Recheck — replay cards from 1 / N. */
  useEffect(() => {
    if (tourResetGeneration === 0) {
      return;
    }
    resetTourToStart();
  }, [tourResetGeneration]);

  /** Reset tour only when the step list identity changes (e.g. UART ↔ Simulator), not on status polls. */
  useEffect(() => {
    const nextKey = stepIdsKey(steps);
    if (nextKey === stepIdsKeyRef.current) {
      return;
    }
    const prevKey = stepIdsKeyRef.current;
    stepIdsKeyRef.current = nextKey;
    const prevIds = prevKey.split("|").filter(Boolean);
    const nextIds = nextKey.split("|").filter(Boolean);
    setFocusIndex((index) => {
      const currentId = prevIds[index];
      if (currentId != null) {
        const newIndex = nextIds.indexOf(currentId);
        if (newIndex >= 0) {
          return newIndex;
        }
      }
      return Math.min(index, Math.max(0, nextIds.length - 1));
    });
    setOrchestratorPhase("focus");
    setTourFinished(false);
    dwellStartedAtRef.current = Date.now();
  }, [steps]);

  /** Entering sequential mode (e.g. Recheck from manual panel) — start at card 1. */
  const prevModeRef = useRef(mode);
  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = mode;
    if (prev === "instant" && mode === "sequential") {
      resetTourToStart();
    }
  }, [mode]);

  const focusTruthStatus = steps[focusIndex]?.status ?? "pending";

  useEffect(() => {
    if (mode !== "sequential") {
      clearTourTimer();
      setTourFinished(false);
      return;
    }

    const stepCount = stepsRef.current.length;
    if (stepCount === 0 || tourFinished || focusIndex >= stepCount) {
      clearTourTimer();
      return;
    }

    clearTourTimer();

    const schedule = (ms: number, fn: () => void) => {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        fn();
      }, ms);
    };

    if (orchestratorPhase === "between") {
      schedule(STARTUP_STEP_PADDING_AFTER_MS, () => {
        const count = stepsRef.current.length;
        if (focusIndex + 1 >= count) {
          setFocusIndex(count);
          setTourFinished(true);
          return;
        }
        setFocusIndex((i) => i + 1);
        setOrchestratorPhase("focus");
        dwellStartedAtRef.current = Date.now();
      });
      return clearTourTimer;
    }

    let cancelled = false;
    const tick = () => {
      if (cancelled) {
        return;
      }
      const status = stepsRef.current[focusIndex]?.status ?? "pending";
      const elapsed = Date.now() - dwellStartedAtRef.current;
      const minMet = elapsed >= STARTUP_STEP_MIN_VISIBLE_MS;
      const operationDone = !isStepOperationInProgress(status);
      if (minMet && operationDone) {
        setOrchestratorPhase("between");
        return;
      }
      if (elapsed >= STARTUP_STEP_MAX_OPERATION_MS) {
        setOrchestratorPhase("between");
        return;
      }
      timerRef.current = window.setTimeout(tick, STARTUP_STEP_POLL_MS);
    };
    tick();

    return () => {
      cancelled = true;
      clearTourTimer();
    };
  }, [focusIndex, focusTruthStatus, mode, orchestratorPhase, tourFinished]);

  const tourIndexComplete = tourFinished || (steps.length > 0 && focusIndex >= steps.length);
  const snapToInstant = mode === "instant" || steps.length === 0 || tourIndexComplete;

  const presentedSteps = useMemo((): PresentedStartupStep[] => {
    const waiting = ternionFreeAssetPackCopy.results.stepWaiting;
    const checking = ternionFreeAssetPackCopy.results.stepChecking;

    if (snapToInstant && mode === "instant") {
      const firstOpen = steps.findIndex((s) => s.status !== "ok");
      return steps.map((step, index) => ({
        ...step,
        presentation: "completed" as const,
        displayStatus: step.status,
        displayResult: step.result,
        isFocus: firstOpen === index,
      }));
    }

    if (snapToInstant && mode === "sequential") {
      return steps.map((step) => {
        const touredStatus: ConnectionStepStatus =
          step.status === "fail" ? "fail" : step.status === "warn" ? "warn" : "ok";
        return {
          ...step,
          presentation: "completed" as const,
          displayStatus: touredStatus,
          displayResult: step.result,
          progressPercent: null,
          isFocus: false,
        };
      });
    }

    return steps.map((step, index) => {
      if (index < focusIndex) {
        const touredStatus: ConnectionStepStatus =
          step.status === "fail" ? "fail" : step.status === "warn" ? "warn" : "ok";
        return {
          ...step,
          presentation: "completed" as const,
          displayStatus: touredStatus,
          displayResult: step.result,
          progressPercent: null,
          isFocus: false,
        };
      }
      if (index > focusIndex) {
        return {
          ...step,
          presentation: "upcoming" as const,
          displayStatus: "locked",
          displayResult: waiting,
          isFocus: false,
        };
      }

      const displayPhase =
        orchestratorPhase === "between" ? "complete" : "dwell";
      const displayStatus = displayStatusForCurrent(step.status, displayPhase);
      const displayResult =
        displayStatus === "active"
          ? step.status === "active" && step.result.length > 0
            ? step.result
            : checking
          : step.result;

      return {
        ...step,
        presentation: "current" as const,
        displayStatus,
        displayResult,
        isFocus: true,
      };
    });
  }, [focusIndex, mode, orchestratorPhase, snapToInstant, steps]);

  const truthReadyCount = steps.filter((s) => s.status === "ok").length;

  const presentationReadyCount = snapToInstant
    ? truthReadyCount
    : presentedSteps.filter((s) => s.presentation === "completed" && s.status === "ok").length;

  const focusStep = presentedSteps[Math.min(focusIndex, Math.max(0, steps.length - 1))] ?? null;
  const focusMeta = focusStep != null ? startupStepMetaForView(focusStep) : null;

  const headerProgressPercent =
    steps.length > 0
      ? Math.round(
          ((snapToInstant && mode === "instant"
            ? truthReadyCount
            : focusIndex + (orchestratorPhase === "between" ? 1 : 0)) /
            steps.length) *
            100,
        )
      : 0;

  const headerStepLabel =
    focusMeta != null && !snapToInstant
      ? setupHeaderStepFocus(focusIndex + 1, steps.length, focusMeta.title)
      : setupHeaderStepSummary(truthReadyCount, steps.length);

  const walkthroughComplete = mode !== "sequential" || tourIndexComplete;

  return {
    presentedSteps,
    focusIndex: snapToInstant && mode === "instant" ? Math.max(0, steps.findIndex((s) => s.status !== "ok")) : focusIndex,
    focusStepId: focusStep?.id ?? null,
    headerProgressPercent,
    headerStepLabel,
    readyCount: presentationReadyCount,
    isSequentialActive: mode === "sequential" && !tourIndexComplete,
    walkthroughComplete,
  };
}
