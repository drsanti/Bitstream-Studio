import { Palette } from "lucide-react";
import type {
  WidgetBoardEntryV1,
  WidgetBoardLedIndicatorV1,
  WidgetBoardMetricBarV1,
  WidgetBoardNumericReadoutV1,
  WidgetBoardStatusPillV1,
  WidgetBoardVerticalBarV1,
} from "../../schemas/widgetBoard.v1";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import { CourseBlockColorRow } from "../inspector/CourseBlockColorRow";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";
import { WIDGET_BOARD_VERTICAL_BAR_DEFAULTS } from "../../ui/catalog/widget-board/widgetBoardWidgetDefaults";
import { WIDGET_BOARD_STATUS_TONE_OPTIONS } from "../../ui/catalog/widget-board/widgetBoardStatusTone";

function ScalarReadoutToggles({
  widget,
  onPatch,
}: {
  widget: WidgetBoardMetricBarV1 | WidgetBoardNumericReadoutV1 | WidgetBoardVerticalBarV1;
  onPatch: (patch: Partial<WidgetBoardEntryV1>) => void;
}) {
  return (
    <>
      <TRNInlineToggleRow
        label="Show label"
        checked={widget.showLabel}
        onCheckedChange={(showLabel) => onPatch({ showLabel })}
        ariaLabel="Show widget label"
      />
      <TRNInlineToggleRow
        label="Show value"
        checked={widget.showValue}
        onCheckedChange={(showValue) => onPatch({ showValue })}
        ariaLabel="Show widget value"
      />
      <TRNInlineToggleRow
        label="Show unit"
        checked={widget.showUnit}
        onCheckedChange={(showUnit) => onPatch({ showUnit })}
        ariaLabel="Show widget unit"
      />
    </>
  );
}

function StatusPillToneFields({
  widget,
  onPatch,
}: {
  widget: WidgetBoardStatusPillV1;
  onPatch: (patch: Partial<WidgetBoardStatusPillV1>) => void;
}) {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">ON state</p>
      <div className="flex flex-col gap-2">
          <TRNFormField id={`${widget.id}-on-label`} label="Label">
            <TRNInput
              id={`${widget.id}-on-label`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={widget.onLabel}
              onChange={(e) => onPatch({ onLabel: e.target.value })}
            />
          </TRNFormField>
          <TRNFormField id={`${widget.id}-on-tone`} label="Tone">
            <TRNSelect
              value={widget.onTone}
              ariaLabel="ON state tone"
              variant="field"
              size="sm"
              options={WIDGET_BOARD_STATUS_TONE_OPTIONS}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  onPatch({ onTone: value as WidgetBoardStatusPillV1["onTone"] });
                }
              }}
            />
          </TRNFormField>
          {widget.onTone === "custom" ? (
            <>
              <CourseBlockColorRow
                label="Background"
                value={widget.onBackgroundColor}
                onChange={(onBackgroundColor) => onPatch({ onBackgroundColor })}
              />
              <CourseBlockColorRow
                label="Text"
                value={widget.onTextColor}
                onChange={(onTextColor) => onPatch({ onTextColor })}
              />
              <CourseBlockColorRow
                label="Border"
                value={widget.onBorderColor}
                onChange={(onBorderColor) => onPatch({ onBorderColor })}
              />
            </>
          ) : null}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">OFF state</p>
      <div className="flex flex-col gap-2">
          <TRNFormField id={`${widget.id}-off-label`} label="Label">
            <TRNInput
              id={`${widget.id}-off-label`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={widget.offLabel}
              onChange={(e) => onPatch({ offLabel: e.target.value })}
            />
          </TRNFormField>
          <TRNFormField id={`${widget.id}-off-tone`} label="Tone">
            <TRNSelect
              value={widget.offTone}
              ariaLabel="OFF state tone"
              variant="field"
              size="sm"
              options={WIDGET_BOARD_STATUS_TONE_OPTIONS}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  onPatch({ offTone: value as WidgetBoardStatusPillV1["offTone"] });
                }
              }}
            />
          </TRNFormField>
          {widget.offTone === "custom" ? (
            <>
              <CourseBlockColorRow
                label="Background"
                value={widget.offBackgroundColor}
                onChange={(offBackgroundColor) => onPatch({ offBackgroundColor })}
              />
              <CourseBlockColorRow
                label="Text"
                value={widget.offTextColor}
                onChange={(offTextColor) => onPatch({ offTextColor })}
              />
              <CourseBlockColorRow
                label="Border"
                value={widget.offBorderColor}
                onChange={(offBorderColor) => onPatch({ offBorderColor })}
              />
            </>
          ) : null}
      </div>
      <TRNFormField id={`${widget.id}-pill-style`} label="Pill style">
        <TRNSelect
          value={widget.pillStyle}
          ariaLabel="Status pill style"
          variant="field"
          size="sm"
          options={[
            { value: "filled", label: "Filled" },
            { value: "outline", label: "Outline" },
          ]}
          onValueChange={(value) => {
            if (value === "filled" || value === "outline") {
              onPatch({ pillStyle: value });
            }
          }}
        />
      </TRNFormField>
      <TRNInlineToggleRow
        label="Show label"
        checked={widget.showLabel}
        onCheckedChange={(showLabel) => onPatch({ showLabel })}
        ariaLabel="Show status pill section label"
      />
    </>
  );
}

