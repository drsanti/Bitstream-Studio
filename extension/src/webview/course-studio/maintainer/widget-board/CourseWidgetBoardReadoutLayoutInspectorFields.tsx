import { LayoutGrid } from "lucide-react";
import type {
  WidgetBoardEntryV1,
  WidgetBoardReadoutCrossAlign,
  WidgetBoardReadoutGapPx,
  WidgetBoardReadoutJustify,
  WidgetBoardReadoutLayout,
  WidgetBoardReadoutOrder,
  WidgetBoardTileContentAlign,
  WidgetBoardValueAlign,
} from "../../schemas/widgetBoard.v1";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import { valueAlignFromReadoutCrossAlign } from "../../ui/catalog/widget-board/widgetBoardReadoutLayout";

type LayoutPatch = Partial<
  Pick<
    WidgetBoardEntryV1,
    | "readoutLayout"
    | "readoutInlineAlign"
    | "readoutJustify"
    | "readoutCrossAlign"
    | "readoutOrder"
    | "readoutGapPx"
    | "readoutValueGrow"
    | "tileContentH"
    | "tileContentV"
    | "valueAlign"
  >
>;

type LayoutWidget = {
  id: string;
  readoutLayout: WidgetBoardReadoutLayout;
  readoutInlineAlign: "start" | "center" | "end" | "between";
  readoutJustify?: WidgetBoardReadoutJustify;
  readoutCrossAlign?: WidgetBoardReadoutCrossAlign;
  readoutOrder: WidgetBoardReadoutOrder;
  readoutGapPx: WidgetBoardReadoutGapPx;
  readoutValueGrow: boolean;
  tileContentH: WidgetBoardTileContentAlign;
  tileContentV: WidgetBoardTileContentAlign;
  valueAlign?: WidgetBoardValueAlign;
};

const DISTRIBUTION_OPTIONS: { value: WidgetBoardReadoutJustify; label: string }[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "between", label: "Space between" },
  { value: "evenly", label: "Space evenly" },
];

const CROSS_ALIGN_OPTIONS: { value: WidgetBoardReadoutCrossAlign; label: string }[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "baseline", label: "Baseline" },
];

const TILE_ALIGN_OPTIONS: { value: WidgetBoardTileContentAlign; label: string }[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
];

