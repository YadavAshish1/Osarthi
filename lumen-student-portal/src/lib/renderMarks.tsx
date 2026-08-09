import React from "react";
import { BACKEND_URL } from "./api";

// ─── Media URL Helper ───────────────────────────────────────────────────────

/** Resolve media URL for img/video tags — handles relative backend paths */
export function mediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return BACKEND_URL ? `${BACKEND_URL}${url}` : url;
}

// ─── Block & Mark Types ─────────────────────────────────────────────────────

export interface Mark {
  start: number;
  end: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  backgroundColor?: string;
  color?: string;
}

export interface ContentBlock {
  id: string;
  type: "heading" | "paragraph" | "quote" | "list" | "image" | "video" | "divider" | "part";
  level?: number;
  text?: string;
  items?: string[];
  ordered?: boolean;
  url?: string;
  caption?: string;
  marks?: Mark[];
}

// ─── Render Marked Text (preserves color, bold, italic, etc.) ───────────────

function splitLines(text: string, keyPrefix: string): React.ReactElement[] {
  return text.split("\n").flatMap((line, i, arr) => {
    const el = <React.Fragment key={`${keyPrefix}-${i}`}>{line}</React.Fragment>;
    return i < arr.length - 1 ? [el, <br key={`${keyPrefix}-br-${i}`} />] : [el];
  });
}

// ─── Color Contrast Helpers ──────────────────────────────────────────────────

/** Returns relative luminance (0 = black, 1 = white) or null if unparseable */
function getColorLuminance(colorStr?: string): number | null {
  if (!colorStr) return null;
  const lower = colorStr.trim().toLowerCase();

  if (lower === "white" || lower === "#fff" || lower === "#ffffff") return 1.0;
  if (lower === "black" || lower === "#000" || lower === "#000000") return 0.0;
  if (lower === "transparent") return null;

  // Hex format: #fff or #ffffff
  if (lower.startsWith("#")) {
    let hex = lower.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }
    }
  }

  // RGB / RGBA format: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = lower.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  return null;
}

/** Check if color is light (luminance >= 0.75) */
function isLightColor(colorStr?: string): boolean {
  const lum = getColorLuminance(colorStr);
  return lum !== null && lum >= 0.75;
}

/** Check if background color is dark (luminance < 0.5) */
function isDarkColor(colorStr?: string): boolean {
  const lum = getColorLuminance(colorStr);
  return lum !== null && lum < 0.5;
}

export function renderMarkedText(text: string = "", marks: Mark[] = []): React.ReactNode[] {
  if (!marks?.length) {
    return splitLines(text, "plain");
  }

  // Build boundary-based segments for overlapping marks
  const boundaries = new Set([0, text.length]);
  marks.forEach((mark) => {
    boundaries.add(mark.start);
    boundaries.add(mark.end);
  });
  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

  const segments: { text: string; mark: Partial<Mark> | null; key: string }[] = [];
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    if (start >= end) continue;

    const coveringMarks = marks.filter((m) => m.start <= start && m.end >= end);
    let segmentMark: Partial<Mark> | null = null;
    if (coveringMarks.length) {
      segmentMark = coveringMarks.reduce((acc, m) => ({ ...acc, ...m }), {} as Partial<Mark>);
      delete segmentMark.start;
      delete segmentMark.end;
    }

    segments.push({ text: text.slice(start, end), mark: segmentMark, key: `seg-${start}-${end}` });
  }

  return segments.flatMap((seg) => {
    if (!seg.mark) {
      return splitLines(seg.text, seg.key);
    }
    const style: React.CSSProperties = {};
    if (seg.mark.backgroundColor) style.backgroundColor = seg.mark.backgroundColor;

    if (seg.mark.color) {
      // If text color is very light (white/near-white) and there's no dark
      // background to contrast against, override to a readable dark color
      // so it doesn't appear invisible on the white page background.
      if (isLightColor(seg.mark.color) && !isDarkColor(seg.mark.backgroundColor)) {
        style.color = "#1A1A1A";
      } else {
        style.color = seg.mark.color;
      }
    }

    return seg.text.split("\n").flatMap((line, i, arr) => {
      const classes = [
        seg.mark?.bold ? "font-bold" : "",
        seg.mark?.italic ? "italic" : "",
        seg.mark?.underline ? "underline" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const el = (
        <span key={`${seg.key}-l${i}`} style={style} className={classes || undefined}>
          {line}
        </span>
      );
      return i < arr.length - 1 ? [el, <br key={`${seg.key}-br${i}`} />] : [el];
    });
  });
}

