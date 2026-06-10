import { useRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { TRNHintTooltip } from "../../ui/TRN/TRNHintTooltip";
import { TRNEmojiPickerPopover } from "../../ui/TRN/TRNEmojiPickerPopover";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNTextarea } from "../../ui/TRN/TRNTextarea";
import {
  applyTextControlSelection,
  insertTextAtCursor,
  readTextControlSelection,
} from "../../ui/TRN/insertTextAtCursor";

type SharedProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

type SingleLineProps = SharedProps & {
  multiline?: false;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "onChange" | "id">;

type MultiLineProps = SharedProps & {
  multiline: true;
  rows?: number;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "id">;

export type CourseEmojiTextFieldProps = SingleLineProps | MultiLineProps;

function CourseEmojiFieldLabel({
  label,
  hint,
  htmlFor,
  required,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  required?: boolean;
}) {
  const labelBody = (
    <>
      {label}
      {required ? <span className="text-rose-400"> *</span> : null}
    </>
  );
  const labelClassName = "block w-fit text-[11px] font-medium text-zinc-100";

  if (hint != null && hint.length > 0) {
    return (
      <TRNHintTooltip
        trigger={
          <label htmlFor={htmlFor} className={labelClassName}>
            {labelBody}
          </label>
        }
        content={hint}
        triggerAriaLabel={`About ${label}`}
        placement="top-start"
        triggerWrapper="span"
        triggerClassName="w-fit"
        wide={hint.length > 120}
      />
    );
  }

  return (
    <label htmlFor={htmlFor} className={labelClassName}>
      {labelBody}
    </label>
  );
}

export function CourseEmojiTextField(props: CourseEmojiTextFieldProps) {
  const {
    id,
    label,
    hint,
    required,
    error,
    value,
    onChange,
    disabled,
    className,
    multiline,
    ...rest
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertEmoji = (emoji: string) => {
    const control = multiline ? textareaRef.current : inputRef.current;
    const range = readTextControlSelection(control, value.length);
    const result = insertTextAtCursor(value, range, emoji);
    onChange(result.text);
    requestAnimationFrame(() => {
      if (control != null) {
        applyTextControlSelection(control, result.selection);
      }
    });
  };

  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <CourseEmojiFieldLabel
          label={label}
          hint={error ? undefined : hint}
          htmlFor={id}
          required={required}
        />
        <TRNEmojiPickerPopover
          disabled={disabled}
          onPick={insertEmoji}
          hint="Insert emoji at the text cursor"
        />
      </div>
      {multiline ? (
        <TRNTextarea
          {...(rest as Omit<MultiLineProps, keyof SharedProps | "multiline" | "rows">)}
          id={id}
          ref={textareaRef}
          variant="outlined"
          size="sm"
          className="w-full"
          rows={(props as MultiLineProps).rows ?? 4}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <TRNInput
          {...(rest as Omit<SingleLineProps, keyof SharedProps | "multiline">)}
          id={id}
          ref={inputRef}
          variant="outlined"
          size="sm"
          className="w-full"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error != null && error.length > 0 ? (
        <p className="text-[10px] text-rose-300">{error}</p>
      ) : null}
    </div>
  );
}
