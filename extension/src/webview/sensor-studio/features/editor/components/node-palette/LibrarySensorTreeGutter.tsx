import type { SensorFamilyTreeGutterRole, SensorFamilyTreeLayout } from "./sensor-family-tree-layout";
import { treeGutterWidthClass } from "./sensor-family-tree-layout";

type LibrarySensorTreeGutterProps = {
  role: SensorFamilyTreeGutterRole;
  layout: SensorFamilyTreeLayout;
  dense?: boolean;
};

const LINE = "bg-zinc-700/40";

/** Vertical / branch guides for grouped sensor family rows (no boxes — lines only). */
export function LibrarySensorTreeGutter(props: LibrarySensorTreeGutterProps) {
  const { role, layout, dense = true } = props;
  const widthClass = treeGutterWidthClass(layout, dense);

  if (role === "header-root") {
    return null;
  }

  if (role === "root") {
    return (
      <span
        className={`relative mr-0.5 flex shrink-0 self-stretch ${widthClass}`}
        aria-hidden
      >
        <span className={`absolute bottom-0 left-1/2 top-[55%] w-px -translate-x-1/2 ${LINE}`} />
        <span
          className={`absolute left-1/2 top-[55%] size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${LINE} ring-2 ring-zinc-950/80`}
        />
      </span>
    );
  }

  const isLast = role === "tap-last";

  return (
    <span
      className={`relative mr-0.5 flex shrink-0 self-stretch ${widthClass}`}
      aria-hidden
    >
      <span
        className={`absolute left-1/2 w-px -translate-x-1/2 ${LINE} ${
          isLast ? "top-0 h-[calc(50%+1px)]" : "top-0 bottom-0"
        }`}
      />
      <span className={`absolute left-1/2 top-1/2 h-px w-full -translate-y-1/2 ${LINE}`} />
    </span>
  );
}
