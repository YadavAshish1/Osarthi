/** Split a plain string on newlines and return fragments with <br> between each line */
function splitLines(text, keyPrefix) {
  return text.split('\n').flatMap((line, i, arr) => {
    const el = <span key={`${keyPrefix}-l${i}`}>{line}</span>;
    return i < arr.length - 1 ? [el, <br key={`${keyPrefix}-br${i}`} />] : [el];
  });
}

export function renderMarkedText(text = '', marks = []) {
  // No marks — just split on newlines and return with <br>
  if (!marks?.length) {
    return splitLines(text, 'plain');
  }

  // Merge marks that have identical start/end ranges to avoid
  // rendering duplicate segments when multiple marks target the same range.
  const boundaries = new Set([0, text.length]);
  marks.forEach((mark) => {
    boundaries.add(mark.start);
    boundaries.add(mark.end);
  });
  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

  const segments = [];
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    if (start >= end) continue;

    const coveringMarks = marks.filter((mark) => mark.start <= start && mark.end >= end);
    let segmentMark = null;
    if (coveringMarks.length) {
      segmentMark = coveringMarks.reduce((acc, mark) => ({ ...acc, ...mark }), {});
      delete segmentMark.start;
      delete segmentMark.end;
    }

    segments.push({ text: text.slice(start, end), mark: segmentMark, key: `seg-${start}-${end}` });
  }

  return segments.flatMap((seg) => {
    if (!seg.mark) {
      // plain text segment — preserve newlines
      return splitLines(seg.text, seg.key);
    }
    const style = {};
    if (seg.mark.backgroundColor) style.backgroundColor = seg.mark.backgroundColor;
    if (seg.mark.color) style.color = seg.mark.color;
    // marked segment — also split on newlines inside mark
    return seg.text.split('\n').flatMap((line, i, arr) => {
      const el = (
        <span
          key={`${seg.key}-l${i}`}
          style={style}
          className={`${seg.mark.bold ? 'font-bold' : ''} ${seg.mark.italic ? 'italic' : ''} ${seg.mark.underline ? 'underline' : ''} rounded`}
        >
          {line}
        </span>
      );
      return i < arr.length - 1 ? [el, <br key={`${seg.key}-br${i}`} />] : [el];
    });
  });
}
