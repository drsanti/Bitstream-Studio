import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { AnimationLabTwinCardIconId, AnimationLabTwinTagIconAnimation } from "../animation-lab-twin-tag-icons.js";
import {
  resolveTwinTagPresetDef,
  type AnimationLabTwinTagPresetId,
  type AnimationLabTwinTagPresetLayout,
} from "../animation-lab-twin-tag-presets.js";
import { AnimationLabTwinTagIcon } from "./AnimationLabTwinTagIcon.js";
import { useAnimationLabTwinLocaleStore } from "../animation-lab-twin-locale.store.js";
import { twinHealthLabelLocalized } from "../animation-lab-twin-i18n.js";
import { twinTagHealthLedClass, twinTagHealthStatusClass } from "../animation-lab-twin-health.js";
import {
  resolveTwinTagCardAppearance,
  type AnimationLabTwinTagStyleResolved,
} from "../animation-lab-twin-tag-style.types.js";
import type { AnimationLabTwinHealth } from "../digital-twin.types.js";
import { twinTagPresetSupportsScanlines } from "../animation-lab-twin-graphics.js";
import { restoreAnimationLabTwinTagElement } from "./animation-lab-css3d-tag-dom.js";
import { useAnimationLabCss3dTagRegistryStore } from "./animation-lab-css3d-tag-registry.store.js";
import "./animation-lab-twin-css3d-tag.css";

function TwinTagHealthStatus(props: {
  health: AnimationLabTwinHealth;
  statusFontPx: number;
  compact?: boolean;
}) {
  const locale = useAnimationLabTwinLocaleStore((s) => s.locale);
  const statusClass = twinTagHealthStatusClass(props.health);
  const ledClass = twinTagHealthLedClass(props.health);
  return (
    <span className={twMerge("inline-flex shrink-0 items-center gap-1", statusClass)}>
      <span
        className={twMerge(
          "shrink-0 rounded-full",
          props.compact ? "h-1 w-1" : "h-1.5 w-1.5",
          ledClass,
        )}
        aria-hidden
      />
      <span
        className={twMerge(
          "font-bold uppercase leading-none",
          props.compact ? "font-sans tracking-wide" : "font-mono tracking-[0.18em]",
        )}
        style={{ fontSize: Math.max(7, props.statusFontPx - 1) }}
      >
        {twinHealthLabelLocalized(props.health, locale)}
      </span>
    </span>
  );
}

function TwinTagHeaderRow(props: {
  title: string;
  titleFontPx: number;
  titleClassName?: string;
  health: AnimationLabTwinHealth;
  style: AnimationLabTwinTagStyleResolved;
  presetId: AnimationLabTwinTagPresetId;
  compactHealth?: boolean;
  leadingIcon?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {props.leadingIcon}
      <span
        className={twMerge("min-w-0 flex-1 truncate", props.titleClassName)}
        style={{ fontSize: props.titleFontPx }}
      >
        {props.title}
      </span>
      {props.style.showHealthPill ? (
        <TwinTagHealthStatus
          health={props.health}
          statusFontPx={props.style.statusFontPx}
          compact={props.compactHealth}
        />
      ) : null}
    </div>
  );
}

