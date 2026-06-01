import { Eye, EyeOff, LayoutList, PanelBottom } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { flowToolbarBtnClass } from "./flow-toolbar-tokens";

type ToggleProps = {
  pressed: boolean;
  onToggle: () => void;
  title: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
};

export function SocketValuesToggle(props: ToggleProps) {
  const { pressed, onToggle, title, ariaLabel, disabled = false, className } = props;
  return (
    <button
      type="button"
      className={twMerge(flowToolbarBtnClass(disabled), className)}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) {
          return;
        }
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {pressed ? <Eye size={14} /> : <EyeOff size={14} className="opacity-70" />}
    </button>
  );
}

export function SocketDisplayToggle(props: ToggleProps) {
  const { pressed, onToggle, title, ariaLabel, disabled = false, className } = props;
  return (
    <button
      type="button"
      className={twMerge(flowToolbarBtnClass(disabled), className)}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) {
          return;
        }
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <LayoutList size={14} className={pressed ? undefined : "opacity-60"} />
    </button>
  );
}

export function BodyControlsToggle(props: ToggleProps) {
  const { pressed, onToggle, title, ariaLabel, disabled = false, className } = props;
  return (
    <button
      type="button"
      className={twMerge(flowToolbarBtnClass(disabled), className)}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) {
          return;
        }
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <PanelBottom size={14} className={pressed ? undefined : "opacity-60"} />
    </button>
  );
}
