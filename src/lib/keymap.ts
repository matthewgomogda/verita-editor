import type { Block, BlockType } from "./blocks";
import { isCode, newBlock } from "./blocks";

export type EditorState = {
  title: string;
  blocks: Block[];
};

export type EditorActions = {
  setTitle: (t: string) => void;
  setBlockText: (id: string, text: string) => void;
  setBlockType: (id: string, type: BlockType) => void;
  insertBlockAfter: (afterId: string, type?: BlockType) => string; // returns new id
  removeBlock: (id: string) => void;
  focusBlock: (id: string, caret?: "start" | "end") => void;
};

export type KeyHandlersArgs = {
  e: React.KeyboardEvent<HTMLElement>;
  block: Block;
  state: EditorState;
  actions: EditorActions;
  openSlashMenu: (blockId: string, query: string) => void;
  closeSlashMenu: () => void;
  isSlashOpen: boolean;
};

export function handleBlockKeyDown(args: KeyHandlersArgs) {
  const { e, block, state, actions, openSlashMenu, closeSlashMenu, isSlashOpen } = args;

  // Escape closes slash menu (if open)
  if (e.key === "Escape" && isSlashOpen) {
    e.preventDefault();
    closeSlashMenu();
    return;
  }

  // Slash menu: open on "/" (we still let the "/" be typed; the BlockView will parse it out)
  // We'll open it on keydown for immediacy, but not prevent default.
  if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    openSlashMenu(block.id, "");
    return;
  }

  // Enter: create new block (except Shift+Enter inside code to insert newline)
  if (e.key === "Enter" && !e.isComposing) {
    if (isCode(block.type) && e.shiftKey) {
      // allow newline inside code
      return;
    }
    e.preventDefault();
    closeSlashMenu();

    const newId = actions.insertBlockAfter(block.id, "p");
    actions.focusBlock(newId, "start");
    return;
  }

  // Backspace on empty: remove block and move focus
  if (e.key === "Backspace" && !e.isComposing) {
    const text = (block.text ?? "").replace(/\u00A0/g, " ").trim();
    const isEmpty = text.length === 0;

    if (isEmpty) {
      e.preventDefault();
      closeSlashMenu();

      const idx = state.blocks.findIndex((b) => b.id === block.id);
      const prev = idx > 0 ? state.blocks[idx - 1] : null;
      const next = idx < state.blocks.length - 1 ? state.blocks[idx + 1] : null;

      actions.removeBlock(block.id);

      const focusTarget = prev?.id ?? next?.id ?? null;
      if (focusTarget) actions.focusBlock(focusTarget, "end");
      return;
    }
  }

  // Arrow navigation between blocks when caret at boundaries is hard without deep selection logic.
  // For prototype: only handle Up/Down when the current block is empty.
  if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.isComposing) {
    const text = (block.text ?? "").replace(/\u00A0/g, " ").trim();
    if (text.length === 0) {
      const idx = state.blocks.findIndex((b) => b.id === block.id);
      if (e.key === "ArrowUp" && idx > 0) {
        e.preventDefault();
        actions.focusBlock(state.blocks[idx - 1].id, "end");
        return;
      }
      if (e.key === "ArrowDown" && idx < state.blocks.length - 1) {
        e.preventDefault();
        actions.focusBlock(state.blocks[idx + 1].id, "start");
        return;
      }
    }
  }
}

/**
 * Helper: create an initial document state that is never empty.
 */
export function ensureAtLeastOneBlock(blocks: Block[]) {
  if (blocks.length > 0) return blocks;
  return [newBlock("p", "")];
}
