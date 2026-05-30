import { useCallback } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import type { Project4MoveDirection } from "../../lib/mcu-http";

const PRIMARY =
  "min-h-9 min-w-11 border border-white/12 bg-zinc-950/50 text-xs font-semibold text-zinc-100 shadow-sm backdrop-blur-md hover:bg-zinc-900/55 hover:border-white/18";

const STOP_STYLE =
  "min-h-9 min-w-[8.5rem] border border-rose-400/35 bg-rose-950/45 text-sm font-bold tracking-wide text-rose-100 shadow-sm backdrop-blur-md hover:bg-rose-950/60";

export type DriveControlDeckProps = {
  onMove: (dir: Project4MoveDirection) => void;
  disabled?: boolean;
};

export function DriveControlDeck(props: DriveControlDeckProps) {
  const fire = useCallback(
    (dir: Project4MoveDirection) => {
      if (!props.disabled) {
        props.onMove(dir);
      }
    },
    [props.disabled, props.onMove],
  );

  return (
    <div className="pointer-events-auto flex w-full flex-col">
      <div className="mb-1.5 text-center text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
        Drive <span className="font-mono text-zinc-600">/move</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TRNButton
          type="button"
          size="compact"
          className={STOP_STYLE}
          disabled={props.disabled}
          onClick={() => fire("STOP")}
        >
          STOP
        </TRNButton>
        <div className="grid grid-cols-3 place-items-center gap-1">
          <span />
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY}
            disabled={props.disabled}
            onClick={() => fire("W")}
          >
            W
          </TRNButton>
          <span />
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY}
            disabled={props.disabled}
            onClick={() => fire("A")}
          >
            A
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY}
            disabled={props.disabled}
            onClick={() => fire("S")}
          >
            S
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY}
            disabled={props.disabled}
            onClick={() => fire("D")}
          >
            D
          </TRNButton>
        </div>
        <div className="grid w-full grid-cols-2 gap-1">
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY + " w-full"}
            disabled={props.disabled}
            onClick={() => fire("WA")}
          >
            WA
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY + " w-full"}
            disabled={props.disabled}
            onClick={() => fire("WD")}
          >
            WD
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY + " w-full"}
            disabled={props.disabled}
            onClick={() => fire("SA")}
          >
            SA
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            className={PRIMARY + " w-full"}
            disabled={props.disabled}
            onClick={() => fire("SD")}
          >
            SD
          </TRNButton>
        </div>
        <p className="max-w-[16rem] text-center text-[9px] leading-snug text-zinc-500">
          Keys: <span className="font-mono text-zinc-400">W A S D</span>,{" "}
          <span className="font-mono text-zinc-400">Q E Z C</span> (WA/WD/SA/SD),{" "}
          <span className="font-mono text-zinc-400">Space</span> STOP
        </p>
      </div>
    </div>
  );
}
