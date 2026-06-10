import type { CanvasMemo } from "../../types/canvas";

const COLS = ["left", "center", "right"] as const;
const ROWS = ["top", "middle", "bottom"] as const;

export function describeMemoPosition(x: number, y: number): string {
  const col = COLS[Math.min(2, Math.max(0, Math.floor(x * 3)))];
  const row = ROWS[Math.min(2, Math.max(0, Math.floor(y * 3)))];
  const region = row === "middle" && col === "center" ? "center" : `${row} ${col}`;
  return `${region} area (x: ${Math.round(x * 100)}%, y: ${Math.round(y * 100)}% from top-left)`;
}

export function buildMemoEditInstructions(memos: CanvasMemo[]): string {
  const entries = memos
    .map((memo) => ({ ...memo, text: memo.text.trim() }))
    .filter((memo) => memo.text.length > 0);
  if (entries.length === 0) return "";
  return [
    "Apply the following annotation instructions at the specified image locations (percentages are relative to image width and height):",
    ...entries.map((memo, index) => `${index + 1}. At the ${describeMemoPosition(memo.x, memo.y)}: ${memo.text}`),
    "Do not render any annotation text, sticky notes, boxes, arrows, or markup in the output image.",
  ].join("\n");
}
