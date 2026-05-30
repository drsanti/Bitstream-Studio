import { createContext, useContext } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type DragHandleContextValue = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"];
  disabled: boolean;
};

const DragHandleContext = createContext<DragHandleContextValue | null>(null);

export type TRNSortableItemProps = HTMLAttributes<HTMLDivElement> & {
  id: string;
  children: ReactNode;
  disabled?: boolean;
  dragFx?: "none" | "lift" | "tilt" | "playful";
  dragFxOptions?: {
    normalizeScale?: boolean;
    liftScale?: number;
    tiltScale?: number;
    playfulScale?: number;
    tiltMaxRotateDeg?: number;
    playfulMaxRotateDeg?: number;
  };
};

export function TRNSortableItem(props: TRNSortableItemProps) {
  const {
    id,
    children,
    className,
    disabled = false,
    dragFx = "tilt",
    dragFxOptions,
    style,
    ...divProps
  } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const dragX = transform?.x ?? 0;
  const shouldNormalizeScale = dragFxOptions?.normalizeScale ?? true;
  const normalizedTransform = shouldNormalizeScale && transform
    ? {
        ...transform,
        scaleX: 1,
        scaleY: 1,
      }
    : transform;
  const baseTransform = CSS.Transform.toString(normalizedTransform);
  let fxTransform = baseTransform;
  let fxShadow = "none";
  let fxOpacity = isDragging ? 0.95 : 1;

  if (dragFx !== "none" && isDragging)
  {
    const tiltMaxRotateDeg = dragFxOptions?.tiltMaxRotateDeg ?? 3.5;
    const playfulMaxRotateDeg = dragFxOptions?.playfulMaxRotateDeg ?? 5.0;
    const liftScale = dragFxOptions?.liftScale ?? 1.02;
    const tiltScale = dragFxOptions?.tiltScale ?? 1.03;
    const playfulScale = dragFxOptions?.playfulScale ?? 1.0;
    const rotateDeg = Math.max(-tiltMaxRotateDeg, Math.min(tiltMaxRotateDeg, dragX * 0.02));
    if (dragFx === "lift")
    {
      fxTransform = `${baseTransform} scale(${liftScale})`;
      fxShadow = "0 10px 24px rgba(0, 0, 0, 0.22)";
    }
    else if (dragFx === "tilt")
    {
      fxTransform = `${baseTransform} rotate(${rotateDeg}deg) scale(${tiltScale})`;
      fxShadow = "0 12px 28px rgba(0, 0, 0, 0.26)";
    }
    else if (dragFx === "playful")
    {
      const playfulRotate = Math.max(
        -playfulMaxRotateDeg,
        Math.min(playfulMaxRotateDeg, dragX * 0.03),
      );
      fxTransform =
        playfulScale === 1
          ? `${baseTransform} rotate(${playfulRotate}deg)`
          : `${baseTransform} rotate(${playfulRotate}deg) scale(${playfulScale})`;
      fxShadow = "0 14px 34px rgba(0, 0, 0, 0.30)";
      fxOpacity = 0.97;
    }
  }

  const mergedStyle: CSSProperties = {
    ...(style ?? {}),
    transform: fxTransform,
    transition: isDragging
      ? "transform 120ms ease-out, box-shadow 120ms ease-out, opacity 120ms ease-out"
      : transition,
    boxShadow: fxShadow,
    opacity: fxOpacity,
    zIndex: isDragging ? 2 : undefined,
    transformOrigin: "center center",
    willChange: isDragging ? "transform, box-shadow, opacity" : undefined,
  };

  return (
    <DragHandleContext.Provider
      value={{
        attributes,
        listeners,
        setActivatorNodeRef,
        disabled,
      }}
    >
      <div
        ref={setNodeRef}
        style={mergedStyle}
        className={className ?? ""}
        {...divProps}
      >
        {children}
      </div>
    </DragHandleContext.Provider>
  );
}

export function useTRNDragHandleContext(): DragHandleContextValue {
  const context = useContext(DragHandleContext);
  if (context == null) {
    throw new Error("TRNDragHandle must be used inside TRNSortableItem.");
  }
  return context;
}