// ─── Convert { text, marks } to HTML for ContentEditable ────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function markedTextToHtml(text: string = "", marks: Mark[] = []): string {
  if (!text) return "";
  if (!marks || marks.length === 0) {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  const boundaries = new Set([0, text.length]);
  marks.forEach((mark) => {
    boundaries.add(Math.max(0, Math.min(mark.start, text.length)));
    boundaries.add(Math.max(0, Math.min(mark.end, text.length)));
  });
  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

  const segments: string[] = [];
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    if (start >= end) continue;

    const segText = escapeHtml(text.slice(start, end)).replace(/\n/g, "<br>");
    const coveringMarks = marks.filter((m) => m.start <= start && m.end >= end);
    if (!coveringMarks.length) {
      segments.push(segText);
      continue;
    }

    const merged = coveringMarks.reduce((acc, m) => ({ ...acc, ...m }), {} as Partial<Mark>);
    let inner = segText;
    if (merged.bold) inner = `<b>${inner}</b>`;
    if (merged.italic) inner = `<i>${inner}</i>`;
    if (merged.underline) inner = `<u>${inner}</u>`;

    const styleParts: string[] = [];
    if (merged.color) styleParts.push(`color: ${merged.color}`);
    if (merged.backgroundColor) styleParts.push(`background-color: ${merged.backgroundColor}`);

    if (styleParts.length) {
      inner = `<span style="${styleParts.join("; ")}">${inner}</span>`;
    }
    segments.push(inner);
  }

  return segments.join("");
}

// ─── Convert ContentEditable DOM tree back to clean { text, marks } ─────────

export function domToMarkedText(root: HTMLElement): { text: string; marks: Mark[] } {
  let fullText = "";
  const marks: Mark[] = [];

  function traverse(node: Node, activeStyles: Partial<Mark>) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nodeText = (node.textContent || "").replace(/\u200B/g, "");
      if (!nodeText) return;
      const start = fullText.length;
      fullText += nodeText;
      const end = fullText.length;

      const hasStyle =
        activeStyles.bold ||
        activeStyles.italic ||
        activeStyles.underline ||
        activeStyles.color ||
        activeStyles.backgroundColor;

      if (hasStyle) {
        marks.push({
          start,
          end,
          ...(activeStyles.bold ? { bold: true } : {}),
          ...(activeStyles.italic ? { italic: true } : {}),
          ...(activeStyles.underline ? { underline: true } : {}),
          ...(activeStyles.color ? { color: activeStyles.color } : {}),
          ...(activeStyles.backgroundColor ? { backgroundColor: activeStyles.backgroundColor } : {}),
        });
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "br") {
        fullText += "\n";
        return;
      }

      // If div or p, prepend a newline if not at start
      const isBlockLevel = tag === "div" || tag === "p" || tag === "li";
      if (isBlockLevel && fullText.length > 0 && !fullText.endsWith("\n")) {
        fullText += "\n";
      }

      // Inherit and merge styles
      const computedStyles = { ...activeStyles };

      if (
        tag === "b" ||
        tag === "strong" ||
        el.style.fontWeight === "bold" ||
        parseInt(el.style.fontWeight, 10) >= 600 ||
        el.classList.contains("font-bold")
      ) {
        computedStyles.bold = true;
      }
      if (
        tag === "i" ||
        tag === "em" ||
        el.style.fontStyle === "italic" ||
        el.classList.contains("italic")
      ) {
        computedStyles.italic = true;
      }
      if (
        tag === "u" ||
        el.style.textDecoration?.includes("underline") ||
        el.classList.contains("underline")
      ) {
        computedStyles.underline = true;
      }
      if (el.style.color) {
        computedStyles.color = el.style.color;
      }
      if (el.style.backgroundColor) {
        computedStyles.backgroundColor = el.style.backgroundColor;
      }

      // Traverse children
      for (let i = 0; i < el.childNodes.length; i++) {
        traverse(el.childNodes[i], computedStyles);
      }
    }
  }

  for (let i = 0; i < root.childNodes.length; i++) {
    traverse(root.childNodes[i], {});
  }

  // Merge consecutive identical marks
  const mergedMarks: Mark[] = [];
  for (const m of marks) {
    const prev = mergedMarks[mergedMarks.length - 1];
    if (
      prev &&
      prev.end === m.start &&
      Boolean(prev.bold) === Boolean(m.bold) &&
      Boolean(prev.italic) === Boolean(m.italic) &&
      Boolean(prev.underline) === Boolean(m.underline) &&
      prev.color === m.color &&
      prev.backgroundColor === m.backgroundColor
    ) {
      prev.end = m.end;
    } else {
      mergedMarks.push({ ...m });
    }
  }

  return { text: fullText, marks: mergedMarks };
}