function LedAppearanceFields({
  widget,
  onPatch,
}: {
  widget: WidgetBoardLedIndicatorV1;
  onPatch: (patch: Partial<WidgetBoardLedIndicatorV1>) => void;
}) {
  return (
    <>
      <CourseBlockColorRow
        label="ON color"
        value={widget.onColor}
        defaultHex="#22c55e"
        onChange={(onColor) => onPatch({ onColor })}
      />
      <CourseBlockColorRow
        label="OFF color"
        value={widget.offColor}
        defaultHex="#27272a"
        onChange={(offColor) => onPatch({ offColor })}
      />
      <TRNFormField id={`${widget.id}-led-size`} label="LED size">
        <TRNSelect
          value={widget.ledSize}
          ariaLabel="LED indicator size"
          variant="field"
          size="sm"
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ]}
          onValueChange={(value) => {
            if (value === "sm" || value === "md" || value === "lg") {
              onPatch({ ledSize: value });
            }
          }}
        />
      </TRNFormField>
      <TRNInlineToggleRow
        label="Glow when ON"
        checked={widget.glowWhenOn}
        onCheckedChange={(glowWhenOn) => onPatch({ glowWhenOn })}
        ariaLabel="Glow when LED is on"
      />
      <TRNInlineToggleRow
        label="Blink when ON"
        checked={widget.blink}
        onCheckedChange={(blink) => onPatch({ blink })}
        ariaLabel="Blink LED when on"
      />
      {widget.blink ? (
        <TRNFormField id={`${widget.id}-blink-period`} label="Blink period (ms)">
          <CourseMaintainerScrubNumberField
            ariaLabel="LED blink period milliseconds"
            value={widget.blinkPeriodMs}
            min={200}
            max={3000}
            step={50}
            fractionDigits={0}
            defaultValue={800}
            onChange={(blinkPeriodMs) =>
              onPatch({
                blinkPeriodMs: Math.max(200, Math.min(3000, Math.round(blinkPeriodMs))),
              })
            }
          />
        </TRNFormField>
      ) : null}
      <TRNInlineToggleRow
        label="Show label"
        checked={widget.showLabel}
        onCheckedChange={(showLabel) => onPatch({ showLabel })}
        ariaLabel="Show LED section label"
      />
    </>
  );
}

