import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";

type AccordionType = "single" | "multiple";

type AccordionValue = string | string[] | undefined;

type AccordionContextValue = {
  type: AccordionType;
  collapsible: boolean;
  animated: boolean;
  durationMs: number;
  easing: string;
  animateOpacity: boolean;
  valueSet: Set<string>;
  toggle: (itemValue: string) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

type AccordionItemContextValue = {
  value: string;
  isOpen: boolean;
  disabled: boolean;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function toValueSet(type: AccordionType, value: AccordionValue): Set<string> {
  if (type === "single") {
    if (typeof value === "string" && value.length > 0) {
      return new Set([value]);
    }
    return new Set();
  }
  if (Array.isArray(value)) {
    return new Set(value.filter((v) => typeof v === "string" && v.length > 0));
  }
  return new Set();
}

function setToExternalValue(type: AccordionType, valueSet: Set<string>): AccordionValue {
  if (type === "single") {
    const first = valueSet.values().next().value;
    return typeof first === "string" ? first : undefined;
  }
  return Array.from(valueSet);
}

export type TRNAccordionProps = {
  type?: AccordionType;
  value?: AccordionValue;
  defaultValue?: AccordionValue;
  onValueChange?: (next: AccordionValue) => void;
  collapsible?: boolean;
  animated?: boolean;
  durationMs?: number;
  easing?: string;
  animateOpacity?: boolean;
  className?: string;
  children: ReactNode;
};

export function TRNAccordion(props: TRNAccordionProps) {
  const {
    type = "single",
    value,
    defaultValue,
    onValueChange,
    collapsible = true,
    animated = true,
    durationMs = 220,
    easing = "cubic-bezier(0.22, 1, 0.36, 1)",
    animateOpacity = true,
    className,
    children,
  } = props;
  const isControlled = value != null;
  const [internalValueSet, setInternalValueSet] = useState<Set<string>>(
    toValueSet(type, defaultValue),
  );
  const valueSet = isControlled ? toValueSet(type, value) : internalValueSet;

  const toggle = (itemValue: string) => {
    const next = new Set(valueSet);
    const exists = next.has(itemValue);
    if (type === "single") {
      if (exists) {
        if (collapsible) {
          next.clear();
        }
      } else {
        next.clear();
        next.add(itemValue);
      }
    } else {
      if (exists) {
        if (collapsible || next.size > 1) {
          next.delete(itemValue);
        }
      } else {
        next.add(itemValue);
      }
    }
    if (!isControlled) {
      setInternalValueSet(next);
    }
    onValueChange?.(setToExternalValue(type, next));
  };

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      type,
      collapsible,
      animated,
      durationMs,
      easing,
      animateOpacity,
      valueSet,
      toggle,
    }),
    [
      type,
      collapsible,
      animated,
      durationMs,
      easing,
      animateOpacity,
      valueSet,
    ],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={"border border-zinc-700/80 rounded-md bg-zinc-950/90 " + (className ?? "")}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export type TRNAccordionItemProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function TRNAccordionItem(props: TRNAccordionItemProps) {
  const { value, disabled = false, className, children } = props;
  const accordion = useContext(AccordionContext);
  if (accordion == null) {
    throw new Error("TRNAccordionItem must be used inside TRNAccordion.");
  }
  const isOpen = accordion.valueSet.has(value);
  return (
    <AccordionItemContext.Provider value={{ value, isOpen, disabled }}>
      <div className={"border-b last:border-b-0 border-zinc-700/80 " + (className ?? "")}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export type TRNAccordionTriggerProps = {
  className?: string;
  children: ReactNode;
  /** Placed between the title and the expand chevron (use real `<button>` with stopPropagation as needed). */
  trailingBeforeChevron?: ReactNode;
};

export function TRNAccordionTrigger(props: TRNAccordionTriggerProps) {
  const { className, children, trailingBeforeChevron } = props;
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  if (accordion == null || item == null) {
    throw new Error("TRNAccordionTrigger must be used inside TRNAccordionItem.");
  }
  const toggle = () => {
    accordion.toggle(item.value);
  };
  return (
    <div
      className={twMerge(
        "flex w-full items-center gap-1 px-3 py-2 text-left text-sm font-semibold",
        item.disabled ? "cursor-not-allowed opacity-50" : "",
        className,
      )}
    >
      <button
        type="button"
        className={
          "min-w-0 flex-1 bg-transparent text-left inline-flex items-center gap-2 rounded-md py-0 pl-0 pr-0.5 " +
          "disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400/45 "
        }
        disabled={item.disabled}
        aria-expanded={item.isOpen}
        onClick={toggle}
      >
        <span className="truncate">{children}</span>
      </button>
      {trailingBeforeChevron != null ? (
        <span className="inline-flex shrink-0 items-center">{trailingBeforeChevron}</span>
      ) : null}
      <button
        type="button"
        className={
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-transparent " +
          "disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400/45 "
        }
        disabled={item.disabled}
        aria-expanded={item.isOpen}
        aria-label={item.isOpen ? "Collapse section" : "Expand section"}
        onClick={toggle}
      >
        <ChevronDown
          className="h-4 w-4 transition-transform duration-200 ease-out"
          style={{ transform: item.isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
    </div>
  );
}

export type TRNAccordionContentProps = {
  className?: string;
  /** Merged onto the inner measurement wrapper (default padding + muted typography). */
  innerClassName?: string;
  children: ReactNode;
};

export function TRNAccordionContent(props: TRNAccordionContentProps) {
  const { className, innerClassName, children } = props;
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  if (accordion == null || item == null) {
    throw new Error("TRNAccordionContent must be used inside TRNAccordionItem.");
  }

  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current == null) {
      return;
    }
    const element = contentRef.current;
    const update = () => setMeasuredHeight(element.scrollHeight);
    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(element);
    return () => observer.disconnect();
  }, [children, item.isOpen]);

  const style: CSSProperties = accordion.animated
    ? {
        maxHeight: item.isOpen ? measuredHeight : 0,
        opacity: accordion.animateOpacity ? (item.isOpen ? 1 : 0) : 1,
        transitionProperty: "max-height, opacity",
        transitionDuration: `${accordion.durationMs}ms`,
        transitionTimingFunction: accordion.easing,
      }
    : {};

  if (!accordion.animated && !item.isOpen) {
    return null;
  }

  return (
    <div
      className={"overflow-hidden " + (className ?? "")}
      style={style}
      aria-hidden={!item.isOpen}
    >
      <div
        ref={contentRef}
        className={twMerge("px-3 pb-2 text-xs text-zinc-400", innerClassName)}
      >
        {children}
      </div>
    </div>
  );
}