export function CourseWidgetBoardReadoutLayoutInspectorFields({
  widget,
  onPatch,
  syncValueAlign = false,
}: {
  widget: LayoutWidget;
  onPatch: (patch: LayoutPatch) => void;
  syncValueAlign?: boolean;
}) {
  const isInline = widget.readoutLayout === "inline";
  const distribution = widget.readoutJustify ?? widget.readoutInlineAlign;

  return (
    <CourseInspectorCard
      title="Layout"
      hint="Label/value flex layout and tile placement inside the grid cell."
      titleIcon={<LayoutGrid className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      <div className="flex flex-col gap-2">
        <TRNFormField id={`${widget.id}-readout-layout`} label="Label & value layout">
          <TRNSelect
            value={widget.readoutLayout}
            ariaLabel="Label and value layout"
            variant="field"
            size="sm"
            options={[
              { value: "stacked", label: "Stacked (column)" },
              { value: "inline", label: "Inline row" },
            ]}
            onValueChange={(value) => {
              if (value === "stacked" || value === "inline") {
                onPatch({ readoutLayout: value });
              }
            }}
          />
        </TRNFormField>

        <TRNFormField
          id={`${widget.id}-readout-justify`}
          label={isInline ? "Row distribution" : "Stack distribution"}
        >
          <TRNSelect
            value={distribution}
            ariaLabel="Readout main-axis distribution"
            variant="field"
            size="sm"
            options={DISTRIBUTION_OPTIONS}
            onValueChange={(value) => {
              if (
                value === "start" ||
                value === "center" ||
                value === "end" ||
                value === "between" ||
                value === "evenly"
              ) {
                onPatch({
                  readoutJustify: value,
                  readoutInlineAlign:
                    value === "between"
                      ? "between"
                      : value === "evenly"
                        ? "between"
                        : value,
                });
              }
            }}
          />
        </TRNFormField>

        <TRNFormField
          id={`${widget.id}-readout-cross-align`}
          label={isInline ? "Row cross align" : "Stack align"}
        >
          <TRNSelect
            value={widget.readoutCrossAlign ?? (isInline ? "baseline" : "start")}
            ariaLabel="Readout cross-axis alignment"
            variant="field"
            size="sm"
            options={CROSS_ALIGN_OPTIONS}
            onValueChange={(value) => {
              if (
                value === "start" ||
                value === "center" ||
                value === "end" ||
                value === "baseline"
              ) {
                const patch: LayoutPatch = { readoutCrossAlign: value };
                if (syncValueAlign && !isInline && value !== "baseline") {
                  patch.valueAlign = valueAlignFromReadoutCrossAlign(value);
                }
                onPatch(patch);
              }
            }}
          />
        </TRNFormField>

        <TRNFormField id={`${widget.id}-readout-order`} label="Element order">
          <TRNSelect
            value={widget.readoutOrder}
            ariaLabel="Label and value order"
            variant="field"
            size="sm"
            options={[
              { value: "label-first", label: "Label · value" },
              { value: "value-first", label: "Value · label" },
            ]}
            onValueChange={(value) => {
              if (value === "label-first" || value === "value-first") {
                onPatch({ readoutOrder: value });
              }
            }}
          />
        </TRNFormField>

        <TRNFormField id={`${widget.id}-readout-gap`} label="Gap">
          <TRNSelect
            value={String(widget.readoutGapPx)}
            ariaLabel="Gap between label and value"
            variant="field"
            size="sm"
            options={[
              { value: "4", label: "4 px" },
              { value: "8", label: "8 px" },
              { value: "12", label: "12 px" },
              { value: "16", label: "16 px" },
            ]}
            onValueChange={(value) => {
              const gap = Number(value);
              if (gap === 4 || gap === 8 || gap === 12 || gap === 16) {
                onPatch({ readoutGapPx: gap });
              }
            }}
          />
        </TRNFormField>

        {isInline ? (
          <TRNInlineToggleRow
            label="Value fills row"
            checked={widget.readoutValueGrow}
            onCheckedChange={(readoutValueGrow) => onPatch({ readoutValueGrow })}
            ariaLabel="Let value stretch across the inline row"
          />
        ) : null}

        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">In tile</p>
        <TRNFormField id={`${widget.id}-tile-h`} label="Horizontal">
          <TRNSelect
            value={widget.tileContentH}
            ariaLabel="Tile horizontal content alignment"
            variant="field"
            size="sm"
            options={TILE_ALIGN_OPTIONS}
            onValueChange={(value) => {
              if (value === "start" || value === "center" || value === "end") {
                onPatch({ tileContentH: value });
              }
            }}
          />
        </TRNFormField>
        <TRNFormField id={`${widget.id}-tile-v`} label="Vertical">
          <TRNSelect
            value={widget.tileContentV}
            ariaLabel="Tile vertical content alignment"
            variant="field"
            size="sm"
            options={TILE_ALIGN_OPTIONS}
            onValueChange={(value) => {
              if (value === "start" || value === "center" || value === "end") {
                onPatch({ tileContentV: value });
              }
            }}
          />
        </TRNFormField>
      </div>
    </CourseInspectorCard>
  );
}

export function CourseWidgetBoardHeroTileLayoutInspectorFields({
  widget,
  onPatch,
}: {
  widget: {
    id: string;
    showLabel: boolean;
    labelPosition: "top" | "bottom";
    tileContentH: WidgetBoardTileContentAlign;
    tileContentV: WidgetBoardTileContentAlign;
  };
  onPatch: (patch: {
    showLabel?: boolean;
    labelPosition?: "top" | "bottom";
    tileContentH?: WidgetBoardTileContentAlign;
    tileContentV?: WidgetBoardTileContentAlign;
  }) => void;
}) {
  return (
    <CourseInspectorCard
      title="Layout"
      hint="Label placement and content position inside the grid cell."
      titleIcon={<LayoutGrid className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      <div className="flex flex-col gap-2">
        <TRNInlineToggleRow
          label="Show label"
          checked={widget.showLabel}
          onCheckedChange={(showLabel) => onPatch({ showLabel })}
          ariaLabel="Show hero gauge section label"
        />
        <TRNFormField id={`${widget.id}-label-position`} label="Label position">
          <TRNSelect
            value={widget.labelPosition}
            ariaLabel="Hero gauge label position"
            variant="field"
            size="sm"
            options={[
              { value: "top", label: "Above gauge" },
              { value: "bottom", label: "Below gauge" },
            ]}
            onValueChange={(value) => {
              if (value === "top" || value === "bottom") {
                onPatch({ labelPosition: value });
              }
            }}
          />
        </TRNFormField>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">In tile</p>
        <TRNFormField id={`${widget.id}-tile-h`} label="Horizontal">
          <TRNSelect
            value={widget.tileContentH}
            ariaLabel="Tile horizontal content alignment"
            variant="field"
            size="sm"
            options={TILE_ALIGN_OPTIONS}
            onValueChange={(value) => {
              if (value === "start" || value === "center" || value === "end") {
                onPatch({ tileContentH: value });
              }
            }}
          />
        </TRNFormField>
        <TRNFormField id={`${widget.id}-tile-v`} label="Vertical">
          <TRNSelect
            value={widget.tileContentV}
            ariaLabel="Tile vertical content alignment"
            variant="field"
            size="sm"
            options={TILE_ALIGN_OPTIONS}
            onValueChange={(value) => {
              if (value === "start" || value === "center" || value === "end") {
                onPatch({ tileContentV: value });
              }
            }}
          />
        </TRNFormField>
      </div>
    </CourseInspectorCard>
  );
}
