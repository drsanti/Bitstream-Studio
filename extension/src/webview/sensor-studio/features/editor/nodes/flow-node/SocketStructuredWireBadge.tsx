import { twMerge } from "tailwind-merge";
import type { StudioPortType } from "../port-accent";
import { studioPortAccent } from "../port-accent";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "./readings/socket-live-value-cell";

export type SocketStructuredWireBadgeProps = {
  label: string;
  portType: StudioPortType;
};

/** Compact wired badge for bundled flow wires (environment, camera, …). */
export function SocketStructuredWireBadge(props: SocketStructuredWireBadgeProps) {
  const { label, portType } = props;
  const accent = studioPortAccent(portType);
  return (
    <span
      className={twMerge(
        SOCKET_LIVE_VALUE_TYPOGRAPHY,
        "inline-block max-w-[9rem] truncate rounded border px-1 py-px text-[10px] font-medium",
      )}
      style={{
        borderColor: `${accent}66`,
        color: accent,
        backgroundColor: `${accent}14`,
      }}
      title={label}
    >
      {label}
    </span>
  );
}
