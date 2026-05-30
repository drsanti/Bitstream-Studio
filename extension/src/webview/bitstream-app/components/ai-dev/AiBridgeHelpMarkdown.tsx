import helpMd from "./AI_BRIDGE_HELP.md?raw";
import { TRNMarkdownRenderer } from "../../../ui/TRN/TRNMarkdownRenderer.js";

export function AiBridgeHelpMarkdown() {
  return <TRNMarkdownRenderer markdown={helpMd} tone="info" />;
}

