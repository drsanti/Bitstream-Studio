import type { ReactNode } from "react";
import { SHELL_CONTROL_DECK_ZONE_CLASS } from "./shell-control-deck-ui";

export function ShellControlDeckZone(props: { ariaLabel: string; children: ReactNode }) {
  const { ariaLabel, children } = props;
  return (
    <div className={SHELL_CONTROL_DECK_ZONE_CLASS} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
