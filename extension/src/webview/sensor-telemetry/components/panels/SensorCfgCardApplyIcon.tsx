/*******************************************************************************
 * File Name : SensorCfgCardApplyIcon.tsx
 *
 * Description : Icon-only apply control for config card headers (no bg/border).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { twMerge } from "tailwind-merge";
import "./SensorCfgCardApplyIcon.css";

const EXIT_MS = 240;

export function SensorCfgCardApplyIcon(props: {
  dirty: boolean;
  disabled?: boolean;
  title?: string;
  onApply: () => void;
})
{
  const { dirty, disabled = false, title = "Apply changes in this section", onApply } = props;
  const [visible, setVisible] = useState(dirty);
  const [exiting, setExiting] = useState(false);
  const wasDirtyRef = useRef(dirty);

  useEffect(() => {
    if (dirty)
    {
      wasDirtyRef.current = true;
      setExiting(false);
      setVisible(true);
      return;
    }
    if (!wasDirtyRef.current)
    {
      setVisible(false);
      return;
    }
    setExiting(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
      wasDirtyRef.current = false;
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [dirty]);

  if (!visible)
  {
    return null;
  }

  return (
    <button
      type="button"
      className={twMerge(
        "inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 shadow-none",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
        exiting ? "sensor-cfg-card-apply-icon--exit" : "sensor-cfg-card-apply-icon",
      )}
      disabled={disabled || exiting}
      title={title}
      aria-label={title}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled || exiting)
        {
          return;
        }
        onApply();
      }}
    >
      <Upload className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden />
    </button>
  );
}
