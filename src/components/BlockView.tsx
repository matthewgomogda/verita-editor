"use client";

import React from "react";
import type { Block } from "@/lib/blocks";
import { isList, isCode } from "@/lib/blocks";
import { handleBlockKeyDown, type EditorActions, type EditorState } from "@/lib/keymap";

type Props = {
  block: Block;
  allBlocks: Block[];
  onRef: (el: HTMLDivElement | null) => void;

  setText: (text: string) => void;
  insertAfter: () => void;
  remove: () => void;

  focus: (id: string, caret?: "start" | "end") => void;

  openSlash: (query: string) => void;
  closeSlash: () => void;
  slashOpen: boolean;
  setSlashQuery: (q: string) => void;

  state: EditorState;
  actions: EditorActions;
};

export default function BlockView(props: Props) {
  const { block, onRef, setText, insertAfter, openSlash, closeSlash, slashOpen, setSlashQuery, state, actions } = props;
  const [hover, setHover] = React.useState(false);

  const isEmpty = (block.text ?? "").trim().length === 0;

  // Render list lines if list
  const renderDisplayText = () => {
    // We edit in contentEditable (plain text), so display and edit are same.
    // Keeping this for clarity/extensibility.
    return block.text;
  };

  const classes = React.useMemo(() => {
    const base =
      "notion-text relative rounded-xl px-3 py-[var(--block-py)] outline-none focus:bg-neutral-50/60";
    if (block.type === "h1") return base + " text-[30px] font-[720] leading-[1.2] tracking-[-0.01em]";
    if (block.type === "h2") return base + " text-[22px] font-[700] leading-[1.25] tracking-[-0.01em]";
    if (block.type === "code")
      return (
        base +
        " font-mono text-[13px] leading-[1.6] bg-neutral-50 border border-neutral-200"
      );
    return base;
  }, [block.type]);

  return (
    <div
      className="group relative flex"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Left gutter controls */}
      <div className="w-[var(--gutter)] shrink-0">
        <div className="relative h-full">
          <div
            className={[
              "absolute left-2 top-3 flex items-center gap-2 transition-opacity",
              hover ? "opacity-100" : "opacity-0"
            ].join(" ")}
          >
            {/* Handle */}
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
              title="Handle (prototype)"
              onClick={() => {
                // No DnD in starter, but this is the affordance
              }}
            >
              <span className="text-neutral-500">⋮⋮</span>
            </button>

            {/* Insert */}
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
              title="Insert block"
              onClick={insertAfter}
            >
              <span className="text-neutral-500">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editable block */}
      <div className="flex-1">
        <div
          ref={onRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className={classes}
          data-block-id={block.id}
          data-block-type={block.type}
          onInput={(e) => {
            const text = (e.currentTarget.textContent ?? "").replace(/\u00A0/g, " ");
            setText(text);

            // If slash menu is open for this block, update query based on leading "/..."
            // We treat "/something" at the start as query, until first space.
            if (slashOpen) {
              const m = text.match(/^\/(\S*)/);
              setSlashQuery(m ? m[1] : "");
            } else {
              // If user types "/" at beginning, open menu and seed query.
              const m = text.match(/^\/(\S*)/);
              if (m) {
                openSlash(m[1] ?? "");
              }
            }
          }}
          onKeyDown={(e) =>
            handleBlockKeyDown({
              e,
              block,
              state,
              actions,
              openSlashMenu: (_blockId, q) => openSlash(q),
              closeSlashMenu: closeSlash,
              isSlashOpen: slashOpen
            })
          }
          onFocus={() => {
            // When focusing an empty block, keep it visibly clickable (contentEditable can collapse)
            if (isEmpty) {
              // no-op; placeholder handled with CSS below
            }
          }}
        >
          {renderDisplayText()}
        </div>

        {/* Placeholder for empty blocks */}
        {isEmpty && (
          <div className="pointer-events-none -mt-[34px] px-3 py-[var(--block-py)] text-neutral-300">
            {block.type === "h1"
              ? "Heading 1"
              : block.type === "h2"
              ? "Heading 2"
              : isList(block.type)
              ? "List"
              : isCode(block.type)
              ? "Code"
              : "Type '/' for commands"}
          </div>
        )}
      </div>
    </div>
  );
}
