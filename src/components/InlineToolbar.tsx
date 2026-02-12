"use client";

import React from "react";
import { clamp } from "@/lib/dom";

type Props = { x: number; y: number };

function exec(cmd: string) {
  try {
    document.execCommand(cmd);
  } catch {
    // execCommand is deprecated but fine for prototype
  }
}

export default function InlineToolbar({ x, y }: Props) {
  // Center toolbar over x, place at y
  const width = 200;
  const left = clamp(x - width / 2, 12, window.innerWidth - width - 12);
  const top = clamp(y - 44, 12, window.innerHeight - 60);

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white px-2 py-2 shadow-soft"
      style={{ left, top, width }}
    >
      <button
        type="button"
        className="rounded-xl px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("bold")}
        title="Bold"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        className="rounded-xl px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("italic")}
        title="Italic"
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        className="rounded-xl px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("insertHTML")}
        title="Inline code (prototype)"
      >
        <span className="font-mono">{`</>`}</span>
      </button>
      <div className="mx-1 h-6 w-px bg-neutral-200" />
      <div className="text-xs text-neutral-500">Formatting</div>
    </div>
  );
}
