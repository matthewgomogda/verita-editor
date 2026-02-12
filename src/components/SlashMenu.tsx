"use client";

import React from "react";
import type { BlockType } from "@/lib/blocks";

export type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  type: BlockType;
};

type Props = {
  x: number;
  y: number;
  query: string;
  commands: SlashCommand[];
  activeIndex: number;
  onHoverIndex: (i: number) => void;
  onPick: (cmd: SlashCommand) => void;
  onClose: () => void;
};

export default function SlashMenu(props: Props) {
  const { x, y, query, commands, activeIndex, onHoverIndex, onPick, onClose } = props;

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // close if clicking outside
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-slash-menu='true']")) return;
      onClose();
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div
      data-slash-menu="true"
      className="fixed z-50 w-[360px] rounded-2xl border border-neutral-200 bg-white shadow-soft"
      style={{ left: Math.max(16, x), top: Math.max(16, y) }}
    >
      <div className="border-b border-neutral-100 px-4 py-3">
        <div className="text-xs text-neutral-500">Commands</div>
        <div className="mt-1 text-sm text-neutral-700">
          <span className="text-neutral-400">/</span>
          {query || <span className="text-neutral-400">type to filter</span>}
        </div>
      </div>

      <div className="max-h-[280px] overflow-auto p-2">
        {commands.length === 0 ? (
          <div className="px-3 py-6 text-sm text-neutral-500">No matches</div>
        ) : (
          commands.map((c, idx) => (
            <button
              key={c.id}
              className={[
                "flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left",
                idx === activeIndex ? "bg-neutral-100" : "hover:bg-neutral-50"
              ].join(" ")}
              onMouseEnter={() => onHoverIndex(idx)}
              onClick={() => onPick(c)}
              type="button"
            >
              <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 bg-white">
                <span className="text-xs text-neutral-600">{c.type.toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-neutral-800">{c.label}</div>
                <div className="text-xs text-neutral-500">{c.hint}</div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
        <span className="mr-2">↑↓</span>navigate <span className="mx-2">↵</span>select <span className="mx-2">esc</span>
        close
      </div>
    </div>
  );
}
