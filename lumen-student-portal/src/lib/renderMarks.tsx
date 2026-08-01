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

function splitLines(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split("\n").flatMap((line, i, arr) => {
    const el = <span key={`${keyPrefix}-l${i}`}>{line}</span>;
    return i < arr.length - 1 ? [el, <br key={`${keyPrefix}-br${i}`} />] : [el];
  });
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
    if (seg.mark.color) style.color = seg.mark.color;

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
