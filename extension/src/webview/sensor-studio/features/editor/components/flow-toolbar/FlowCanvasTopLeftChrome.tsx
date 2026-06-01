import { StudioOverflowMenu } from "../StudioOverflowMenu";
import { useStudioFlowCanvasChrome } from "../../studio-flow-canvas-chrome.context";
import { FLOW_CANVAS_CHROME_BTN_CLASS } from "./flow-toolbar-tokens";

/** Studio menu only — top-right of the flow canvas (wire/FPS live in the shell toolbar). */
export function FlowCanvasTopLeftChrome() {
  const menuProps = useStudioFlowCanvasChrome();

  if (menuProps == null) {
    return null;
  }

  return (
    <div
      className="nodrag nowheel pointer-events-auto flex w-fit items-center gap-1.5"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <StudioOverflowMenu
        {...menuProps}
        menuTriggerClassName={FLOW_CANVAS_CHROME_BTN_CLASS}
      />
    </div>
  );
}
