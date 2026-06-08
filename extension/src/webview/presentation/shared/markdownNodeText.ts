import { isValidElement, type ReactNode } from "react";

export function markdownNodeToPlainText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string") {
    return node;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(markdownNodeToPlainText).join("");
  }
  if (isValidElement(node)) {
    return markdownNodeToPlainText(node.props.children as ReactNode);
  }
  return "";
}
