import React from 'react';
import { Button } from '../../ui/components/Button';

export interface ModelCatalogButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ModelCatalogButton({
  children,
  className = '',
  ...rest
}: ModelCatalogButtonProps) {
  return (
    <Button
      variant="secondary"
      className={`inline-flex items-center gap-1.5 border border-gray-400/35 bg-slate-700/30 backdrop-blur-md px-2.5 py-1 text-[11px] text-white shadow-sm shadow-black/20 hover:bg-slate-600/35 ${className}`}
      {...rest}
    >
      {children}
    </Button>
  );
}
