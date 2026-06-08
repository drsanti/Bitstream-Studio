import { twMerge } from "tailwind-merge";
import type { StudioPortType } from "../port-accent";
import { studioPortAccent } from "../port-accent";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "./readings/socket-live-value-cell";

export type SocketStructuredWireBadgeProps = {
  /** Visible text (often pre-truncated). */
  label: string;
  portType: StudioPortType;
  /** Native tooltip; defaults to `label`. Pass the full preset name when `label` is truncated. */
  title?: string;
};

/** Compact wired badge for bundled flow wires (environment, camera, …). */
export function SocketStructuredWireBadge(props: SocketStructuredWireBadgeProps) {
  const { label, portType, title } = props;
  const accent = studioPortAccent(portType);
  return (
    <span
      data-flow-socket-live-preview
      className={twMerge(
        SOCKET_LIVE_VALUE_TYPOGRAPHY,
        "inline-flex max-w-full items-center whitespace-nowrap rounded border px-1 py-px text-[10px] font-medium leading-none",
      )}
      style={{
        borderColor: `${accent}66`,
        color: accent,
        backgroundColor: `${accent}14`,
      }}
      title={title ?? label}
    >
      {label}
    </span>
  );
}
