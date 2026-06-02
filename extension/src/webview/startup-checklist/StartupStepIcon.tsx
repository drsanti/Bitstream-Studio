import { useEffect, useRef } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CircleCheck,
  CircleX,
  Loader2,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { gsap } from "gsap";
import type { ConnectionStepStatus } from "../bitstream-app/connection/useConnectionSteps.js";

export type StartupStepIconProps = {
  status: ConnectionStepStatus;
  stepIcon: LucideIcon;
  label: string;
};

function plateClass(status: ConnectionStepStatus): string {
  switch (status) {
    case "ok":
      return "bg-emerald-500/15 ring-1 ring-emerald-500/30";
    case "active":
      return "bg-sky-500/15 ring-1 ring-sky-400/40";
    case "fail":
      return "bg-rose-500/15 ring-1 ring-rose-500/35";
    case "warn":
      return "bg-amber-500/15 ring-1 ring-amber-500/35";
    case "pending":
      return "bg-zinc-800/80 ring-1 ring-zinc-600/50";
    default:
      return "bg-zinc-900/90 ring-1 ring-zinc-700/60 opacity-60";
  }
}

function StatusGlyph(props: { status: ConnectionStepStatus; stepIcon: LucideIcon }) {
  const { status, stepIcon: StepIcon } = props;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (status === "active") {
    if (reducedMotion) {
      return <StepIcon className="h-5 w-5 text-sky-200/90" strokeWidth={2} aria-hidden />;
    }
    return <Loader2 className="h-5 w-5 animate-spin text-sky-200/90" strokeWidth={2.25} aria-hidden />;
  }
  if (status === "ok") {
    return <CircleCheck className="h-5 w-5 text-emerald-300" strokeWidth={2.25} aria-hidden />;
  }
  if (status === "fail") {
    return <CircleX className="h-5 w-5 text-rose-300" strokeWidth={2.25} aria-hidden />;
  }
  if (status === "warn") {
    return <AlertTriangle className="h-5 w-5 text-amber-200" strokeWidth={2.25} aria-hidden />;
  }
  if (status === "locked") {
    return <Lock className="h-4 w-5 text-zinc-500" strokeWidth={2} aria-hidden />;
  }
  if (status === "pending") {
    return <StepIcon className="h-5 w-5 text-zinc-400" strokeWidth={2} aria-hidden />;
  }
  return <AlertCircle className="h-5 w-5 text-zinc-500" strokeWidth={2} aria-hidden />;
}

export function StartupStepIcon(props: StartupStepIconProps) {
  const { status, stepIcon, label } = props;
  const plateRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef(status);

  useEffect(() => {
    const el = plateRef.current;
    if (el == null || prevStatus.current === status) {
      prevStatus.current = status;
      return;
    }
    prevStatus.current = status;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (status === "ok") {
      gsap.fromTo(el, { scale: 0.88 }, { scale: 1, duration: 0.22, ease: "power2.out" });
    }
    if (status === "fail") {
      gsap.fromTo(el, { x: 0 }, { x: -3, duration: 0.06, yoyo: true, repeat: 5, ease: "power1.inOut" });
    }
  }, [status]);

  return (
    <div
      ref={plateRef}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${plateClass(status)}`}
      aria-label={label}
      role="img"
    >
      <StatusGlyph status={status} stepIcon={stepIcon} />
    </div>
  );
}
