import { memo } from 'react';
import { PictureInPicture2 } from 'lucide-react';

/** Shown while dragging a pane outside the workbench — release to float. */
export const WorkbenchFloatDetachHint = memo(function WorkbenchFloatDetachHint({
  visible,
}: {
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[254] flex items-center justify-center bg-violet-500/10">
      <div className="flex items-center gap-2 rounded-lg border border-violet-400/50 bg-black/70 px-4 py-2 shadow-xl">
        <PictureInPicture2 size={16} className="text-violet-300" aria-hidden />
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-violet-200">
          Release to float pane
        </span>
      </div>
    </div>
  );
});
