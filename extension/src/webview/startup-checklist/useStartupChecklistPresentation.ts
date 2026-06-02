import { useEffect, useMemo, useRef, useState } from "react";
import {
  setupHeaderStepFocus,
  setupHeaderStepSummary,
  ternionFreeAssetPackCopy,
} from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { ConnectionStepStatus } from "../bitstream-app/connection/useConnectionSteps.js";
import {
  STARTUP_MAX_ORCHESTRATION_MS,
  STARTUP_STEP_COMPLETE_MS,
  STARTUP_STEP_ENTER_MS,
  STARTUP_STEP_GAP_MS,
  STARTUP_STEP_MIN_DWELL_MS,
} from "./startupChecklistPresentation.constants.js";
import { startupStepMetaForView, type StartupChecklistStepView } from "./useStartupChecklist.js";

export type StartupPresentationMode = "instant" | "sequential";

export type StepPresentationPhase = "hidden" | "current" | "completed";

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
  enabled: boolean;
  userOpenedPanel: boolean;
}): StartupPresentationMode {
  if (!options.enabled) {
    return "instant";
  }
  if (options.userOpenedPanel) {
    return "instant";
  }
  if (prefersReducedMotion()) {
    return "instant";
  }
  return "sequential";
}

function isTruthSettled(status: ConnectionStepStatus): boolean {
  return status === "ok" || status === "fail" || status === "warn";
}

function blocksAdvance(status: ConnectionStepStatus): boolean {
  return status === "fail";
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

type OrchestratorPhase = "enter" | "dwell" | "complete";

export function useStartupChecklistPresentation(
  steps: StartupChecklistStepView[],
  mode: StartupPresentationMode,
): {
  presentedSteps: PresentedStartupStep[];
  focusIndex: number;
  focusStepId: PresentedStartupStep["id"] | null;
  headerProgressPercent: number;
  headerStepLabel: string;
  readyCount: number;
  isSequentialActive: boolean;
} {
  const [focusIndex, setFocusIndex] = useState(0);
  const [orchestratorPhase, setOrchestratorPhase] = useState<OrchestratorPhase>("enter");
  const [forceInstant, setForceInstant] = useState(false);
  const dwellStartedAtRef = useRef<number>(Date.now());
  const stepsLengthRef = useRef(steps.length);

  useEffect(() => {
    if (mode !== "sequential") {
      return;
    }
    const timer = window.setTimeout(() => setForceInstant(true), STARTUP_MAX_ORCHESTRATION_MS);
    return () => window.clearTimeout(timer);
  }, [mode]);

  useEffect(() => {
    if (steps.length !== stepsLengthRef.current) {
      stepsLengthRef.current = steps.length;
      setFocusIndex(0);
      setOrchestratorPhase("enter");
      setForceInstant(false);
      dwellStartedAtRef.current = Date.now();
    }
  }, [steps.length]);

  useEffect(() => {
    if (mode !== "sequential" || steps.length === 0 || forceInstant) {
      return;
    }
    if (focusIndex >= steps.length) {
      return;
    }

    let cancelled = false;
    let timer = 0;
    const truth = steps[focusIndex]?.status ?? "pending";

    if (orchestratorPhase === "enter") {
      timer = window.setTimeout(() => {
        if (!cancelled) {
          setOrchestratorPhase("dwell");
          dwellStartedAtRef.current = Date.now();
        }
      }, STARTUP_STEP_ENTER_MS);
    } else if (orchestratorPhase === "dwell") {
      if (blocksAdvance(truth)) {
        return;
      }
      if (!isTruthSettled(truth)) {
        return;
      }
      const dwellMs = Date.now() - dwellStartedAtRef.current;
      const waitMs = Math.max(0, STARTUP_STEP_MIN_DWELL_MS - dwellMs);
      if (waitMs === 0) {
        setOrchestratorPhase("complete");
        return;
      }
      timer = window.setTimeout(() => {
        if (!cancelled) {
          setOrchestratorPhase("complete");
        }
      }, waitMs);
    } else if (orchestratorPhase === "complete") {
      timer = window.setTimeout(() => {
        if (!cancelled) {
          if (focusIndex + 1 >= steps.length) {
            setFocusIndex(steps.length);
          } else {
            setFocusIndex((i) => i + 1);
            setOrchestratorPhase("enter");
            dwellStartedAtRef.current = Date.now();
          }
        }
      }, STARTUP_STEP_COMPLETE_MS + STARTUP_STEP_GAP_MS);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [focusIndex, forceInstant, mode, orchestratorPhase, steps]);

  const snapToInstant =
    mode === "instant" || forceInstant || steps.length === 0 || focusIndex >= steps.length;

  const presentedSteps = useMemo((): PresentedStartupStep[] => {
    const waiting = ternionFreeAssetPackCopy.results.stepWaiting;
    const checking = ternionFreeAssetPackCopy.results.stepChecking;

    if (snapToInstant) {
      const firstOpen = steps.findIndex((s) => s.status !== "ok");
      return steps.map((step, index) => ({
        ...step,
        presentation: "completed" as const,
        displayStatus: step.status,
        displayResult: step.result,
        isFocus: firstOpen === index,
      }));
    }

    return steps.map((step, index) => {
      if (index < focusIndex) {
        return {
          ...step,
          presentation: "completed" as const,
          displayStatus: step.status,
          displayResult: step.result,
          isFocus: false,
        };
      }
      if (index > focusIndex) {
        return {
          ...step,
          presentation: "hidden" as const,
          displayStatus: "locked",
          displayResult: waiting,
          isFocus: false,
        };
      }

      const displayStatus = displayStatusForCurrent(step.status, orchestratorPhase);
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
  }, [focusIndex, orchestratorPhase, snapToInstant, steps]);

  const truthReadyCount = steps.filter((s) => s.status === "ok").length;

  const presentationReadyCount = snapToInstant
    ? truthReadyCount
    : presentedSteps.filter((s) => s.presentation === "completed" && s.status === "ok").length;

  const focusStep = presentedSteps[Math.min(focusIndex, steps.length - 1)] ?? null;
  const focusMeta = focusStep != null ? startupStepMetaForView(focusStep) : null;

  const headerProgressPercent =
    steps.length > 0
      ? Math.round(
          ((snapToInstant
            ? truthReadyCount
            : focusIndex + (orchestratorPhase === "complete" ? 1 : 0)) /
            steps.length) *
            100,
        )
      : 0;

  const headerStepLabel =
    focusMeta != null && !snapToInstant
      ? setupHeaderStepFocus(focusIndex + 1, steps.length, focusMeta.title)
      : setupHeaderStepSummary(truthReadyCount, steps.length);

  return {
    presentedSteps,
    focusIndex: snapToInstant ? Math.max(0, steps.findIndex((s) => s.status !== "ok")) : focusIndex,
    focusStepId: focusStep?.id ?? null,
    headerProgressPercent,
    headerStepLabel,
    readyCount: presentationReadyCount,
    isSequentialActive: mode === "sequential" && !snapToInstant,
  };
}
