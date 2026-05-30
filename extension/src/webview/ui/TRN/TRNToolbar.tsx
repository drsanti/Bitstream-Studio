import type { HTMLAttributes, ReactNode } from "react";

export type TRNToolbarProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  density?: "sm" | "md";
  tone?: "default" | "subtle";
  sticky?: boolean;
  stickyTop?: number;
  wrap?: boolean;
};

export type TRNToolbarGroupProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  align?: "start" | "center" | "end";
  gap?: "xs" | "sm" | "md";
};

export type TRNToolbarSpacerProps = HTMLAttributes<HTMLDivElement>;

export type TRNToolbarDividerProps = HTMLAttributes<HTMLDivElement> & {
  vertical?: boolean;
};

export function TRNToolbar(props: TRNToolbarProps) {
  const {
    children,
    className = "",
    density = "md",
    tone = "subtle",
    sticky = false,
    stickyTop = 0,
    wrap = true,
    style,
    ...divProps
  } = props;

  const densityClass = density === "sm" ? "min-h-8 px-2 py-1" : "min-h-9 px-2.5 py-1.5";
  const toneClass =
    tone === "default"
      ? "border border-zinc-700/80 bg-zinc-950/95"
      : "border border-zinc-700/80 bg-zinc-900/80";
  const wrapClass = wrap ? "flex-wrap" : "flex-nowrap";
  const stickyClass = sticky ? "sticky z-10" : "";

  return (
    <div
      className={
        "flex w-full items-center gap-2 rounded-md " +
        densityClass +
        " " +
        toneClass +
        " " +
        wrapClass +
        " " +
        stickyClass +
        (className.length > 0 ? ` ${className}` : "")
      }
      style={{
        top: sticky ? stickyTop : undefined,
        ...style,
      }}
      {...divProps}
    >
      {children}
    </div>
  );
}

export function TRNToolbarGroup(props: TRNToolbarGroupProps) {
  const { children, align = "start", gap = "sm", className = "", ...divProps } = props;
  const gapClass = gap === "xs" ? "gap-1" : gap === "md" ? "gap-3" : "gap-2";
  const alignClass = align === "end" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <div
      className={
        "inline-flex min-w-0 items-center " +
        gapClass +
        " " +
        alignClass +
        (className.length > 0 ? ` ${className}` : "")
      }
      {...divProps}
    >
      {children}
    </div>
  );
}

export function TRNToolbarSpacer(props: TRNToolbarSpacerProps) {
  const { className = "", ...divProps } = props;
  return <div className={"min-w-2 flex-1 " + className} {...divProps} />;
}

export function TRNToolbarDivider(props: TRNToolbarDividerProps) {
  const { vertical = true, className = "", ...divProps } = props;
  return (
    <div className={(vertical ? "h-5 w-px" : "h-px w-full") + " shrink-0 bg-zinc-700/80 " + className} {...divProps} />
  );
}
