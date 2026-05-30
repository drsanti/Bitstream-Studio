/*******************************************************************************
 * File Name : PortAdminCopyButton.tsx
 *
 * Description : Copy-to-clipboard control for Port Admin detail rows.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "react-toastify";
import { writeClipboardText } from "../../ui/utils/clipboard.js";

export function PortAdminCopyButton(props: { value: string; label: string })
{
  const { value, label } = props;
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(async () =>
  {
    const ok = await writeClipboardText(value);
    if (!ok)
    {
      toast.error(`Could not copy ${label}`);
      return;
    }
    setCopied(true);
    if (resetRef.current != null)
    {
      clearTimeout(resetRef.current);
    }
    resetRef.current = setTimeout(() => {
      setCopied(false);
      resetRef.current = null;
    }, 1500);
  }, [label, value]);

  useEffect(() => () => {
    if (resetRef.current != null)
    {
      clearTimeout(resetRef.current);
    }
  }, []);

  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-0.5 rounded border border-zinc-600/60 bg-zinc-900/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
      onClick={() => void onCopy()}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? "Copied" : "Copy"}
    >
      <Copy className="h-3 w-3" aria-hidden />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
