import { useCallback, useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Check, Pencil, X } from "lucide-react";
import { TRNHintTooltip } from "./TRNHintTooltip.js";

type TRNFormSectionProps = {
  title: string;
  /** Hover tooltip on the section title — not inline helper copy. */
  description?: string;
  /** When false, omit the heading row (e.g. nested inside an inspector card). */
  showHeading?: boolean;
  className?: string;
  children: ReactNode;
};

function TRNFormSectionHeading(props: { title: string; description?: string }) {
  const { title, description } = props;
  const heading = <h3 className="text-xs font-semibold text-zinc-100">{title}</h3>;
  if (description == null || description.length === 0) {
    return heading;
  }
  return (
    <TRNHintTooltip
      trigger={<span className="inline-flex w-fit">{heading}</span>}
      content={description}
      triggerAriaLabel={`About ${title}`}
      placement="top-start"
      triggerWrapper="span"
      triggerClassName="w-fit"
      wide={description.length > 120}
    />
  );
}

/**
 * Group related form fields with a heading and optional hint text.
 */
export function TRNFormSection(props: TRNFormSectionProps) {
  const { title, description, showHeading = true, className = "", children } = props;
  return (
    <section
      className={
        "space-y-2 border border-zinc-700/80 rounded-md p-3 bg-zinc-950/50 " +
        className
      }
    >
      {showHeading ? (
        <div>
          <TRNFormSectionHeading title={title} description={description} />
        </div>
      ) : null}
      <div className="space-y-2">{children}</div>
    </section>
  );
}

type TRNFormFieldProps = {
  label: string;
  id?: string;
  htmlFor?: string;
  error?: string;
  /** Hover tooltip on the label — not inline helper copy. */
  hint?: string;
  /** Inline content after the label (e.g. status badge). */
  labelTrailing?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

function TRNFormFieldLabel(props: {
  label: string;
  hint?: string;
  htmlFor?: string;
  labelTrailing?: ReactNode;
  required?: boolean;
}) {
  const { label, hint, htmlFor, labelTrailing, required = false } = props;
  const labelBody = (
    <>
      {label}
      {required ? <span className="text-rose-400"> *</span> : null}
    </>
  );
  const labelClassName = "block w-fit text-[11px] font-medium text-zinc-100";

  const labelNode =
    hint != null && hint.length > 0 ? (
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
    ) : (
      <label htmlFor={htmlFor} className={labelClassName}>
        {labelBody}
      </label>
    );

  if (labelTrailing == null) {
    return labelNode;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {labelNode}
      {labelTrailing}
    </div>
  );
}

/**
 * Standard label + control + error row for TRN forms.
 */
export function TRNFormField(props: TRNFormFieldProps) {
  const {
    label,
    id,
    htmlFor,
    error,
    hint,
    labelTrailing,
    required = false,
    className = "",
    children,
  } = props;
  const fieldId = id ?? htmlFor;
  return (
    <div className={"space-y-1 " + className}>
      <TRNFormFieldLabel
        label={label}
        hint={error ? undefined : hint}
        htmlFor={fieldId}
        labelTrailing={labelTrailing}
        required={required}
      />
      {children}
      {error ? <p className="text-[10px] text-rose-400">{error}</p> : null}
    </div>
  );
}

type TRNInlineEditProps = {
  value?: string;
  defaultValue?: string;
  onCommit: (next: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  validate?: (value: string) => true | string;
};

/**
 * Click-to-edit text: shows read mode with Pencil, edit mode with input.
 */
export function TRNInlineEdit(props: TRNInlineEditProps) {
  const {
    value: controlled,
    defaultValue = "",
    onCommit,
    onCancel,
    disabled = false,
    placeholder = "…",
    className = "",
    inputClassName = "",
    multiline = false,
    validate,
  } = props;
  const isControlled = controlled != null;
  const [internal, setInternal] = useState(defaultValue);
  const text = isControlled ? (controlled as string) : internal;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(text);
    }
  }, [editing, text]);

  const commit = useCallback(() => {
    if (validate) {
      const v = validate(draft);
      if (v !== true) {
        setErr(v);
        return;
      }
    }
    setErr(null);
    if (!isControlled) {
      setInternal(draft);
    }
    onCommit(draft);
    setEditing(false);
  }, [draft, isControlled, onCommit, validate]);

  const cancel = useCallback(() => {
    setErr(null);
    setDraft(text);
    setEditing(false);
    onCancel?.();
  }, [onCancel, text]);

  if (editing) {
    const inputProps: InputHTMLAttributes<HTMLInputElement> &
      TextareaHTMLAttributes<HTMLTextAreaElement> = {
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      },
      className:
        "w-full min-w-0 bg-zinc-900/70 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-100 " +
        inputClassName,
      disabled,
      placeholder,
    };
    return (
      <div className={"flex flex-col gap-1 w-full " + className}>
        <div className="flex items-start gap-1 w-full">
          {multiline ? (
            <textarea
              rows={3}
              {...inputProps}
              className={inputProps.className}
            />
          ) : (
            <input type="text" {...inputProps} />
          )}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              className="p-1 rounded border border-zinc-700/80 hover:bg-zinc-800/70"
              onClick={commit}
              aria-label="Save"
              title="Save (Enter)"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            </button>
            <button
              type="button"
              className="p-1 rounded border border-zinc-700/80 hover:bg-zinc-800/70"
              onClick={cancel}
              aria-label="Cancel"
              title="Cancel (Esc)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {err != null && err.length > 0 ? (
          <p className="text-[10px] text-rose-400 w-full">{err}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        "inline-flex max-w-full items-center gap-1.5 text-xs " + className
      }
    >
      <span className="truncate min-w-0 text-zinc-100">
        {text || (
          <span className="text-zinc-400">{placeholder}</span>
        )}
      </span>
      <button
        type="button"
        className="p-0.5 rounded border border-zinc-700/80 hover:bg-zinc-800/70 disabled:opacity-50"
        onClick={() => {
          if (!disabled) {
            setEditing(true);
            setDraft(text);
          }
        }}
        disabled={disabled}
        aria-label="Edit"
      >
        <Pencil className="h-3 w-3 text-zinc-400" />
      </button>
    </div>
  );
}
