/*******************************************************************************
 * File Name : JsonBlock.tsx
 *
 * Description : Scrollable monospace JSON block for tap detail pane.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

type Props = {
  value: unknown;
  className?: string;
};

export function JsonBlock(props: Props) {
  let text = "—";
  try
  {
    text =
      props.value !== undefined && props.value !== null
        ? JSON.stringify(props.value, null, 2)
        : "—";
  }
  catch
  {
    text = String(props.value);
  }

  return (
    <pre
      className={`scrollbar-dark-micro min-h-0 flex-1 overflow-auto rounded-md border border-zinc-800 bg-zinc-950/80 p-2 font-mono text-[11px] leading-relaxed text-zinc-300 ${props.className ?? ""}`}
    >
      {text}
    </pre>
  );
}
