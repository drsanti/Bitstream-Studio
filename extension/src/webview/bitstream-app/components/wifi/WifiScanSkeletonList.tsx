/*******************************************************************************
 * File Name        : WifiScanSkeletonList.tsx
 *
 * Description      : Placeholder rows while a Wi‑Fi scan is in progress.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.1
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

const SKELETON_GRID_CLASS =
  "grid grid-cols-[3.25rem_minmax(0,1fr)_4.25rem_2.5rem] items-center gap-x-2";

export function WifiScanSkeletonList(props: { rowCount?: number }) {
  const { rowCount = 3 } = props;

  return (
    <ul className="space-y-0 rounded-md bg-zinc-900/40 p-2" aria-hidden>
      {Array.from({ length: rowCount }, (_, idx) => (
        <li
          key={idx}
          className={`${SKELETON_GRID_CLASS} animate-pulse border-b border-zinc-800/50 py-1.5 last:border-0 last:pb-0`}
        >
          <span className="h-5 w-13 rounded-full bg-zinc-700/70" />
          <span className="h-3 min-w-0 rounded bg-zinc-700/70" />
          <span className="ml-auto h-2.5 w-17 rounded bg-zinc-800/80" />
          <span className="h-5 w-10 rounded-full bg-zinc-800/80" />
        </li>
      ))}
    </ul>
  );
}
