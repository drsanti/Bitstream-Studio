import type { ReactNode } from "react";
import { Box, File, FileJson, Image as ImageIcon, type LucideIcon } from "lucide-react";
import type { FreeAssetKind } from "./freeAssetKind";

const KIND_META: Record<
  FreeAssetKind,
  { label: string; Icon: LucideIcon; className: string }
> = {
  model: {
    label: "Model",
    Icon: Box,
    className:
      "border-emerald-500/35 bg-emerald-950/40 text-emerald-200/90",
  },
  texture: {
    label: "Texture",
    Icon: ImageIcon,
    className: "border-violet-500/35 bg-violet-950/40 text-violet-200/90",
  },
  data: {
    label: "Data",
    Icon: FileJson,
    className: "border-sky-500/35 bg-sky-950/40 text-sky-200/90",
  },
  other: {
    label: "File",
    Icon: File,
    className: "border-zinc-600/80 bg-zinc-900/80 text-zinc-300",
  },
};

export function FreeAssetKindBadge(props: { kind: FreeAssetKind }): ReactNode {
  const { kind } = props;
  const meta = KIND_META[kind];
  const Icon = meta.Icon;
  return (
    <span
      className={
        "inline-flex max-w-[6.5rem] items-center gap-1 rounded border px-1.5 py-0.5 " +
        "text-[10px] font-semibold leading-none tracking-wide " +
        meta.className
      }
    >
      <Icon className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
      {meta.label}
    </span>
  );
}