export function CourseWidgetBoardAppearanceInspectorFields({
  widget,
  onPatch,
}: {
  widget: WidgetBoardEntryV1;
  onPatch: (patch: Partial<WidgetBoardEntryV1>) => void;
}) {
  if (widget.kind === "hero-radial-gauge") {
    return null;
  }

  const title =
    widget.kind === "status-pill" || widget.kind === "led-indicator"
      ? "Appearance"
      : "Readout & colors";

  return (
    <CourseInspectorCard
      title={title}
      hint="Visibility toggles, colors, and widget-specific chrome."
      titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      <div className="flex flex-col gap-2">
        {widget.kind === "metric-bar" ? (
          <>
            <ScalarReadoutToggles widget={widget} onPatch={onPatch} />
            <CourseBlockColorRow
              label="Track color"
              value={widget.trackColor}
              onChange={(trackColor) => onPatch({ trackColor })}
            />
            <CourseBlockColorRow
              label="Fill color"
              value={widget.fillColor}
              onChange={(fillColor) => onPatch({ fillColor })}
            />
          </>
        ) : null}

        {widget.kind === "numeric-readout" ? (
          <>
            <ScalarReadoutToggles widget={widget} onPatch={onPatch} />
            <TRNFormField id={`${widget.id}-value-align`} label="Value align">
              <TRNSelect
                value={widget.valueAlign}
                ariaLabel="Numeric readout value alignment"
                variant="field"
                size="sm"
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Center" },
                  { value: "right", label: "Right" },
                ]}
                onValueChange={(value) => {
                  if (value === "left" || value === "center" || value === "right") {
                    onPatch({ valueAlign: value });
                  }
                }}
              />
            </TRNFormField>
            <TRNFormField id={`${widget.id}-value-scale`} label="Value scale">
              <TRNSelect
                value={widget.valueScale}
                ariaLabel="Numeric readout value scale"
                variant="field"
                size="sm"
                options={[
                  { value: "standard", label: "Standard" },
                  { value: "large", label: "Large" },
                  { value: "hero", label: "Hero" },
                ]}
                onValueChange={(value) => {
                  if (value === "standard" || value === "large" || value === "hero") {
                    onPatch({ valueScale: value });
                  }
                }}
              />
            </TRNFormField>
          </>
        ) : null}

        {widget.kind === "vertical-bar" ? (
          <>
            <ScalarReadoutToggles widget={widget} onPatch={onPatch} />
            <TRNFormField id={`${widget.id}-fill-from`} label="Fill from">
              <TRNSelect
                value={widget.fillFrom}
                ariaLabel="Vertical bar fill origin"
                variant="field"
                size="sm"
                options={[
                  { value: "bottom", label: "Bottom" },
                  { value: "top", label: "Top" },
                ]}
                onValueChange={(value) => {
                  if (value === "bottom" || value === "top") {
                    onPatch({ fillFrom: value });
                  }
                }}
              />
            </TRNFormField>
            <TRNFormField id={`${widget.id}-track-width`} label="Track width (%)">
              <CourseMaintainerScrubNumberField
                ariaLabel="Vertical bar track width percent"
                value={widget.trackWidthPercent}
                min={8}
                max={40}
                step={1}
                fractionDigits={0}
                defaultValue={WIDGET_BOARD_VERTICAL_BAR_DEFAULTS.trackWidthPercent}
                onChange={(trackWidthPercent) =>
                  onPatch({
                    trackWidthPercent: Math.max(8, Math.min(40, Math.round(trackWidthPercent))),
                  })
                }
              />
            </TRNFormField>
            <TRNFormField id={`${widget.id}-fill-smoothing`} label="Fill smoothing (ms)">
              <CourseMaintainerScrubNumberField
                ariaLabel="Vertical bar fill smoothing milliseconds"
                value={widget.fillSmoothingMs}
                min={0}
                max={5000}
                step={50}
                fractionDigits={0}
                defaultValue={WIDGET_BOARD_VERTICAL_BAR_DEFAULTS.fillSmoothingMs}
                onChange={(fillSmoothingMs) =>
                  onPatch({
                    fillSmoothingMs: Math.max(0, Math.min(5000, Math.round(fillSmoothingMs))),
                  })
                }
              />
            </TRNFormField>
            <CourseBlockColorRow
              label="Track color"
              value={widget.trackColor}
              onChange={(trackColor) => onPatch({ trackColor })}
            />
            <CourseBlockColorRow
              label="Fill color"
              value={widget.fillColor}
              onChange={(fillColor) => onPatch({ fillColor })}
            />
          </>
        ) : null}

        {widget.kind === "status-pill" ? (
          <StatusPillToneFields widget={widget} onPatch={onPatch} />
        ) : null}

        {widget.kind === "led-indicator" ? (
          <LedAppearanceFields widget={widget} onPatch={onPatch} />
        ) : null}
      </div>
    </CourseInspectorCard>
  );
}
