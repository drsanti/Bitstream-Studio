import { useFlowEditorStore } from "../features/editor/store/flow-editor.store";

/** Returns true when a graph **On Key** node handled the keyboard event. */
export function dispatchFlowKeyboardEventFromDom(event: KeyboardEvent): boolean {
  return useFlowEditorStore.getState().dispatchFlowKeyboardEvent({
    code: event.code,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  });
}

/** Returns true when a graph **On Click** node handled the pane pointer event. */
export function dispatchFlowPanePointerEventFromDom(event: { button: number }): boolean {
  return useFlowEditorStore.getState().dispatchFlowPanePointerEvent(event);
}