function TwinTagCardBody(props: {
  layout: AnimationLabTwinTagPresetLayout;
  presetId: AnimationLabTwinTagPresetId;
  health: AnimationLabTwinHealth;
  style: AnimationLabTwinTagStyleResolved;
  topSignalLabel?: string;
  topSignalValue?: string;
  mutedColor?: string;
  leadingIcon?: ReactNode;
}) {
  const { layout, health, style, topSignalLabel, topSignalValue, mutedColor } = props;
  const hasSignal =
    style.showTopSignal && topSignalLabel != null && topSignalValue != null;

  if (layout === "wireframe") {
    return (
      <div className="animation-lab-twin-css3d-tag__body relative flex flex-col gap-1 px-2.5 py-2">
        <TwinTagHeaderRow
          title={style.title}
          titleFontPx={style.titleFontPx}
          titleClassName="font-mono font-semibold uppercase tracking-[0.2em] opacity-95"
          health={health}
          style={style}
          presetId={props.presetId}
          compactHealth
          leadingIcon={props.leadingIcon}
        />
        {hasSignal ? (
          <div
            className="truncate font-mono font-medium leading-tight"
            style={{ fontSize: style.signalFontPx }}
          >
            <span className="opacity-60">{topSignalLabel} </span>
            <span className="font-semibold">{topSignalValue}</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div className="animation-lab-twin-css3d-tag__body relative flex flex-col gap-0.5 py-1 pl-1.5 pr-2">
        <TwinTagHeaderRow
          title={style.title}
          titleFontPx={style.titleFontPx}
          titleClassName="font-semibold uppercase tracking-wide text-zinc-200"
          health={health}
          style={style}
          presetId={props.presetId}
          compactHealth
          leadingIcon={props.leadingIcon}
        />
        {hasSignal ? (
          <div
            className="truncate font-mono font-semibold leading-tight text-zinc-50"
            style={{ fontSize: style.signalFontPx }}
          >
            <span className="text-zinc-500" style={{ color: mutedColor ?? undefined }}>
              {topSignalLabel}:{" "}
            </span>
            {topSignalValue}
          </div>
        ) : null}
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div className="animation-lab-twin-css3d-tag__body relative flex flex-col gap-1 px-2.5 py-2 pl-2">
        <TwinTagHeaderRow
          title={style.title}
          titleFontPx={style.titleFontPx}
          titleClassName="font-medium leading-tight text-zinc-100"
          health={health}
          style={style}
          presetId={props.presetId}
          compactHealth
          leadingIcon={props.leadingIcon}
        />
        {hasSignal ? (
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <span
              className="truncate text-zinc-500"
              style={{
                fontSize: Math.max(7, style.signalFontPx - 1),
                color: mutedColor ?? undefined,
              }}
            >
              {topSignalLabel}
            </span>
            <span
              className="shrink-0 font-mono font-medium text-zinc-100"
              style={{ fontSize: style.signalFontPx }}
            >
              {topSignalValue}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="animation-lab-twin-css3d-tag__body relative flex flex-col pl-1">
      <div className="border-b border-white/6 px-2 py-1.5">
        <TwinTagHeaderRow
          title={style.title}
          titleFontPx={style.titleFontPx}
          titleClassName="font-semibold uppercase leading-tight tracking-[0.14em] text-zinc-100"
          health={health}
          style={style}
          presetId={props.presetId}
          leadingIcon={props.leadingIcon}
        />
      </div>
      {hasSignal ? (
        <div className="px-2 py-1.5">
          <div
            className="truncate uppercase tracking-[0.16em] text-zinc-500"
            style={{
              fontSize: Math.max(7, style.signalFontPx - 1),
              color: mutedColor ?? undefined,
            }}
          >
            {topSignalLabel}
          </div>
          <div
            className="mt-0.5 truncate font-mono font-medium leading-tight tracking-tight text-zinc-50"
            style={{ fontSize: style.signalFontPx + 1 }}
          >
            {topSignalValue}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AnimationLabTwinCss3dTag(props: {
  componentId: string;
  active: boolean;
  health: AnimationLabTwinHealth;
  selected: boolean;
  style: AnimationLabTwinTagStyleResolved;
  iconId: AnimationLabTwinCardIconId;
  iconAnimation: AnimationLabTwinTagIconAnimation;
  iconSpinDurationS?: number;
  topSignalLabel?: string;
  topSignalValue?: string;
  onSelect: () => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const preset = useMemo(
    () => resolveTwinTagPresetDef({ presetId: props.style.presetId }),
    [props.style.presetId],
  );

  const appearance = useMemo(
    () => resolveTwinTagCardAppearance(props.health, props.style, props.selected),
    [props.health, props.selected, props.style],
  );

  useEffect(() => {
    const element = cardRef.current;
    const anchor = anchorRef.current;
    if (element == null || anchor == null) {
      return;
    }

    if (!props.active) {
      return;
    }

    const store = useAnimationLabCss3dTagRegistryStore.getState();
    store.registerTag({
      id: props.componentId,
      element,
      anchor,
    });

    return () => {
      restoreAnimationLabTwinTagElement(anchor, element);
      useAnimationLabCss3dTagRegistryStore.getState().unregisterTag(props.componentId);
    };
  }, [props.active, props.componentId]);

  useEffect(() => {
    if (props.active) {
      return;
    }
    const element = cardRef.current;
    const anchor = anchorRef.current;
    if (element == null || anchor == null) {
      return;
    }
    restoreAnimationLabTwinTagElement(anchor, element);
    useAnimationLabCss3dTagRegistryStore.getState().unregisterTag(props.componentId);
  }, [props.active, props.componentId]);

  const mutedColor = props.style.useCustomColors ? props.style.mutedTextColor : undefined;

  const iconPlacement = preset.iconPlacement;
  const cardIcon =
    props.style.showCardIcon ? (
      <AnimationLabTwinTagIcon
        iconId={props.iconId}
        health={props.health}
        animation={props.active ? props.iconAnimation : "none"}
        presetId={props.style.presetId}
        glyphStyle={props.style.iconGlyphStyle}
        placement={iconPlacement}
        compact={preset.layout === "compact"}
        spinDurationS={props.iconSpinDurationS}
      />
    ) : null;
  const leadingIcon = iconPlacement === "leading" ? cardIcon : null;
  const cornerIcon = iconPlacement === "corner" ? cardIcon : null;

  const showScanlines =
    props.style.showScanlines && twinTagPresetSupportsScanlines(preset.id);

  const hires = props.style.css3dHiresScale;
  const layoutWidthPx = props.style.widthPx;
  const layoutMinHeightPx =
    props.style.minHeightPx > 0 ? props.style.minHeightPx : undefined;

  return (
    <>
      <div ref={anchorRef} className="hidden" aria-hidden />
      <div
        ref={cardRef}
        className="animation-lab-twin-css3d-tag__css3d-root"
        style={{
          width: layoutWidthPx * hires,
          minWidth: layoutWidthPx * hires,
          maxWidth: layoutWidthPx * hires,
          minHeight:
            layoutMinHeightPx != null ? layoutMinHeightPx * hires : undefined,
          visibility: props.active ? "visible" : "hidden",
          pointerEvents: props.active ? "auto" : "none",
        }}
      >
        <div
          role="button"
          tabIndex={props.active ? 0 : -1}
          aria-hidden={!props.active}
          className="animation-lab-twin-css3d-tag__hires outline-none"
          style={{
            width: layoutWidthPx,
            minWidth: layoutWidthPx,
            maxWidth: layoutWidthPx,
            minHeight: layoutMinHeightPx,
            transform: `scale(${hires})`,
            transformOrigin: "top left",
          }}
          onClick={(e) => {
            if (!props.active) {
              return;
            }
            e.stopPropagation();
            props.onSelect();
          }}
          onKeyDown={(e) => {
            if (!props.active) {
              return;
            }
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              props.onSelect();
            }
          }}
        >
          <div className={appearance.className} style={appearance.style}>
            {showScanlines ? (
              <div className="animation-lab-twin-css3d-tag__scanlines" aria-hidden />
            ) : null}
            {cornerIcon}
            <TwinTagCardBody
              layout={preset.layout}
              presetId={preset.id}
              health={props.health}
              style={props.style}
              topSignalLabel={props.topSignalLabel}
              topSignalValue={props.topSignalValue}
              mutedColor={mutedColor}
              leadingIcon={leadingIcon}
            />
          </div>
        </div>
      </div>
    </>
  );
}
