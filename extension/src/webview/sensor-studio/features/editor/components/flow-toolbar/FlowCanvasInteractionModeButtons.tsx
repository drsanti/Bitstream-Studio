import { Hand, MousePointer2 } from "lucide-react";
import type { FlowCanvasInteractionMode } from "../../../../persistence/flow-canvas-preferences";
import { TRN_HINT_HOVER_DELAY_MS } from "../../../../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../../../../ui/TRN/TRNTooltip";
import { FLOW_TOOLBAR_DIVIDER_CLASS, flowToolbarBtnClass } from "./flow-toolbar-tokens";

export type FlowCanvasInteractionModeButtonsProps = {
  mode: FlowCanvasInteractionMode;
  onModeChange: (mode: FlowCanvasInteractionMode) => void;
  showTrailingDivider?: boolean;
};

export function FlowCanvasInteractionModeButtons(props: FlowCanvasInteractionModeButtonsProps) {
  const { mode, onModeChange, showTrailingDivider = true } = props;
  const selectActive = mode === "select";
  const panActive = mode === "pan";

  const stopPropagation = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  return (
    <>
      <TRNTooltip
        placement="bottom"
        openDelayMs={TRN_HINT_HOVER_DELAY_MS}
        disableHoverFx
        triggerWrapper="span"
        content="Selection mode — drag on empty canvas to marquee-select nodes"
        trigger={
          <button
            type="button"
            className={flowToolbarBtnClass(false, selectActive)}
            aria-label="Selection mode"
            aria-pressed={selectActive}
            onPointerDown={stopPropagation}
            onClick={(event) => {
              stopPropagation(event);
              onModeChange("select");
            }}
          >
            <MousePointer2 size={14} />
          </button>
        }
      />
      <TRNTooltip
        placement="bottom"
        openDelayMs={TRN_HINT_HOVER_DELAY_MS}
        disableHoverFx
        triggerWrapper="span"
        content="Pan mode — drag on canvas to move the viewport"
        trigger={
          <button
            type="button"
            className={flowToolbarBtnClass(false, panActive)}
            aria-label="Pan mode"
            aria-pressed={panActive}
            onPointerDown={stopPropagation}
            onClick={(event) => {
              stopPropagation(event);
              onModeChange("pan");
            }}
          >
            <Hand size={14} />
          </button>
        }
      />
      {showTrailingDivider ? <div className={FLOW_TOOLBAR_DIVIDER_CLASS} /> : null}
    </>
  );
}
