export function getSelectionRect(): DOMRect | null {
  if (typeof window === "undefined") return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  // Sometimes selection rect is 0x0 if collapsed at line start; fall back to focus node
  if (rect && rect.width + rect.height > 0) return rect;

  const node = sel.focusNode as HTMLElement | null;
  if (!node) return null;

  const el = node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement | null) : (node as any);
  return el?.getBoundingClientRect() ?? null;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
