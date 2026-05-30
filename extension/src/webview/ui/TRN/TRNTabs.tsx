import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";

type TRNTabsOrientation = "horizontal" | "vertical";
type TRNTabsActivePreset = "default" | "soft";
type TRNTabsVariant = "default" | "rail";
type TRNTabsRailSide = "left" | "right";

type TabsContextValue = {
  value: string;
  setValue: (next: string) => void;
  orientation: TRNTabsOrientation;
  lazyMount: boolean;
  activePreset: TRNTabsActivePreset;
  activeTriggerClassName?: string;
  variant: TRNTabsVariant;
  railSide: TRNTabsRailSide;
  triggerRefs: Map<string, HTMLButtonElement | null>;
  registerTrigger: (value: string, el: HTMLButtonElement | null) => void;
  orderedValuesRef: React.MutableRefObject<string[]>;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export type TRNTabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  orientation?: TRNTabsOrientation;
  variant?: TRNTabsVariant;
  railSide?: TRNTabsRailSide;
  lazyMount?: boolean;
  className?: string;
  listClassName?: string;
  activePreset?: TRNTabsActivePreset;
  activeTriggerClassName?: string;
  children: ReactNode;
};

export function TRNTabs(props: TRNTabsProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    orientation,
    variant = "default",
    railSide = "right",
    lazyMount = false,
    className,
    children,
    activePreset = "default",
    activeTriggerClassName,
  } = props;
  const isControlled = value != null;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const triggerRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const orderedValuesRef = useRef<string[]>([]);

  const currentValue = isControlled ? (value ?? "") : internalValue;
  const resolvedOrientation: TRNTabsOrientation =
    orientation ?? (variant === "rail" ? "vertical" : "horizontal");

  const setValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  const registerTrigger = (tabValue: string, el: HTMLButtonElement | null) => {
    triggerRefs.current.set(tabValue, el);
    if (!orderedValuesRef.current.includes(tabValue)) {
      orderedValuesRef.current.push(tabValue);
    }
  };

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      value: currentValue,
      setValue,
      orientation: resolvedOrientation,
      lazyMount,
      activePreset,
      activeTriggerClassName,
      variant,
      railSide,
      triggerRefs: triggerRefs.current,
      registerTrigger,
      orderedValuesRef,
    }),
    [
      activePreset,
      activeTriggerClassName,
      currentValue,
      lazyMount,
      railSide,
      resolvedOrientation,
      variant,
    ],
  );

  const rootClassName =
    className != null && /\bflex\b/.test(className)
      ? "min-h-0 " + className
      : "space-y-2 " + (className ?? "");

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={rootClassName}>{children}</div>
    </TabsContext.Provider>
  );
}

export type TRNTabsListProps = {
  className?: string;
  children: ReactNode;
};

export function TRNTabsList(props: TRNTabsListProps) {
  const tabs = useContext(TabsContext);
  if (tabs == null) {
    throw new Error("TRNTabsList must be used inside TRNTabs.");
  }

  const isRail = tabs.variant === "rail";
  const isVertical = isRail ? true : tabs.orientation === "vertical";

  return (
    <div
      className={
        (isRail
          ? "inline-flex flex-col gap-2 p-0 bg-transparent border-0 max-h-full overflow-y-auto overscroll-contain"
          : "border border-zinc-700/80 rounded-md p-1 bg-black/40 ") +
        (isVertical ? " inline-flex flex-col" : " inline-flex") +
        (props.className != null ? ` ${props.className}` : "")
      }
      role="tablist"
      aria-orientation={isVertical ? "vertical" : "horizontal"}
    >
      {props.children}
    </div>
  );
}

