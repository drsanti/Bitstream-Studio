import type { CSSProperties, ReactNode } from "react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNColorRingPicker } from "../../ui/TRN/TRNColorRingPicker";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { normalizeTrnColorHex, trnColorCssBackground } from "../../ui/TRN/trn-color-utils";
import type { KonvaConnectorPathMode } from "../schemas/konvaConnector";
import type { KonvaConnectorShapeV1, KonvaShapeV1 } from "../schemas/konvaShapes";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNButton } from "../../ui/TRN/TRNButton";
import {
  defaultKonvaQuadraticControl,
  getKonvaConnectorPathMode,
} from "../runtime/diagram/konvaConnectorPath";
import {
  COURSE_KONVA_STROKE_COLOR,
  COURSE_KONVA_TEXT_COLOR,
  konvaColorPickerValue,
  konvaFillFromPicker,
} from "./courseKonvaTheme";
import {
  KONVA_FILL_PRESETS,
  KONVA_STROKE_PRESETS,
  KONVA_STROKE_WIDTH_PRESETS,
  KONVA_TEXT_PRESETS,
  konvaColorsMatch,
} from "./konvaShapeStylePresets";
import {
  disableKonvaRectMixedCornerRadii,
  enableKonvaRectMixedCornerRadii,
  getKonvaRectCornerRadii,
  KONVA_CORNER_RADIUS_PRESETS,
  konvaRectMaxCornerRadius,
  konvaRectHasIndividualCorners,
  konvaRectUsesMixedCornerRadii,
  setKonvaRectUniformCornerRadius,
} from "../runtime/diagram/konvaCornerRadius";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";

type PatchShape = (patch: Partial<KonvaShapeV1>, options?: { recordUndo?: boolean }) => void;

const KONVA_CONNECTOR_PATH_MODE_OPTIONS: { value: KonvaConnectorPathMode; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "orthogonal", label: "Orthogonal" },
  { value: "quadratic", label: "Single bend" },
  { value: "spline", label: "Smooth through points" },
  { value: "bezier", label: "Bezier pen" },
  { value: "tension", label: "Freeform smooth" },
];

function connectorMidpoint(shape: KonvaConnectorShapeV1) {
  return { x: (shape.x1 + shape.x2) / 2, y: (shape.y1 + shape.y2) / 2 };
}

