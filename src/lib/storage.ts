import type { Doc } from "./blocks";

const KEY = "verita_editor_doc_v1";

export function loadDoc(): Doc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Doc;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.blocks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDoc(doc: Doc) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(doc));
  } catch {
    // ignore quota/errors for prototype
  }
}

export function clearDoc() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
