"use client";

import React from "react";
import type { Block, BlockType, Doc } from "@/lib/blocks";
import { labelForType, newBlock, seedDoc } from "@/lib/blocks";
import { clearDoc, loadDoc, saveDoc } from "@/lib/storage";
import { ensureAtLeastOneBlock } from "@/lib/keymap";
import BlockView from "./BlockView";
import SlashMenu, { SlashCommand } from "./SlashMenu";
import InlineToolbar from "./InlineToolbar";
import { clamp, getSelectionRect } from "@/lib/dom";

type SlashState =
  | { open: false }
  | { open: true; blockId: string; query: string; x: number; y: number; activeIndex: number };

export default function Editor() {
  const [doc, setDoc] = React.useState<Doc>(() => seedDoc());
  const [slash, setSlash] = React.useState<SlashState>({ open: false });
  const [toolbar, setToolbar] = React.useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });

  const blockRefs = React.useRef(new Map<string, HTMLDivElement | null>());

  // Load saved
  React.useEffect(() => {
    const saved = loadDoc();
    if (saved) setDoc({ ...saved, blocks: ensureAtLeastOneBlock(saved.blocks) });
  }, []);

  // Save on changes (debounced)
  React.useEffect(() => {
    const t = window.setTimeout(() => saveDoc(doc), 250);
    return () => window.clearTimeout(t);
  }, [doc]);

  // Selection → inline toolbar
  React.useEffect(() => {
    const onSelectionChange = () => {
      const rect = getSelectionRect();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !rect) {
        setToolbar((p) => (p.open ? { ...p, open: false } : p));
        return;
      }
      // place toolbar above selection
      const x = rect.left + rect.width / 2;
      const y = rect.top - 10;
      setToolbar({ open: true, x, y });
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const actions = React.useMemo(() => {
    return {
      setTitle: (t: string) => setDoc((d) => ({ ...d, title: t })),
      setBlockText: (id: string, text: string) =>
        setDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, text } : b)) })),
      setBlockType: (id: string, type: BlockType) =>
        setDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, type } : b)) })),
      insertBlockAfter: (afterId: string, type: BlockType = "p") => {
        const id = crypto.randomUUID ? crypto.randomUUID() : newBlock(type).id;
        setDoc((d) => {
          const idx = d.blocks.findIndex((b) => b.id === afterId);
          const nb: Block = { id, type, text: "" };
          const next = [...d.blocks];
          next.splice(idx + 1, 0, nb);
          return { ...d, blocks: next };
        });
        return id;
      },
      removeBlock: (id: string) => {
        setDoc((d) => {
          const next = d.blocks.filter((b) => b.id !== id);
          return { ...d, blocks: ensureAtLeastOneBlock(next) };
        });
      },
      focusBlock: (id: string, caret: "start" | "end" = "end") => {
        const el = blockRefs.current.get(id);
        if (!el) return;
        el.focus();

        // Place caret at start/end
        requestAnimationFrame(() => {
          const selection = window.getSelection();
          if (!selection) return;

          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(caret === "start");

          selection.removeAllRanges();
          selection.addRange(range);
        });
      }
    };
  }, []);

  const openSlashMenu = React.useCallback((blockId: string, query: string) => {
    const el = blockRefs.current.get(blockId);
    const rect = el?.getBoundingClientRect();
    const x = rect ? rect.left + 80 : window.innerWidth / 2;
    const y = rect ? rect.top + 36 : window.innerHeight / 2;

    setSlash({ open: true, blockId, query, x, y, activeIndex: 0 });
  }, []);

  const closeSlashMenu = React.useCallback(() => setSlash({ open: false }), []);

  const commands: SlashCommand[] = React.useMemo(
    () => [
      { id: "text", label: "Text", hint: "Start writing with plain text", type: "p" },
      { id: "h1", label: "Heading 1", hint: "Big section heading", type: "h1" },
      { id: "h2", label: "Heading 2", hint: "Medium section heading", type: "h2" },
      { id: "ul", label: "Bulleted list", hint: "Create a bullet list", type: "ul" },
      { id: "ol", label: "Numbered list", hint: "Create a numbered list", type: "ol" },
      { id: "code", label: "Code", hint: "Insert a code block", type: "code" }
    ],
    []
  );

  const filtered = React.useMemo(() => {
    if (!slash.open) return [];
    const q = slash.query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.type.includes(q));
  }, [slash, commands]);

  const applyCommand = React.useCallback(
    (cmd: SlashCommand) => {
      if (!slash.open) return;
      actions.setBlockType(slash.blockId, cmd.type);

      // If the block text contains a leading slash command fragment, strip it.
      setDoc((d) => ({
        ...d,
        blocks: d.blocks.map((b) => {
          if (b.id !== slash.blockId) return b;
          const cleaned = b.text.replace(/^\/\S*\s?/, "");
          return { ...b, text: cleaned };
        })
      }));

      closeSlashMenu();
      actions.focusBlock(slash.blockId, "end");
    },
    [slash, actions, closeSlashMenu]
  );

  // Keyboard navigation for slash menu when it is open
  React.useEffect(() => {
    if (!slash.open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!slash.open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeSlashMenu();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlash((s) => (s.open ? { ...s, activeIndex: clamp(s.activeIndex + 1, 0, Math.max(0, filtered.length - 1)) } : s));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlash((s) => (s.open ? { ...s, activeIndex: clamp(s.activeIndex - 1, 0, Math.max(0, filtered.length - 1)) } : s));
        return;
      }
      if (e.key === "Enter") {
        const idx = slash.activeIndex;
        const cmd = filtered[idx];
        if (cmd) {
          e.preventDefault();
          applyCommand(cmd);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [slash, filtered, applyCommand, closeSlashMenu]);

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="mb-10 flex items-center justify-between">
        <div className="text-sm text-neutral-500">
          Prototype: <span className="text-neutral-700">{labelForType("p")}</span> blocks + slash commands
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            onClick={() => {
              clearDoc();
              setDoc(seedDoc());
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        className="editor-title w-full bg-transparent outline-none placeholder:text-neutral-300"
        value={doc.title}
        placeholder="Untitled"
        onChange={(e) => actions.setTitle(e.target.value)}
      />

      {/* Blocks */}
      <div className="mt-6">
        {doc.blocks.map((b) => (
          <BlockView
            key={b.id}
            block={b}
            allBlocks={doc.blocks}
            onRef={(el) => blockRefs.current.set(b.id, el)}
            setText={(text) => actions.setBlockText(b.id, text)}
            insertAfter={() => {
              const newId = actions.insertBlockAfter(b.id, "p");
              actions.focusBlock(newId, "start");
            }}
            remove={() => actions.removeBlock(b.id)}
            focus={(id, caret) => actions.focusBlock(id, caret)}
            openSlash={(query) => openSlashMenu(b.id, query)}
            closeSlash={closeSlashMenu}
            slashOpen={slash.open && slash.blockId === b.id}
            setSlashQuery={(q) => setSlash((s) => (s.open ? { ...s, query: q, activeIndex: 0 } : s))}
            state={{ title: doc.title, blocks: doc.blocks }}
            actions={actions}
          />
        ))}
      </div>

      {/* Slash menu */}
      {slash.open && (
        <SlashMenu
          x={slash.x}
          y={slash.y}
          query={slash.query}
          commands={filtered}
          activeIndex={slash.activeIndex}
          onHoverIndex={(i) => setSlash((s) => (s.open ? { ...s, activeIndex: i } : s))}
          onPick={applyCommand}
          onClose={closeSlashMenu}
        />
      )}

      {/* Inline toolbar */}
      {toolbar.open && <InlineToolbar x={toolbar.x} y={toolbar.y} />}
    </div>
  );
}
