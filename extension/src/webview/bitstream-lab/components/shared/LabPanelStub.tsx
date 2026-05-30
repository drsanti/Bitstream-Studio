/*******************************************************************************
 * File Name : LabPanelStub.tsx
 *
 * Description : Placeholder workbench panel until a pane is implemented.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

type Props = {
  title: string;
  phase?: string;
};

export function LabPanelStub(props: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-medium text-zinc-300">{props.title}</p>
      <p className="mt-2 max-w-sm text-xs text-zinc-500">
        {props.phase ?? "Planned in a later phase."} See{" "}
        <code className="rounded bg-zinc-900 px-1 text-zinc-400">bitstream-lab/docs/</code>.
      </p>
    </div>
  );
}
