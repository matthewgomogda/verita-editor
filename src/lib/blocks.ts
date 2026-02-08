import { v4 as uuidv4 } from "uuid";

export type BlockType = "p" | "h1" | "h2" | "ul" | "ol" | "code";

export type Block = {
  id: string;
  type: BlockType;
  /**
   * For simplicity we store plain text.
   * Lists are represented as multiple lines in one block.
   * Code blocks also use multi-line text.
   */
  text: string;
};

export type Doc = {
  title: string;
  blocks: Block[];
};

export function newBlock(type: BlockType = "p", text = ""): Block {
  return { id: uuidv4(), type, text };
}

export function seedDoc(): Doc {
  return {
    title: "Untitled",
    blocks: [
      newBlock("p", "Type / to insert blocks. Hover left gutter for controls."),
      newBlock("h2", "Keyboard"),
      newBlock("ul", "Enter → new block\nBackspace on empty → remove\nArrow keys → move between blocks"),
      newBlock("code", "function hello() {\n  return 'world'\n}")
    ]
  };
}

export function labelForType(t: BlockType): string {
  switch (t) {
    case "p":
      return "Text";
    case "h1":
      return "Heading 1";
    case "h2":
      return "Heading 2";
    case "ul":
      return "Bulleted list";
    case "ol":
      return "Numbered list";
    case "code":
      return "Code";
  }
}

export function isList(t: BlockType) {
  return t === "ul" || t === "ol";
}

export function isCode(t: BlockType) {
  return t === "code";
}
