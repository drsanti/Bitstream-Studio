import React, { useRef, useState } from 'react';

export interface DraggableCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DraggableCard({
  title,
  children,
  className = '',
}: DraggableCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    dragRef.current = {
      active: true,
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragRef.current.active) return;
    setPosition({
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y,
    });
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    dragRef.current.active = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={`rounded-lg border border-border/50 bg-card/65 backdrop-blur-xl shadow-xl shadow-black/30 ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div
        className="cursor-move select-none border-b border-border/50 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-100"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
