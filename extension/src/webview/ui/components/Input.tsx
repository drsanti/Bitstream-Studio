import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  className?: string;
  inputClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  className,
  inputClassName,
  id,
  ...rest
}) => {
  const inputId = id ?? (label ? `input-${label.replace(/\s/g, "-")}` : undefined);
  return (
    <div className={clsx("flex flex-col", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm text-gray-400 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={twMerge(
          "px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none",
          inputClassName
        )}
        {...rest}
      />
    </div>
  );
};