export type TRNTabsTriggerProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function TRNTabsTrigger(props: TRNTabsTriggerProps) {
  const tabs = useContext(TabsContext);
  if (tabs == null) {
    throw new Error("TRNTabsTrigger must be used inside TRNTabs.");
  }
  const isActive = tabs.value === props.value;
  const isRail = tabs.variant === "rail";
  const resolvedActiveClassName =
    tabs.activeTriggerClassName ??
    (tabs.activePreset === "soft"
      ? "border-cyan-500/45 text-cyan-200 bg-cyan-500/18 shadow-sm"
      : "border-cyan-500/45 text-cyan-200 bg-cyan-500/18");

  const moveFocusToIndex = (index: number) => {
    const values = tabs.orderedValuesRef.current;
    if (values.length === 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(index, values.length - 1));
    const nextValue = values[clamped];
    const nextEl = tabs.triggerRefs.get(nextValue);
    if (nextEl != null) {
      nextEl.focus();
      tabs.setValue(nextValue);
    }
  };

  return (
    <button
      ref={(el) => tabs.registerTrigger(props.value, el)}
      type="button"
      role="tab"
      id={`trn-tab-${props.value}`}
      aria-selected={isActive}
      aria-controls={`trn-panel-${props.value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={props.disabled}
      className={
        (isRail
          ? "w-10 h-28 px-2 py-3 text-xs border border-zinc-700/80 transition-colors bg-zinc-950/35 backdrop-blur " +
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 " +
            (tabs.railSide === "right"
              ? "rounded-l-xl rounded-r-2xl"
              : "rounded-r-xl rounded-l-2xl") +
            " disabled:opacity-50 disabled:cursor-not-allowed " +
            (isActive
              ? "border-sky-400/55 text-sky-50 bg-sky-600/55 shadow-sm shadow-sky-500/20"
              : "text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800/55")
          : "px-2.5 py-1.5 text-xs rounded border border-zinc-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
            (isActive
              ? resolvedActiveClassName
              : "text-zinc-300 bg-zinc-900/45 hover:text-zinc-100 hover:bg-zinc-800/70")) +
        (props.className != null ? ` ${props.className}` : "")
      }
      onClick={() => tabs.setValue(props.value)}
      onKeyDown={(evt) => {
        const values = tabs.orderedValuesRef.current;
        const currentIndex = values.indexOf(props.value);
        if (currentIndex < 0) {
          return;
        }
        const isHorizontal = tabs.orientation === "horizontal";
        if (evt.key === "Home") {
          evt.preventDefault();
          moveFocusToIndex(0);
          return;
        }
        if (evt.key === "End") {
          evt.preventDefault();
          moveFocusToIndex(values.length - 1);
          return;
        }
        if (
          (isHorizontal && evt.key === "ArrowRight") ||
          (!isHorizontal && evt.key === "ArrowDown")
        ) {
          evt.preventDefault();
          moveFocusToIndex((currentIndex + 1) % values.length);
          return;
        }
        if (
          (isHorizontal && evt.key === "ArrowLeft") ||
          (!isHorizontal && evt.key === "ArrowUp")
        ) {
          evt.preventDefault();
          moveFocusToIndex((currentIndex - 1 + values.length) % values.length);
          return;
        }
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          tabs.setValue(props.value);
        }
      }}
    >
      {isRail ? (
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            letterSpacing: "0.06em",
          }}
          className="select-none"
        >
          {props.children}
        </span>
      ) : (
        props.children
      )}
    </button>
  );
}

export type TRNTabsContentProps = {
  value: string;
  className?: string;
  animated?: boolean;
  durationMs?: number;
  easing?: string;
  animateOpacity?: boolean;
  keepMounted?: boolean;
  children: ReactNode;
};

export function TRNTabsContent(props: TRNTabsContentProps) {
  const tabs = useContext(TabsContext);
  if (tabs == null) {
    throw new Error("TRNTabsContent must be used inside TRNTabs.");
  }
  const {
    value,
    className,
    animated = true,
    durationMs = 180,
    easing = "cubic-bezier(0.22, 1, 0.36, 1)",
    animateOpacity = true,
    keepMounted,
    children,
  } = props;
  const isActive = tabs.value === value;
  const shouldKeepMounted = keepMounted ?? !tabs.lazyMount;
  const [mounted, setMounted] = useState(isActive || shouldKeepMounted);

  useEffect(() => {
    if (isActive) {
      setMounted(true);
    }
  }, [isActive]);

  if (!mounted && !isActive) {
    return null;
  }
  if (!isActive && !shouldKeepMounted) {
    return null;
  }

  const style: CSSProperties | undefined =
    animated && shouldKeepMounted
      ? {
          opacity: animateOpacity ? (isActive ? 1 : 0) : 1,
          transform: isActive ? "translateY(0px)" : "translateY(4px)",
          transitionProperty: "opacity, transform",
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: easing,
          pointerEvents: isActive ? "auto" : "none",
        }
      : undefined;

  const consumerSetsDisplay =
    className != null && /\b(flex|grid|contents)\b/.test(className);
  const visibilityClass =
    !isActive && !shouldKeepMounted
      ? "hidden "
      : consumerSetsDisplay
        ? ""
        : isActive || shouldKeepMounted
          ? "block "
          : "hidden ";

  return (
    <div
      role="tabpanel"
      id={`trn-panel-${value}`}
      aria-labelledby={`trn-tab-${value}`}
      hidden={!isActive && !shouldKeepMounted}
      className={visibilityClass + (className ?? "")}
      style={style}
    >
      {children}
    </div>
  );
}
