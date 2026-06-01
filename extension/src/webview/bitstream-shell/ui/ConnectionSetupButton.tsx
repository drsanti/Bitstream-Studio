import { Plug } from "lucide-react";
import {
  WORKSPACE_CHROME_TOOLBAR_BTN_CLASS,
  WORKSPACE_CHROME_TOOLBAR_BTN_ICON_CLASS,
} from "../../ui/components/workspace-chrome-toolbar-ui";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";

/** Opens the guided Connection panel (UART, broker, handshake, sensor cfg). */
export function ConnectionSetupButton(props: { onClick: () => void }) {
  const { onClick } = props;
  return (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      disableHoverFx
      triggerWrapper="span"
      triggerClassName="!p-0"
      triggerAriaLabel="Connection setup"
      content="Open guided connection setup (UART, broker, handshake, sensor config)."
      trigger={
        <button type="button" className={WORKSPACE_CHROME_TOOLBAR_BTN_CLASS} onClick={onClick}>
          <Plug className={WORKSPACE_CHROME_TOOLBAR_BTN_ICON_CLASS} aria-hidden />
          Connection…
        </button>
      }
    />
  );
}