function KonvaConnectorPathControls({
  shape,
  patchShape,
}: {
  shape: KonvaConnectorShapeV1;
  patchShape: PatchShape;
}) {
  const pathMode = getKonvaConnectorPathMode(shape);
  const canAddPoint =
    pathMode === "spline" ||
    pathMode === "tension" ||
    pathMode === "bezier" ||
    pathMode === "orthogonal";

  const addBendPoint = () => {
    const mid = connectorMidpoint(shape);
    if (pathMode === "quadratic") {
      patchShape({
        pathMode: "quadratic",
        curve: shape.curve ?? defaultKonvaQuadraticControl(shape),
      });
      return;
    }
    if (pathMode === "spline") {
      patchShape({ pathMode: "spline", waypoints: [...(shape.waypoints ?? []), mid] });
      return;
    }
    if (pathMode === "tension") {
      patchShape({
        pathMode: "tension",
        vertices: [...(shape.vertices ?? []), mid],
        tension: shape.tension ?? 0.5,
      });
      return;
    }
    if (pathMode === "bezier") {
      patchShape({
        pathMode: "bezier",
        knots: [...(shape.knots ?? []), { x: mid.x, y: mid.y }],
      });
    }
  };

  return (
    <>
      <InspectorBlock label="Path style">
        <TRNSelect
          value={pathMode}
          options={KONVA_CONNECTOR_PATH_MODE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onChange={(next) => patchShape({ pathMode: next as KonvaConnectorPathMode })}
        />
        <p className="mt-2 text-xs text-white/55">
          Double-click the connector to add a bend. Double-click a cyan handle to remove it.
        </p>
      </InspectorBlock>
      {pathMode === "tension" ? (
        <InspectorBlock label="Curve tension">
          <CourseMaintainerScrubNumberInput
            value={shape.tension ?? 0.5}
            min={0}
            max={1}
            step={0.05}
            onChange={(tension) => patchShape({ pathMode: "tension", tension })}
          />
        </InspectorBlock>
      ) : null}
      {canAddPoint || pathMode === "quadratic" ? (
        <InspectorBlock label="Path points">
          <TRNButton type="button" size="compact" onClick={addBendPoint}>
            Add bend point
          </TRNButton>
        </InspectorBlock>
      ) : null}
    </>
  );
}

function konvaStrokeWidthBarStyle(width: number, stroke: string | undefined): CSSProperties {
  const color =
    stroke == null || stroke === "transparent" ? COURSE_KONVA_STROKE_COLOR : stroke;
  if (color.startsWith("#")) {
    const normalized = normalizeTrnColorHex(color, COURSE_KONVA_STROKE_COLOR, true);
    return {
      height: Math.max(2, width),
      background: trnColorCssBackground(normalized),
    };
  }
  return {
    height: Math.max(2, width),
    backgroundColor: color,
  };
}

function KonvaStyleColorSwatch({
  color,
  label,
  selected,
  transparent,
  onClick,
}: {
  color: string;
  label: string;
  selected: boolean;
  transparent?: boolean;
  onClick: () => void;
}) {
  return (
    <TRNTooltip
      content={label}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      triggerWrapper="span"
      triggerClassName="inline-flex shrink-0"
      trigger={
        <button
          type="button"
          aria-label={label}
          aria-pressed={selected}
          className={`course-konva-style-swatch${selected ? " course-konva-style-swatch--selected" : ""}${
            transparent ? " course-konva-style-swatch--transparent" : ""
          }`}
          style={transparent ? undefined : { backgroundColor: color }}
          onClick={onClick}
        />
      }
    />
  );
}

function KonvaStyleWidthChip({
  width,
  strokeColor,
  selected,
  onClick,
}: {
  width: number;
  strokeColor: string | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Stroke width ${width}`}
      aria-pressed={selected}
      className={`course-konva-style-width-btn${
        selected ? " course-konva-style-width-btn--selected" : ""
      }`}
      onClick={onClick}
    >
      <span
        className="course-konva-style-width-bar"
        style={konvaStrokeWidthBarStyle(width, strokeColor)}
      />
    </button>
  );
}

function KonvaStyleRadiusChip({
  radius,
  selected,
  onClick,
}: {
  radius: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={radius === 0 ? "Square corners" : `Corner radius ${radius}`}
      aria-pressed={selected}
      className={`course-konva-style-radius-btn${
        selected ? " course-konva-style-radius-btn--selected" : ""
      }`}
      onClick={onClick}
    >
      <span
        className={`course-konva-style-radius-icon${
          radius === 0 ? " course-konva-style-radius-icon--square" : ""
        }`}
        style={radius > 0 ? { borderRadius: Math.min(6, radius + 2) } : undefined}
      />
    </button>
  );
}

function KonvaStyleCornerRadiusControls({
  shapeId,
  shape,
  layout,
  patchShape,
}: {
  shapeId: string;
  shape: Extract<KonvaShapeV1, { type: "rect" }>;
  layout: "floating" | "inspector";
  patchShape: PatchShape;
}) {
  const radii = getKonvaRectCornerRadii(shape);
  const uniformRadius = radii[0];
  const mixedCorners = konvaRectHasIndividualCorners(shape);
  const maxRadius = konvaRectMaxCornerRadius(shape.width, shape.height);
  const presetsMatch = (preset: number) =>
    !mixedCorners && Math.round(uniformRadius) === preset;

  const applyUniform = (cornerRadius: number) => {
    patchShape(setKonvaRectUniformCornerRadius(shape, cornerRadius));
  };

  const Section = layout === "floating" ? FloatingSection : InspectorBlock;

  return (
    <>
      <Section label="Corner radius">
        {KONVA_CORNER_RADIUS_PRESETS.map((preset) => (
          <KonvaStyleRadiusChip
            key={preset}
            radius={preset}
            selected={presetsMatch(preset)}
            onClick={() => applyUniform(preset)}
          />
        ))}
        <CourseMaintainerScrubNumberInput
          value={Math.round(uniformRadius * 10) / 10}
          min={0}
          max={Math.round(maxRadius * 10) / 10}
          step={1}
          aria-label="Corner radius"
          className={
            layout === "floating"
              ? "course-konva-style-width-scrub text-left"
              : "course-konva-style-width-scrub"
          }
          onChange={(nextRadius) => applyUniform(nextRadius)}
        />
      </Section>
      {layout === "inspector" ? (
        <InspectorBlock label="Corners">
          <TRNInlineToggleRow
            id={`${shapeId}-mixed-corners`}
            label="Individual corners"
            hint="Show a handle on each corner and edit radii independently."
            checked={mixedCorners}
            onCheckedChange={(checked) =>
              patchShape(checked ? enableKonvaRectMixedCornerRadii(shape) : disableKonvaRectMixedCornerRadii(shape))
            }
          />
        </InspectorBlock>
      ) : null}
    </>
  );
}

function KonvaStyleOpacityControl({
  shapeId,
  opacityPercent,
  layout,
  patchShape,
}: {
  shapeId: string;
  opacityPercent: number;
  layout: "floating" | "inspector";
  patchShape: PatchShape;
}) {
  return (
    <div
      className={
        layout === "inspector"
          ? "course-konva-style-controls__opacity"
          : "course-konva-style-controls__opacity course-konva-style-controls__opacity--compact"
      }
    >
      <input
        id={`${shapeId}-opacity`}
        type="range"
        min={0}
        max={100}
        step={5}
        aria-label="Shape opacity"
        className="course-konva-style-opacity"
        value={opacityPercent}
        onChange={(event) =>
          patchShape({ opacity: Number(event.target.value) / 100 }, { recordUndo: false })
        }
        onPointerUp={(event) =>
          patchShape(
            { opacity: Number((event.target as HTMLInputElement).value) / 100 },
            { recordUndo: true },
          )
        }
      />
      <span className="course-konva-style-opacity-value">{opacityPercent}%</span>
    </div>
  );
}

function KonvaStyleColorReadout({ value }: { value: string }) {
  if (value === "transparent") {
    return <span className="course-konva-style-color-readout">Transparent</span>;
  }
  const normalized = normalizeTrnColorHex(value, "#000000", true);
  const display =
    normalized.length === 9 ? normalized.toUpperCase() : normalized.slice(0, 7).toUpperCase();
  const alpha =
    normalized.length === 9 ? Math.round((parseInt(normalized.slice(7, 9), 16) / 255) * 100) : 100;

  return (
    <span className="course-konva-style-color-readout">
      {display}
      {alpha < 100 ? ` · ${alpha}%` : null}
    </span>
  );
}

function FloatingSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="course-konva-style-controls__section course-konva-style-controls__section--compact">
      <span className="course-konva-style-controls__label">{label}</span>
      <div className="course-konva-style-controls__row">{children}</div>
    </div>
  );
}

function InspectorBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="course-konva-style-controls__block">
      <div className="course-konva-style-controls__label">{label}</div>
      {children}
    </div>
  );
}

export function KonvaShapeStyleControls({
  layout,
  shapeId,
  shape,
  patchShape,
  hasStroke,
  hasFill,
  isText,
  hasCornerRadius,
  hasConnector,
  isGroup,
  groupChildCount,
  onUngroup,
  canUngroup,
}: {
  layout: "floating" | "inspector";
  shapeId: string;
  shape: KonvaShapeV1;
  patchShape: PatchShape;
  hasStroke: boolean;
  hasFill: boolean;
  isText: boolean;
  hasCornerRadius?: boolean;
  hasConnector?: boolean;
  isGroup?: boolean;
  groupChildCount?: number;
  onUngroup?: () => void;
  canUngroup?: boolean;
}) {
  const stroke = shape.stroke ?? COURSE_KONVA_STROKE_COLOR;
  const fill = shape.fill ?? (hasFill ? "transparent" : undefined);
  const textFill = shape.fill ?? COURSE_KONVA_TEXT_COLOR;
  const strokeWidth = shape.strokeWidth ?? 2;
  const opacityPercent = Math.round((shape.opacity ?? 1) * 100);

  const Section = layout === "floating" ? FloatingSection : InspectorBlock;

  if (layout === "floating") {
    return (
      <>
        {isText ? (
          <Section label="Text">
            <TRNInput
              id={`${shapeId}-floating-text`}
              variant="outlined"
              size="sm"
              className="course-konva-style-text-input"
              value={shape.text}
              onChange={(event) => patchShape({ text: event.target.value }, { recordUndo: false })}
              onBlur={(event) => patchShape({ text: event.target.value }, { recordUndo: true })}
            />
          </Section>
        ) : null}

        {hasStroke ? (
          <Section label="Stroke">
            {KONVA_STROKE_PRESETS.map((preset) => (
              <KonvaStyleColorSwatch
                key={preset}
                color={preset}
                label={`Stroke ${preset}`}
                selected={konvaColorsMatch(stroke, preset)}
                onClick={() => patchShape({ stroke: preset })}
              />
            ))}
            <TRNColorRingPicker
              ariaLabel="Custom stroke color"
              valueHex={konvaColorPickerValue(stroke, COURSE_KONVA_STROKE_COLOR)}
              enableAlpha
              triggerVariant="swatch"
              size="sm"
              onValueHexChange={(value) => patchShape({ stroke: value })}
            />
          </Section>
        ) : null}

        {isText ? (
          <Section label="Color">
            {KONVA_TEXT_PRESETS.map((preset) => (
              <KonvaStyleColorSwatch
                key={preset}
                color={preset}
                label={`Text ${preset}`}
                selected={konvaColorsMatch(textFill, preset)}
                onClick={() => patchShape({ fill: preset })}
              />
            ))}
            <TRNColorRingPicker
              ariaLabel="Custom text color"
              valueHex={konvaColorPickerValue(textFill, COURSE_KONVA_TEXT_COLOR)}
              enableAlpha
              triggerVariant="swatch"
              size="sm"
              onValueHexChange={(value) => patchShape({ fill: value })}
            />
          </Section>
        ) : null}

        {hasFill ? (
          <Section label="Background">
            {KONVA_FILL_PRESETS.map((preset) => (
              <KonvaStyleColorSwatch
                key={preset}
                color={preset}
                label={preset === "transparent" ? "Transparent fill" : `Fill ${preset}`}
                selected={konvaColorsMatch(fill ?? "transparent", preset)}
                transparent={preset === "transparent"}
                onClick={() => patchShape({ fill: preset })}
              />
            ))}
            <TRNColorRingPicker
              ariaLabel="Custom fill color"
              valueHex={konvaColorPickerValue(fill, "#000000")}
              enableAlpha
              triggerVariant="swatch"
              size="sm"
              onValueHexChange={(value) => patchShape({ fill: konvaFillFromPicker(value) })}
            />
          </Section>
        ) : null}

        {hasStroke ? (
          <Section label="Stroke width">
            {KONVA_STROKE_WIDTH_PRESETS.map((width) => (
              <KonvaStyleWidthChip
                key={width}
                width={width}
                strokeColor={stroke}
                selected={strokeWidth === width}
                onClick={() => patchShape({ strokeWidth: width })}
              />
            ))}
            <CourseMaintainerScrubNumberInput
              value={strokeWidth}
              min={0}
              max={24}
              step={0.5}
              aria-label="Stroke width"
              className="course-konva-style-width-scrub text-left"
              onChange={(nextWidth) => patchShape({ strokeWidth: nextWidth })}
            />
          </Section>
        ) : null}

        {hasCornerRadius && shape.type === "rect" ? (
          <KonvaStyleCornerRadiusControls
            shapeId={shapeId}
            shape={shape}
            layout={layout}
            patchShape={patchShape}
          />
        ) : null}

        {isGroup ? (
          <Section label="Group">
            <span className="text-xs text-zinc-400">
              {groupChildCount ?? 0} child{(groupChildCount ?? 0) === 1 ? "" : "ren"}
            </span>
            {canUngroup && onUngroup != null ? (
              <TRNButton size="sm" variant="secondary" onClick={onUngroup}>
                Ungroup
              </TRNButton>
            ) : null}
          </Section>
        ) : null}

        <Section label="Opacity">
          <KonvaStyleOpacityControl
            shapeId={shapeId}
            opacityPercent={opacityPercent}
            layout={layout}
            patchShape={patchShape}
          />
        </Section>
      </>
    );
  }

  return (
    <div className="course-konva-style-controls course-konva-style-controls--inspector">
      {isText ? (
        <InspectorBlock label="Label">
          <TRNInput
            id={`${shapeId}-inspector-text`}
            variant="outlined"
            size="sm"
            className="course-konva-style-text-input"
            value={shape.text}
            onChange={(event) => patchShape({ text: event.target.value })}
          />
        </InspectorBlock>
      ) : null}

      {isText ? (
        <InspectorBlock label="Font size & color">
          <div className="course-konva-style-controls__font-row">
            <CourseMaintainerScrubNumberInput
              value={shape.fontSize ?? 20}
              min={8}
              max={120}
              step={1}
              onChange={(fontSize) => patchShape({ fontSize })}
            />
            <div className="course-konva-style-controls__row">
              {KONVA_TEXT_PRESETS.map((preset) => (
                <KonvaStyleColorSwatch
                  key={preset}
                  color={preset}
                  label={`Text ${preset}`}
                  selected={konvaColorsMatch(textFill, preset)}
                  onClick={() => patchShape({ fill: preset })}
                />
              ))}
              <TRNColorRingPicker
                ariaLabel="Custom text color"
                valueHex={konvaColorPickerValue(textFill, COURSE_KONVA_TEXT_COLOR)}
                enableAlpha
                triggerVariant="swatch"
                size="sm"
                onValueHexChange={(value) => patchShape({ fill: value })}
              />
            </div>
          </div>
        </InspectorBlock>
      ) : null}

      {hasStroke ? (
        <InspectorBlock label="Stroke">
          <div className="course-konva-style-controls__stroke-row">
            <div className="course-konva-style-controls__row course-konva-style-controls__row--grow">
              {KONVA_STROKE_PRESETS.map((preset) => (
                <KonvaStyleColorSwatch
                  key={preset}
                  color={preset}
                  label={`Stroke ${preset}`}
                  selected={konvaColorsMatch(stroke, preset)}
                  onClick={() => patchShape({ stroke: preset })}
                />
              ))}
              <TRNColorRingPicker
                ariaLabel="Custom stroke color"
                valueHex={konvaColorPickerValue(stroke, COURSE_KONVA_STROKE_COLOR)}
                enableAlpha
                triggerVariant="swatch"
                size="sm"
                onValueHexChange={(value) => patchShape({ stroke: value })}
              />
              <KonvaStyleColorReadout value={stroke} />
            </div>
            <div className="course-konva-style-controls__width-group">
              <span className="course-konva-style-controls__inline-label">Width</span>
              {KONVA_STROKE_WIDTH_PRESETS.map((width) => (
                <KonvaStyleWidthChip
                  key={width}
                  width={width}
                  strokeColor={stroke}
                  selected={strokeWidth === width}
                  onClick={() => patchShape({ strokeWidth: width })}
                />
              ))}
              <CourseMaintainerScrubNumberInput
                value={strokeWidth}
                min={0}
                max={24}
                step={0.5}
                onChange={(nextWidth) => patchShape({ strokeWidth: nextWidth })}
              />
            </div>
          </div>
        </InspectorBlock>
      ) : null}

      {hasFill ? (
        <InspectorBlock label="Fill">
          <div className="course-konva-style-controls__row">
            {KONVA_FILL_PRESETS.map((preset) => (
              <KonvaStyleColorSwatch
                key={preset}
                color={preset}
                label={preset === "transparent" ? "Transparent fill" : `Fill ${preset}`}
                selected={konvaColorsMatch(fill ?? "transparent", preset)}
                transparent={preset === "transparent"}
                onClick={() => patchShape({ fill: preset })}
              />
            ))}
            <TRNColorRingPicker
              ariaLabel="Custom fill color"
              valueHex={konvaColorPickerValue(fill, "#000000")}
              enableAlpha
              triggerVariant="swatch"
              size="sm"
              onValueHexChange={(value) => patchShape({ fill: konvaFillFromPicker(value) })}
            />
            <KonvaStyleColorReadout value={fill ?? "transparent"} />
          </div>
        </InspectorBlock>
      ) : null}

      {hasCornerRadius && shape.type === "rect" ? (
        <KonvaStyleCornerRadiusControls
          shapeId={shapeId}
          shape={shape}
          layout={layout}
          patchShape={patchShape}
        />
      ) : null}

      {hasConnector && (shape.type === "line" || shape.type === "arrow") ? (
        <KonvaConnectorPathControls shape={shape} patchShape={patchShape} />
      ) : null}

      {isGroup ? (
        <InspectorBlock label="Group">
          <p className="text-xs text-zinc-400">
            {(groupChildCount ?? 0).toString()} child shape
            {(groupChildCount ?? 0) === 1 ? "" : "s"}. Double-click the group on the canvas to edit
            children.
          </p>
          {canUngroup && onUngroup != null ? (
            <TRNButton size="sm" variant="secondary" onClick={onUngroup}>
              Ungroup
            </TRNButton>
          ) : null}
        </InspectorBlock>
      ) : null}

      <InspectorBlock label="Opacity">
        <KonvaStyleOpacityControl
          shapeId={shapeId}
          opacityPercent={opacityPercent}
          layout={layout}
          patchShape={patchShape}
        />
      </InspectorBlock>
    </div>
  );
}
