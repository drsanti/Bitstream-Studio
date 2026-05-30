import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

export type TRNContainerMode = "fill-parent" | "fit-content";
export type TRNContainerDirection = "row" | "column";
export type TRNLayoutType = "flex" | "grid" | "wrap" | "stack";
export type TRNGap = "0" | "1" | "2" | "3" | "4" | "6" | "8";

export type TRNContainerProps = HTMLAttributes<HTMLDivElement> & {
  mode?: TRNContainerMode;
  layout?: TRNLayoutType;
  direction?: TRNContainerDirection;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: TRNGap;
  scroll?: "none" | "x" | "y" | "both";
};

export const TRNContainer = forwardRef<HTMLDivElement, TRNContainerProps>(function TRNContainer(props, ref) {
  const {
    className,
    children,
    mode = "fill-parent",
    layout = "flex",
    direction = "column",
    cols = 2,
    gap = "2",
    scroll = "none",
    ...divProps
  } = props;

  const modeClass = mode === "fill-parent" ? "w-full h-full min-h-0 flex-1" : "w-fit h-fit";

  const gapClassMap: Record<TRNGap, string> = {
    "0": "gap-0",
    "1": "gap-1",
    "2": "gap-2",
    "3": "gap-3",
    "4": "gap-4",
    "6": "gap-6",
    "8": "gap-8",
  };

  const colsClassMap: Record<NonNullable<TRNContainerProps["cols"]>, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    6: "grid-cols-6",
    12: "grid-cols-12",
  };

  let layoutClass = "flex";
  if (layout === "grid") {
    layoutClass = `grid ${colsClassMap[cols]}`;
  } else if (layout === "wrap") {
    layoutClass = `flex ${direction === "row" ? "flex-row" : "flex-col"} flex-wrap`;
  } else if (layout === "stack") {
    layoutClass = "flex flex-col";
  } else {
    layoutClass = `flex ${direction === "row" ? "flex-row" : "flex-col"}`;
  }

  let scrollClass = "overflow-visible";
  if (scroll === "y") {
    scrollClass = "overflow-y-auto";
  } else if (scroll === "x") {
    scrollClass = "overflow-x-auto";
  } else if (scroll === "both") {
    scrollClass = "overflow-auto";
  }

  const mergedClassName = [modeClass, layoutClass, gapClassMap[gap], scrollClass, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={mergedClassName} {...divProps}>
      {children}
    </div>
  );
});

/*
Usage examples:

1) Fill parent + vertical stack + y-scroll
<TRNLayoutContainer mode="fill-parent" layout="stack" gap="2" scroll="y" className="border border-zinc-700/80">
  <div>Header</div>
  <div>Body</div>
</TRNLayoutContainer>

2) Grid cards (3 columns)
<TRNLayoutContainer layout="grid" cols={3} gap="4" className="w-full">
  <div>Card A</div>
  <div>Card B</div>
  <div>Card C</div>
</TRNLayoutContainer>

3) Horizontal wrap chips
<TRNLayoutContainer layout="wrap" direction="row" gap="2">
  <span>chip-1</span>
  <span>chip-2</span>
  <span>chip-3</span>
</TRNLayoutContainer>

4) Flex row split
<TRNLayoutContainer layout="flex" direction="row" className="justify-between items-center">
  <div>Left</div>
  <div>Right</div>
</TRNLayoutContainer>
*/
